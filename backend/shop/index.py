import json
import os
import uuid
import base64
import urllib.request
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

def handler(event: dict, context) -> dict:
    """Магазин: заказы, оплата картой Мир и СБП через ЮKassa"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod')
    path = event.get('path', '')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    conn = get_conn()

    try:
        # POST /shop/orders — создать заказ из корзины
        if method == 'POST' and path.endswith('/orders'):
            user_id = get_user_id(conn, session_id)
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}

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

        # GET /shop/orders — история заказов
        if method == 'GET' and path.endswith('/orders'):
            user_id = get_user_id(conn, session_id)
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            with conn.cursor() as cur:
                cur.execute("SELECT id, total_amount, status, payment_status, created_at FROM orders WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
                rows = cur.fetchall()
            orders = [{'id': r[0], 'total': r[1], 'status': r[2], 'payment_status': r[3], 'created_at': str(r[4])} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'orders': orders})}

        # GET /shop/orders/{id}
        if method == 'GET' and '/orders/' in path:
            user_id = get_user_id(conn, session_id)
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            order_id = path.split('/orders/')[-1].strip('/')
            with conn.cursor() as cur:
                cur.execute("SELECT id, total_amount, status, payment_status, created_at FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
                o = cur.fetchone()
                if not o:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Заказ не найден'})}
                cur.execute("SELECT title, price, quantity FROM order_items WHERE order_id = %s", (order_id,))
                items = [{'title': r[0], 'price': r[1], 'quantity': r[2]} for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': o[0], 'total': o[1], 'status': o[2], 'payment_status': o[3], 'created_at': str(o[4]), 'items': items})}

        # POST /shop/pay — создать платёж
        if method == 'POST' and path.endswith('/pay'):
            user_id = get_user_id(conn, session_id)
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            body = json.loads(event.get('body') or '{}')
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

        # GET /shop/pay-status?order_id=X
        if method == 'GET' and path.endswith('/pay-status'):
            user_id = get_user_id(conn, session_id)
            if not user_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            params = event.get('queryStringParameters') or {}
            order_id = params.get('order_id')
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

        # POST /shop/webhook — вебхук ЮKassa
        if method == 'POST' and path.endswith('/webhook'):
            body = json.loads(event.get('body') or '{}')
            event_type = body.get('event', '')
            obj = body.get('object', {})
            payment_id = obj.get('id', '')
            order_id = obj.get('metadata', {}).get('order_id')
            if event_type == 'payment.succeeded' and order_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE orders SET payment_status = 'succeeded', status = 'paid', updated_at = NOW() WHERE id = %s AND payment_id = %s", (order_id, payment_id))
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
