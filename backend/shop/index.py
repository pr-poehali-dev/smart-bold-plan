import json
import os
import uuid
import base64
import urllib.request
import urllib.error
import urllib.parse
import re
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def get_user_id(conn, session_id: str):
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
        row = cur.fetchone()
    return row[0] if row else None

def yukassa_request(method: str, path: str, data: dict = None) -> dict:
    shop_id = os.environ['YUKASSA_SHOP_ID']
    secret_key = os.environ['YUKASSA_SECRET_KEY']
    creds = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    url = f"https://api.yookassa.ru/v3{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header('Authorization', f'Basic {creds}')
    req.add_header('Content-Type', 'application/json')
    if data:
        req.add_header('Idempotence-Key', str(uuid.uuid4()))
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# ─── ОТСЛЕЖИВАНИЕ ДОСТАВКИ ───────────────────────────────────────

def track_cdek(tracking_number: str) -> dict:
    """Статус заказа в СДЭК по трек-номеру через REST API v2"""
    client_id = os.environ.get('CDEK_CLIENT_ID')
    client_secret = os.environ.get('CDEK_CLIENT_SECRET')
    if not client_id or not client_secret:
        return {'status': 'Не подключено', 'history': [], 'error': 'no_credentials'}
    try:
        # 1. Получаем токен
        token_data = urllib.parse.urlencode({
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
        }).encode()
        token_req = urllib.request.Request('https://api.cdek.ru/v2/oauth/token', data=token_data, method='POST')
        token_req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        with urllib.request.urlopen(token_req, timeout=10) as r:
            token = json.loads(r.read()).get('access_token', '')

        # 2. Получаем информацию о заказе по cdek_number
        info_req = urllib.request.Request(
            f'https://api.cdek.ru/v2/orders?cdek_number={tracking_number}',
            method='GET'
        )
        info_req.add_header('Authorization', f'Bearer {token}')
        with urllib.request.urlopen(info_req, timeout=10) as r:
            data = json.loads(r.read())

        entity = data.get('entity', {})
        statuses = entity.get('statuses', [])
        history = [{'date': s.get('date_time', ''), 'name': s.get('name', '')} for s in statuses]
        current = statuses[0].get('name', 'Информация недоступна') if statuses else 'Информация недоступна'
        return {'status': current, 'history': history}
    except Exception as e:
        return {'status': 'Не удалось получить статус', 'history': [], 'error': str(e)}


def track_pochta(tracking_number: str) -> dict:
    """Статус отправления Почты России по трек-номеру (SOAP-сервис трекинга)"""
    login = os.environ.get('POCHTA_TRACK_LOGIN')
    password = os.environ.get('POCHTA_TRACK_PASSWORD')
    if not login or not password:
        return {'status': 'Не подключено', 'history': [], 'error': 'no_credentials'}
    try:
        soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
 xmlns:oper="http://russianpost.org/operationhistory"
 xmlns:data="http://russianpost.org/operationhistory/data">
  <soap:Header/>
  <soap:Body>
    <oper:getOperationHistory>
      <data:OperationHistoryRequest>
        <data:Barcode>{tracking_number}</data:Barcode>
        <data:MessageType>0</data:MessageType>
        <data:Language>RUS</data:Language>
      </data:OperationHistoryRequest>
      <data:AuthorizationHeader soapenv:mustUnderstand="1"
       xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <data:login>{login}</data:login>
        <data:password>{password}</data:password>
      </data:AuthorizationHeader>
    </oper:getOperationHistory>
  </soap:Body>
</soap:Envelope>"""
        req = urllib.request.Request(
            'https://tracking.russianpost.ru/rtm34',
            data=soap_body.encode('utf-8'),
            method='POST'
        )
        req.add_header('Content-Type', 'text/xml; charset=utf-8')
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read().decode('utf-8')

        names = re.findall(r'<[^>]*OperType[^>]*>.*?<[^>]*Name[^>]*>([^<]+)', raw)
        attrs = re.findall(r'<[^>]*OperAttr[^>]*>.*?<[^>]*Name[^>]*>([^<]+)', raw)
        dates = re.findall(r'<[^>]*OperDate[^>]*>([^<]+)', raw)
        history = []
        for i in range(len(names)):
            label = names[i]
            if i < len(attrs):
                label = f'{names[i]} — {attrs[i]}'
            history.append({'date': dates[i] if i < len(dates) else '', 'name': label})
        current = history[-1]['name'] if history else 'Информация недоступна'
        return {'status': current, 'history': history}
    except Exception as e:
        return {'status': 'Не удалось получить статус', 'history': [], 'error': str(e)}


def get_tracking(carrier: str, tracking_number: str) -> dict:
    if not carrier or not tracking_number:
        return {'status': 'Трек-номер не назначен', 'history': []}
    if carrier == 'cdek':
        return track_cdek(tracking_number)
    if carrier == 'pochta':
        return track_pochta(tracking_number)
    return {'status': 'Неизвестная служба', 'history': []}


def handler(event: dict, context) -> dict:
    """Магазин: заказы, оплата ЮKassa, отслеживание доставки СДЭК и Почты России"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod')
    path = event.get('path', '') or ''
    params = event.get('queryStringParameters') or {}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    # Определяем действие: query 'action' -> body 'action' -> по пути
    action = params.get('action') or body.get('action')
    if not action:
        if path.endswith('/webhook'):
            action = 'webhook'
        elif path.endswith('/pay-status'):
            action = 'pay_status'
        elif path.endswith('/pay'):
            action = 'pay'
        elif '/orders/' in path:
            action = 'order'
        elif path.endswith('/orders'):
            action = 'orders'

    session_id = event.get('headers', {}).get('X-Session-Id', '')
    conn = get_conn()

    try:
        # POST вебхук ЮKassa (без авторизации)
        if action == 'webhook':
            event_type = body.get('event', '')
            obj = body.get('object', {})
            payment_id = obj.get('id', '')
            order_id = obj.get('metadata', {}).get('order_id')
            if event_type == 'payment.succeeded' and order_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE orders SET payment_status = 'succeeded', status = 'paid', updated_at = NOW() WHERE id = %s AND payment_id = %s", (order_id, payment_id))
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        user_id = get_user_id(conn, session_id)
        if not user_id:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}

        # Создать заказ из корзины
        if action == 'create_order' or (action == 'orders' and method == 'POST'):
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT ci.service_id, s.title, s.price_from, ci.quantity
                    FROM cart_items ci JOIN services s ON s.id = ci.service_id
                    WHERE ci.user_id = %s AND ci.is_active = TRUE AND ci.quantity > 0
                """, (user_id,))
                cart = cur.fetchall()
            if not cart:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Корзина пуста'})}
            total = sum(r[2] * r[3] for r in cart)
            with conn.cursor() as cur:
                cur.execute("INSERT INTO orders (user_id, total_amount) VALUES (%s, %s) RETURNING id", (user_id, total))
                order_id = cur.fetchone()[0]
                for r in cart:
                    cur.execute("INSERT INTO order_items (order_id, service_id, title, price, quantity) VALUES (%s, %s, %s, %s, %s)", (order_id, r[0], r[1], r[2], r[3]))
                cur.execute("UPDATE cart_items SET is_active = FALSE WHERE user_id = %s", (user_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'order_id': order_id, 'total': total})}

        # Список заказов
        if action == 'orders' and method == 'GET':
            with conn.cursor() as cur:
                cur.execute("SELECT id, total_amount, status, payment_status, created_at, carrier, tracking_number FROM orders WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
                rows = cur.fetchall()
            orders = [{'id': r[0], 'total': r[1], 'status': r[2], 'payment_status': r[3], 'created_at': str(r[4]), 'carrier': r[5], 'tracking_number': r[6]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'orders': orders})}

        # Детали заказа
        if action == 'order':
            order_id = params.get('order_id') or body.get('order_id')
            if not order_id and '/orders/' in path:
                order_id = path.split('/orders/')[-1].strip('/')
            with conn.cursor() as cur:
                cur.execute("SELECT id, total_amount, status, payment_status, created_at, carrier, tracking_number FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
                o = cur.fetchone()
                if not o:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заказ не найден'})}
                cur.execute("SELECT title, price, quantity FROM order_items WHERE order_id = %s", (order_id,))
                items = [{'title': r[0], 'price': r[1], 'quantity': r[2]} for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'id': o[0], 'total': o[1], 'status': o[2], 'payment_status': o[3],
                'created_at': str(o[4]), 'items': items,
                'carrier': o[5], 'tracking_number': o[6],
            })}

        # Назначить трек-номер заказу (для администратора/владельца)
        if action == 'set_tracking':
            order_id = body.get('order_id')
            carrier = body.get('carrier')
            tracking_number = body.get('tracking_number')
            with conn.cursor() as cur:
                cur.execute("UPDATE orders SET carrier = %s, tracking_number = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                            (carrier, tracking_number, order_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # Получить статус доставки заказа
        if action == 'track':
            order_id = params.get('order_id') or body.get('order_id')
            with conn.cursor() as cur:
                cur.execute("SELECT carrier, tracking_number FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
                row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заказ не найден'})}
            result = get_tracking(row[0], row[1])
            # Сохраняем последний статус
            if result.get('status'):
                with conn.cursor() as cur:
                    cur.execute("UPDATE orders SET delivery_status = %s WHERE id = %s", (result['status'][:255], order_id))
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'carrier': row[0], 'tracking_number': row[1], **result
            })}

        # Создать платёж
        if action == 'pay':
            order_id = body.get('order_id')
            payment_type = body.get('payment_type', 'bank_card')
            return_url = body.get('return_url', 'https://form3d.poehali.dev/orders')
            with conn.cursor() as cur:
                cur.execute("SELECT total_amount FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
                row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заказ не найден'})}
            amount = row[0]
            payment_method = {'type': 'sbp'} if payment_type == 'sbp' else {'type': 'bank_card'}
            payment_data = {
                'amount': {'value': f'{amount}.00', 'currency': 'RUB'},
                'payment_method_data': payment_method,
                'confirmation': {'type': 'redirect', 'return_url': return_url},
                'description': f'Заказ №{order_id} — FORM3D',
                'capture': True,
                'metadata': {'order_id': str(order_id)},
            }
            result = yukassa_request('POST', '/payments', payment_data)
            with conn.cursor() as cur:
                cur.execute("UPDATE orders SET payment_id = %s, payment_status = 'waiting' WHERE id = %s", (result['id'], order_id))
            conn.commit()
            confirmation_url = result.get('confirmation', {}).get('confirmation_url', '')
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'payment_id': result['id'], 'confirmation_url': confirmation_url})}

        # Статус платежа
        if action == 'pay_status':
            order_id = params.get('order_id') or body.get('order_id')
            with conn.cursor() as cur:
                cur.execute("SELECT payment_id, payment_status FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
                row = cur.fetchone()
            if not row or not row[0]:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Платёж не найден'})}
            result = yukassa_request('GET', f'/payments/{row[0]}')
            yk_status = result.get('status', '')
            if yk_status == 'succeeded' and row[1] != 'succeeded':
                with conn.cursor() as cur:
                    cur.execute("UPDATE orders SET payment_status = 'succeeded', status = 'paid', updated_at = NOW() WHERE id = %s", (order_id,))
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'payment_status': yk_status})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()