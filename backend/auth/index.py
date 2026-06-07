import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_session(conn, user_id: int) -> str:
    session_id = secrets.token_hex(32)
    with conn.cursor() as cur:
        cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id))
    conn.commit()
    return session_id

def handler(event: dict, context) -> dict:
    """Аутентификация: регистрация, вход, выход, получение профиля. Все запросы POST на корень с полем action."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': 'ok'}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')
    session_id = body.get('session_id', '') or event.get('headers', {}).get('X-Session-Id', '')

    conn = get_conn()

    try:
        # register
        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()

            if not email or not password:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email и пароль обязательны'})}

            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'error': 'Email уже зарегистрирован'})}
                cur.execute("INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id", (email, hash_password(password), name))
                user_id = cur.fetchone()[0]
            conn.commit()

            sid = make_session(conn, user_id)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'session_id': sid, 'user': {'id': user_id, 'email': email, 'name': name}})}

        # login
        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')

            with conn.cursor() as cur:
                cur.execute("SELECT id, name, email FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
                row = cur.fetchone()

            if not row:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный email или пароль'})}

            sid = make_session(conn, row[0])
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'session_id': sid, 'user': {'id': row[0], 'name': row[1], 'email': row[2]}})}

        # me
        if action == 'me':
            if not session_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.email, u.name, u.phone FROM users u
                    JOIN sessions s ON s.user_id = u.id
                    WHERE s.id = %s AND s.expires_at > NOW()
                """, (session_id,))
                row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Сессия истекла'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': row[0], 'email': row[1], 'name': row[2], 'phone': row[3]})}

        # update
        if action == 'update':
            if not session_id:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Сессия истекла'})}
                user_id = row[0]
                cur.execute("UPDATE users SET name = %s, phone = %s WHERE id = %s", (body.get('name'), body.get('phone'), user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # logout
        if action == 'logout':
            if session_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        conn.close()
