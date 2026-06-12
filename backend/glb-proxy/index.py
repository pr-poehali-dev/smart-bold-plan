import urllib.request
import base64

GLB_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb'

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