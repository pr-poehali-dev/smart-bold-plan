import json
import os
import smtplib
import urllib.request
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={SCHEMA}')


def get_user_id(session_id: str, conn) -> int | None:
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM sessions WHERE id = %s", (session_id,))
    row = cur.fetchone()
    return row[0] if row else None


def send_telegram(org_name: str, contact_name: str, email: str, phone: str, description: str):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return

    updates_url = f'https://api.telegram.org/bot{token}/getUpdates'
    with urllib.request.urlopen(urllib.request.Request(updates_url)) as resp:
        updates_data = json.loads(resp.read())

    updates = updates_data.get('result', [])
    if not updates:
        return

    chat_id = updates[-1]['message']['chat']['id']

    text = (
        f"\U0001f91d *Новая заявка на партнёрство — FORM3D*\n\n"
        f"\U0001f3e2 *Организация:* {org_name}\n"
        f"\U0001f464 *Контакт:* {contact_name}\n"
        f"\U0001f4e7 *Email:* {email}\n"
        f"\U0001f4de *Телефон:* {phone or '—'}\n"
        f"\U0001f4dd *О сотрудничестве:*\n{description or '—'}"
    )

    payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}).encode('utf-8')
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=payload,
        headers={'Content-Type': 'application/json'},
    )
    urllib.request.urlopen(req)


def send_email(org_name: str, contact_name: str, email: str, phone: str, description: str):
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')
    to_email = os.environ.get('SMTP_TO_EMAIL', '3dformrussia@gmail.com')

    if not smtp_user or not smtp_pass:
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новая заявка на партнёрство: {org_name}'
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <h2>Новая заявка на партнёрство — FORM3D</h2>
    <table cellpadding="8" style="border-collapse:collapse">
      <tr><td><b>Организация:</b></td><td>{org_name}</td></tr>
      <tr><td><b>Контактное лицо:</b></td><td>{contact_name}</td></tr>
      <tr><td><b>Email:</b></td><td>{email}</td></tr>
      <tr><td><b>Телефон:</b></td><td>{phone or '—'}</td></tr>
      <tr><td><b>О сотрудничестве:</b></td><td>{description or '—'}</td></tr>
    </table>
    """
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())


def handler(event: dict, context) -> dict:
    """Принимает заявку на партнёрство, сохраняет в БД и отправляет уведомления."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id')

    body = json.loads(event.get('body', '{}'))
    org_name = body.get('org_name', '').strip()
    contact_name = body.get('contact_name', '').strip()
    email = body.get('email', '').strip()
    phone = body.get('phone', '').strip()
    description = body.get('description', '').strip()

    if not org_name or not contact_name or not email:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заполните обязательные поля'}),
        }

    conn = get_conn()
    user_id = get_user_id(session_id, conn) if session_id else None

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO partner_applications (user_id, org_name, contact_name, email, phone, description) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        (user_id, org_name, contact_name, email, phone or None, description or None),
    )
    app_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    try:
        send_telegram(org_name, contact_name, email, phone, description)
    except Exception:
        pass

    try:
        send_email(org_name, contact_name, email, phone, description)
    except Exception:
        pass

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'id': app_id}),
    }
