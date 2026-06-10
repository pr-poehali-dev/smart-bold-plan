import json
import os
import psycopg2

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


def handler(event: dict, context) -> dict:
    """Принимает заявку на партнёрство и сохраняет её в БД."""

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

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'id': app_id}),
    }
