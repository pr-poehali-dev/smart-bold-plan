import json
import os
import urllib.request


def handler(event: dict, context) -> dict:
    """Принимает заявку с контактной формы и отправляет её в Telegram."""

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

    token = os.environ['TELEGRAM_BOT_TOKEN']

    updates_url = f'https://api.telegram.org/bot{token}/getUpdates'
    req = urllib.request.Request(updates_url)
    with urllib.request.urlopen(req) as resp:
        updates_data = json.loads(resp.read())

    updates = updates_data.get('result', [])
    if not updates:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Напишите /start боту в Telegram и повторите'})
        }

    chat_id = updates[-1]['message']['chat']['id']

    text = (
        f"\U0001f514 *Новая заявка с сайта FORM3D*\n\n"
        f"\U0001f464 *Имя:* {name}\n"
        f"\U0001f4e7 *Email:* {email}\n"
        f"\U0001f4dd *Задача:*\n{message}"
    )

    send_url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    }).encode('utf-8')

    req = urllib.request.Request(
        send_url,
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    if not result.get('ok'):
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Ошибка отправки в Telegram'})
        }

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }
