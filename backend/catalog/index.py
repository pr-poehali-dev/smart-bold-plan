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
    path = event.get('path', '')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    conn = get_conn()

    try:
        user_id = get_user_id(conn, session_id)
        if not user_id:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}

        # ─── КОРЗИНА ───────────────────────────────────────────────

        # GET /catalog/cart
        if method == 'GET' and path.endswith('/cart'):
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT ci.id, s.id, s.slug, s.title, s.price_from, ci.quantity, ci.comment
                    FROM cart_items ci JOIN services s ON s.id = ci.service_id
                    WHERE ci.user_id = %s AND ci.is_active = TRUE AND ci.quantity > 0
                    ORDER BY ci.created_at
                """, (user_id,))
                rows = cur.fetchall()
            items = [{'id': r[0], 'service_id': r[1], 'slug': r[2], 'title': r[3], 'price': r[4], 'quantity': r[5], 'comment': r[6]} for r in rows]
            total = sum(i['price'] * i['quantity'] for i in items)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': items, 'total': total})}

        # POST /catalog/cart — добавить
        if method == 'POST' and path.endswith('/cart'):
            body = json.loads(event.get('body') or '{}')
            service_id = body.get('service_id')
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

        # PUT /catalog/cart — изменить количество
        if method == 'PUT' and path.endswith('/cart'):
            body = json.loads(event.get('body') or '{}')
            service_id = body.get('service_id')
            quantity = body.get('quantity', 1)
            with conn.cursor() as cur:
                cur.execute("UPDATE cart_items SET quantity = %s WHERE user_id = %s AND service_id = %s", (quantity, user_id, service_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # DELETE /catalog/cart — убрать
        if method == 'DELETE' and path.endswith('/cart'):
            body = json.loads(event.get('body') or '{}')
            service_id = body.get('service_id')
            with conn.cursor() as cur:
                cur.execute("UPDATE cart_items SET is_active = FALSE WHERE user_id = %s AND service_id = %s", (user_id, service_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # ─── ИЗБРАННОЕ ─────────────────────────────────────────────

        # GET /catalog/favorites
        if method == 'GET' and path.endswith('/favorites'):
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT f.id, s.id, s.slug, s.title, s.price_from, s.category
                    FROM favorites f JOIN services s ON s.id = f.service_id
                    WHERE f.user_id = %s AND f.is_active = TRUE
                    ORDER BY f.created_at DESC
                """, (user_id,))
                rows = cur.fetchall()
            items = [{'id': r[0], 'service_id': r[1], 'slug': r[2], 'title': r[3], 'price': r[4], 'category': r[5]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': items})}

        # POST /catalog/favorites — добавить
        if method == 'POST' and path.endswith('/favorites'):
            body = json.loads(event.get('body') or '{}')
            service_id = body.get('service_id')
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO favorites (user_id, service_id, is_active) VALUES (%s, %s, TRUE)
                    ON CONFLICT (user_id, service_id) DO UPDATE SET is_active = TRUE
                """, (user_id, service_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # DELETE /catalog/favorites — убрать
        if method == 'DELETE' and path.endswith('/favorites'):
            body = json.loads(event.get('body') or '{}')
            service_id = body.get('service_id')
            with conn.cursor() as cur:
                cur.execute("UPDATE favorites SET is_active = FALSE WHERE user_id = %s AND service_id = %s", (user_id, service_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
