import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Принимает заявку с контактной формы и отправляет её на почту владельца студии."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body', '{}'))
    name = body.get('name', '').strip()
    email = body.get('email', '').strip()
    message = body.get('message', '').strip()

    if not name or not email or not message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заполните все поля'})
        }

    to_email = os.environ['SMTP_TO_EMAIL']

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новая заявка с сайта FORM3D от {name}'
    msg['From'] = 'noreply@poehali.dev'
    msg['To'] = to_email

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-top: 4px solid #dc2626; padding: 32px;">
            <h2 style="margin-top: 0; font-size: 22px;">Новая заявка с сайта</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #888; width: 80px;">Имя</td>
                    <td style="padding: 8px 0; font-weight: bold;">{name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888;">Почта</td>
                    <td style="padding: 8px 0;"><a href="mailto:{email}" style="color: #dc2626;">{email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888; vertical-align: top;">Задача</td>
                    <td style="padding: 8px 0;">{message}</td>
                </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">FORM3D Studio</p>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP('smtp.poehali.dev', 587) as server:
        server.sendmail('noreply@poehali.dev', to_email, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }
