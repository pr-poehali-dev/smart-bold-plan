import urllib.request
import base64

GLB_URL = 'https://cdn.poehali.dev/projects/9a10cdd1-ec9c-4741-9bc3-7c69454ec00a/bucket/21d8c115-7efe-495b-b890-e9f2eff6ed19.glb'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Прокси для GLB-файла лисёнка — обходит CORS с внешних доменов"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    with urllib.request.urlopen(GLB_URL) as resp:
        data = resp.read()

    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'model/gltf-binary', 'Cache-Control': 'public, max-age=86400'},
        'body': base64.b64encode(data).decode('utf-8'),
        'isBase64Encoded': True,
    }