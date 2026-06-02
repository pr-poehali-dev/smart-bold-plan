import json
import os
import urllib.request


def handler(event: dict, context) -> dict:
    """ИИ-ассистент для сайта 3DFORM — отвечает на вопросы о 3D-печати и услугах компании."""

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
    messages = body.get('messages', [])

    if not messages:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Нет сообщений'})
        }

    system_prompt = (
        "Ты — ИИ-ассистент компании 3DFORM, которая занимается 3D-печатью и моделированием. "
        "Помогаешь клиентам с вопросами о 3D-печати, материалах, сроках и стоимости услуг. "
        "Отвечай дружелюбно и профессионально на русском языке. "
        "Если клиент хочет сделать заказ или узнать точную цену — предложи заполнить форму на сайте или написать в контакты."
    )

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'system', 'content': system_prompt}] + messages,
        'max_tokens': 500,
        'temperature': 0.7
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}"
        }
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    reply = result['choices'][0]['message']['content']

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'reply': reply})
    }
