import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def get_user_id(conn, session_id: str):
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
        row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """Корзина и избранное: добавить, удалить, получить список"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    # Определяем ресурс надёжно: query-параметр -> поле тела -> путь
    resource = params.get('resource') or body.get('resource')
    if not resource:
        resource = 'favorites' if 'favorites' in path else 'cart'

    session_id = event.get('headers', {}).get('X-Session-Id', '')
    conn = get_conn()

    try:
        user_id = get_user_id(conn, session_id)
        if not user_id:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}

        service_id = body.get('service_id')

        # ─── КОРЗИНА ───────────────────────────────────────────────
        if resource == 'cart':
            if method == 'GET':
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT ci.id, s.id, s.slug, s.title, s.price_from, ci.quantity, ci.comment, s.description, s.category
                        FROM cart_items ci JOIN services s ON s.id = ci.service_id
                        WHERE ci.user_id = %s AND ci.is_active = TRUE AND ci.quantity > 0
                        ORDER BY ci.created_at
                    """, (user_id,))
                    rows = cur.fetchall()
                items = [{'id': r[0], 'service_id': r[1], 'slug': r[2], 'title': r[3], 'price': r[4], 'quantity': r[5], 'comment': r[6], 'description': r[7], 'category': r[8]} for r in rows]
                total = sum(i['price'] * i['quantity'] for i in items)
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': items, 'total': total})}

            if method == 'POST':
                quantity = body.get('quantity', 1)
                comment = body.get('comment', '')
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO cart_items (user_id, service_id, quantity, comment, is_active)
                        VALUES (%s, %s, %s, %s, TRUE)
                        ON CONFLICT (user_id, service_id) DO UPDATE SET quantity = cart_items.quantity + 1, is_active = TRUE
                    """, (user_id, service_id, quantity, comment))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

            if method == 'PUT':
                quantity = body.get('quantity', 1)
                with conn.cursor() as cur:
                    cur.execute("UPDATE cart_items SET quantity = %s WHERE user_id = %s AND service_id = %s", (quantity, user_id, service_id))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

            if method == 'DELETE':
                with conn.cursor() as cur:
                    cur.execute("UPDATE cart_items SET is_active = FALSE WHERE user_id = %s AND service_id = %s", (user_id, service_id))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # ─── ИЗБРАННОЕ ─────────────────────────────────────────────
        if resource == 'favorites':
            if method == 'GET':
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT f.id, s.id, s.slug, s.title, s.price_from, s.category, s.description
                        FROM favorites f JOIN services s ON s.id = f.service_id
                        WHERE f.user_id = %s AND f.is_active = TRUE
                        ORDER BY f.created_at DESC
                    """, (user_id,))
                    rows = cur.fetchall()
                items = [{'id': r[0], 'service_id': r[1], 'slug': r[2], 'title': r[3], 'price': r[4], 'category': r[5], 'description': r[6]} for r in rows]
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': items})}

            if method == 'POST':
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO favorites (user_id, service_id, is_active) VALUES (%s, %s, TRUE)
                        ON CONFLICT (user_id, service_id) DO UPDATE SET is_active = TRUE
                    """, (user_id, service_id))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

            if method == 'DELETE':
                with conn.cursor() as cur:
                    cur.execute("UPDATE favorites SET is_active = FALSE WHERE user_id = %s AND service_id = %s", (user_id, service_id))
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
