import json
import os
import uuid
import base64
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """Создаёт платёж в ЮКассе по данным из формы заявки."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '')
    email = body.get('email', '')
    phone = body.get('phone', '')
    message = body.get('message', '')
    amount = str(body.get('amount', '500.00'))
    description = f"Предоплата за 3D-печать. Клиент: {name}"

    shop_id = os.environ['YUKASSA_SHOP_ID']
    secret_key = os.environ['YUKASSA_SECRET_KEY']

    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    idempotence_key = str(uuid.uuid4())

    payment_data = {
        "amount": {
            "value": amount,
            "currency": "RUB"
        },
        "confirmation": {
            "type": "redirect",
            "return_url": "https://form3d.ru/#contact"
        },
        "capture": True,
        "description": description,
        "metadata": {
            "name": name,
            "email": email,
            "phone": phone,
            "message": message
        }
    }

    if email:
        payment_data["receipt"] = {
            "customer": {"email": email},
            "items": [{
                "description": "Предоплата за изготовление изделия",
                "quantity": "1.00",
                "amount": {"value": amount, "currency": "RUB"},
                "vat_code": 1
            }]
        }

    req = urllib.request.Request(
        "https://api.yookassa.ru/v3/payments",
        data=json.dumps(payment_data).encode(),
        headers={
            "Authorization": f"Basic {credentials}",
            "Idempotence-Key": idempotence_key,
            "Content-Type": "application/json",
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    confirmation_url = result["confirmation"]["confirmation_url"]

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'payment_id': result['id'],
            'confirmation_url': confirmation_url
        })
    }
