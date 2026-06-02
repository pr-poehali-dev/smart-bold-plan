import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """ИИ-ассистент для сайта 3DFORM — проксирует запросы к агенту на Timeweb Cloud."""

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

    payload = json.dumps({
        'messages': messages
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/236377d7-eddc-4580-a022-648059687bb3/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {os.environ['TIMEWEB_AI_TOKEN']}"
        }
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': 502,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Timeweb {e.code}', 'detail': error_body})
        }

    reply = result['choices'][0]['message']['content']

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'reply': reply})
    }