import json
import os
import base64
import urllib.request


def handler(event: dict, context) -> dict:
    """Обрабатывает webhook-уведомления от ЮКассы об изменении статуса платежа."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    event_type = body.get('event', '')
    payment = body.get('object', {})

    if event_type == 'payment.succeeded':
        metadata = payment.get('metadata', {})
        amount = payment.get('amount', {}).get('value', '?')
        name = metadata.get('name', 'Не указано')
        email = metadata.get('email', 'Не указано')
        phone = metadata.get('phone', 'Не указано')
        message = metadata.get('message', 'Не указано')
        payment_id = payment.get('id', '')

        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')

        if bot_token and chat_id:
            text = (
                f"✅ *Оплата получена!*\n\n"
                f"💰 Сумма: {amount} ₽\n"
                f"👤 Имя: {name}\n"
                f"📧 Email: {email}\n"
                f"📞 Телефон: {phone}\n"
                f"📝 Задача: {message}\n"
                f"🆔 ID платежа: `{payment_id}`"
            )
            tg_req = urllib.request.Request(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                data=json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(tg_req)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True})
    }
