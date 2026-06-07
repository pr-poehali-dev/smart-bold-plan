import json
import os
import hashlib
import secrets
import random
import urllib.request
import urllib.parse
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={SCHEMA}")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_session(conn, user_id: int) -> str:
    session_id = secrets.token_hex(32)
    with conn.cursor() as cur:
        cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id))
    conn.commit()
    return session_id

def get_or_create_oauth_user(conn, provider: str, oauth_id: str, email: str, name: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE oauth_provider = %s AND oauth_id = %s", (provider, oauth_id))
        row = cur.fetchone()
        if row:
            return row[0]
        if email:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if row:
                cur.execute("UPDATE users SET oauth_provider = %s, oauth_id = %s WHERE id = %s", (provider, oauth_id, row[0]))
                conn.commit()
                return row[0]
        cur.execute(
            "INSERT INTO users (email, password_hash, name, oauth_provider, oauth_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (email or None, '', name or '', provider, oauth_id)
        )
        user_id = cur.fetchone()[0]
    conn.commit()
    return user_id

def send_sms(phone: str, code: str):
    login = os.environ.get('SMSC_LOGIN', '')
    password = os.environ.get('SMSC_PASSWORD', '')
    message = f"Ваш код входа на FORM3D: {code}"
    params = urllib.parse.urlencode({
        'login': login,
        'psw': password,
        'phones': phone,
        'mes': message,
        'fmt': 3,
    })
    url = f"https://smsc.ru/sys/send.php?{params}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())

def r(status: int, hdrs: dict, data: dict) -> dict:
    return {'statusCode': status, 'headers': hdrs, 'body': json.dumps(data, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    """Аутентификация: email/пароль, OAuth (Яндекс, ВК), SMS по телефону."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': 'ok'}

    # GET редирект на OAuth провайдера
    if event.get('httpMethod') == 'GET':
        params = event.get('queryStringParameters') or {}
        provider = params.get('provider', '')
        redirect_uri = params.get('redirect_uri', '')
        if provider == 'yandex':
            client_id = os.environ.get('YANDEX_CLIENT_ID', '')
            url = f"https://oauth.yandex.ru/authorize?response_type=code&client_id={client_id}&redirect_uri={urllib.parse.quote(redirect_uri, safe='')}&state=yandex"
            return {'statusCode': 302, 'headers': {**headers, 'Location': url}, 'body': ''}
        elif provider == 'vk':
            client_id = os.environ.get('VK_APP_ID', '')
            url = f"https://oauth.vk.com/authorize?client_id={client_id}&redirect_uri={urllib.parse.quote(redirect_uri, safe='')}&response_type=code&scope=email&state=vk&v=5.131"
            return {'statusCode': 302, 'headers': {**headers, 'Location': url}, 'body': ''}
        return {'statusCode': 400, 'headers': headers, 'body': 'Unknown provider'}

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
                return r(400, headers, {'error': 'Email и пароль обязательны'})
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return r(409, headers, {'error': 'Email уже зарегистрирован'})
                cur.execute("INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id", (email, hash_password(password), name))
                user_id = cur.fetchone()[0]
            conn.commit()
            sid = make_session(conn, user_id)
            return r(200, headers, {'session_id': sid, 'user': {'id': user_id, 'email': email, 'name': name}})

        # login
        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, email FROM users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
                row = cur.fetchone()
            if not row:
                return r(401, headers, {'error': 'Неверный email или пароль'})
            sid = make_session(conn, row[0])
            return r(200, headers, {'session_id': sid, 'user': {'id': row[0], 'name': row[1], 'email': row[2]}})

        # me
        if action == 'me':
            if not session_id:
                return r(401, headers, {'error': 'Не авторизован'})
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.email, u.name, u.phone FROM users u
                    JOIN sessions s ON s.user_id = u.id
                    WHERE s.id = %s AND s.expires_at > NOW()
                """, (session_id,))
                row = cur.fetchone()
            if not row:
                return r(401, headers, {'error': 'Сессия истекла'})
            return r(200, headers, {'id': row[0], 'email': row[1], 'name': row[2], 'phone': row[3]})

        # update
        if action == 'update':
            if not session_id:
                return r(401, headers, {'error': 'Не авторизован'})
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
                row = cur.fetchone()
                if not row:
                    return r(401, headers, {'error': 'Сессия истекла'})
                user_id = row[0]
                cur.execute("UPDATE users SET name = %s, phone = %s WHERE id = %s", (body.get('name'), body.get('phone'), user_id))
            conn.commit()
            return r(200, headers, {'ok': True})

        # logout
        if action == 'logout':
            if session_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            return r(200, headers, {'ok': True})

        # oauth_callback — обмен кода на токен и получение профиля
        if action == 'oauth_callback':
            provider = body.get('provider', '')
            code = body.get('code', '')
            redirect_uri = body.get('redirect_uri', '')
            if not provider or not code:
                return r(400, headers, {'error': 'Не указан провайдер или код'})

            if provider == 'yandex':
                # Обмен кода на токен
                token_data = urllib.parse.urlencode({
                    'grant_type': 'authorization_code',
                    'code': code,
                    'client_id': os.environ.get('YANDEX_CLIENT_ID', ''),
                    'client_secret': os.environ.get('YANDEX_CLIENT_SECRET', ''),
                }).encode()
                req = urllib.request.Request('https://oauth.yandex.ru/token', data=token_data, method='POST')
                req.add_header('Content-Type', 'application/x-www-form-urlencoded')
                with urllib.request.urlopen(req, timeout=10) as resp:
                    token_resp = json.loads(resp.read().decode())
                access_token = token_resp.get('access_token', '')
                # Получаем профиль
                info_req = urllib.request.Request('https://login.yandex.ru/info?format=json')
                info_req.add_header('Authorization', f'OAuth {access_token}')
                with urllib.request.urlopen(info_req, timeout=10) as resp:
                    profile = json.loads(resp.read().decode())
                oauth_id = str(profile.get('id', ''))
                email = profile.get('default_email', '')
                name = profile.get('real_name') or profile.get('display_name', '')

            elif provider == 'vk':
                # Обмен кода на токен
                params = urllib.parse.urlencode({
                    'client_id': os.environ.get('VK_APP_ID', ''),
                    'client_secret': os.environ.get('VK_APP_SECRET', ''),
                    'redirect_uri': redirect_uri,
                    'code': code,
                })
                req = urllib.request.Request(f'https://oauth.vk.com/access_token?{params}')
                with urllib.request.urlopen(req, timeout=10) as resp:
                    token_resp = json.loads(resp.read().decode())
                access_token = token_resp.get('access_token', '')
                vk_user_id = token_resp.get('user_id', '')
                email = token_resp.get('email', '')
                # Получаем профиль
                api_params = urllib.parse.urlencode({
                    'user_ids': vk_user_id,
                    'fields': 'first_name,last_name',
                    'access_token': access_token,
                    'v': '5.131',
                })
                info_req = urllib.request.Request(f'https://api.vk.com/method/users.get?{api_params}')
                with urllib.request.urlopen(info_req, timeout=10) as resp:
                    vk_resp = json.loads(resp.read().decode())
                user_info = vk_resp.get('response', [{}])[0]
                oauth_id = str(vk_user_id)
                name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()
            else:
                return r(400, headers, {'error': 'Неизвестный провайдер'})

            user_id = get_or_create_oauth_user(conn, provider, oauth_id, email, name)
            sid = make_session(conn, user_id)
            with conn.cursor() as cur:
                cur.execute("SELECT id, email, name, phone FROM users WHERE id = %s", (user_id,))
                u = cur.fetchone()
            return r(200, headers, {'session_id': sid, 'user': {'id': u[0], 'email': u[1], 'name': u[2], 'phone': u[3]}})

        # sms_send — отправка кода на телефон
        if action == 'sms_send':
            phone = body.get('phone', '').strip()
            if not phone:
                return r(400, headers, {'error': 'Укажите номер телефона'})
            # Нормализуем номер
            phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            if phone.startswith('8'):
                phone = '+7' + phone[1:]
            if not phone.startswith('+'):
                phone = '+' + phone
            code = str(random.randint(100000, 999999))
            with conn.cursor() as cur:
                cur.execute("UPDATE sms_codes SET used = TRUE WHERE phone = %s AND used = FALSE", (phone,))
                cur.execute("INSERT INTO sms_codes (phone, code) VALUES (%s, %s)", (phone, code))
            conn.commit()
            send_sms(phone, code)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        # sms_verify — проверка кода
        if action == 'sms_verify':
            phone = body.get('phone', '').strip()
            code = body.get('code', '').strip()
            phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            if phone.startswith('8'):
                phone = '+7' + phone[1:]
            if not phone.startswith('+'):
                phone = '+' + phone
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM sms_codes
                    WHERE phone = %s AND code = %s AND used = FALSE AND expires_at > NOW()
                    ORDER BY created_at DESC LIMIT 1
                """, (phone, code))
                row = cur.fetchone()
                if not row:
                    return r(401, headers, {'error': 'Неверный или истёкший код'})
                cur.execute("UPDATE sms_codes SET used = TRUE WHERE id = %s", (row[0],))
                # Ищем или создаём пользователя по телефону
                cur.execute("SELECT id, email, name FROM users WHERE phone = %s", (phone,))
                user_row = cur.fetchone()
                if user_row:
                    user_id = user_row[0]
                else:
                    cur.execute(
                        "INSERT INTO users (email, password_hash, phone, name) VALUES (NULL, '', %s, '') RETURNING id",
                        (phone,)
                    )
                    user_id = cur.fetchone()[0]
            conn.commit()
            with conn.cursor() as cur:
                cur.execute("SELECT id, email, name, phone FROM users WHERE id = %s", (user_id,))
                u = cur.fetchone()
            sid = make_session(conn, user_id)
            return r(200, headers, {'session_id': sid, 'user': {'id': u[0], 'email': u[1], 'name': u[2], 'phone': u[3]}})

        return r(400, headers, {'error': 'Неизвестный action'})

    finally:
        conn.close()