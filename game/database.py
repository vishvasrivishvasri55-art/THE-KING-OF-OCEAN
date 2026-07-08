import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'fishing_game.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            coins INTEGER DEFAULT 100,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Upgrades table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_upgrades (
            user_id INTEGER,
            rod TEXT DEFAULT 'wooden',
            reel TEXT DEFAULT 'basic',
            hook TEXT DEFAULT 'small',
            line TEXT DEFAULT 'nylon',
            bait TEXT DEFAULT 'worm',
            PRIMARY KEY (user_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Caught fish table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_caught (
            user_id INTEGER,
            fish_name TEXT,
            count INTEGER DEFAULT 0,
            max_weight REAL DEFAULT 0.0,
            max_length REAL DEFAULT 0.0,
            PRIMARY KEY (user_id, fish_name),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Achievements table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_achievements (
            user_id INTEGER,
            achievement_id TEXT,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, achievement_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Locations unlocked table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_locations (
            user_id INTEGER,
            location_id TEXT,
            PRIMARY KEY (user_id, location_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def register_user(username, password):
    if not username or not password:
        return {"error": "Username and password are required."}
    
    pw_hash = generate_password_hash(password)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, pw_hash)
        )
        user_id = cursor.lastrowid
        # Initialize basic upgrades and location
        cursor.execute('INSERT INTO user_upgrades (user_id) VALUES (?)', (user_id,))
        cursor.execute('INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)', (user_id, 'beach_shore'))
        conn.commit()
        return {"success": True, "user_id": user_id, "username": username}
    except sqlite3.IntegrityError:
        return {"error": "Username already exists."}
    finally:
        conn.close()

def login_user(username, password):
    if not username or not password:
        return {"error": "Username and password are required."}
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        return {
            "success": True,
            "user_id": user['id'],
            "username": user['username']
        }
    return {"error": "Invalid username or password."}

def load_user_data(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # User basic info
    cursor.execute('SELECT username, coins, xp, level FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return None
    
    # Upgrades
    cursor.execute('SELECT rod, reel, hook, line, bait FROM user_upgrades WHERE user_id = ?', (user_id,))
    upgrades = cursor.fetchone()
    upgrades_dict = dict(upgrades) if upgrades else {
        "rod": "wooden", "reel": "basic", "hook": "small", "line": "nylon", "bait": "worm"
    }
    
    # Caught fish
    cursor.execute('SELECT fish_name, count, max_weight, max_length FROM user_caught WHERE user_id = ?', (user_id,))
    caught_rows = cursor.fetchall()
    caught_dict = {
        row['fish_name']: {
            "count": row['count'],
            "max_weight": row['max_weight'],
            "max_length": row['max_length']
        }
        for row in caught_rows
    }
    
    # Achievements
    cursor.execute('SELECT achievement_id FROM user_achievements WHERE user_id = ?', (user_id,))
    achievements = [row['achievement_id'] for row in cursor.fetchall()]
    
    # Locations
    cursor.execute('SELECT location_id FROM user_locations WHERE user_id = ?', (user_id,))
    locations = [row['location_id'] for row in cursor.fetchall()]
    if 'beach_shore' not in locations:
        locations.append('beach_shore')
        
    conn.close()
    
    return {
        "username": user['username'],
        "coins": user['coins'],
        "xp": user['xp'],
        "level": user['level'],
        "upgrades": upgrades_dict,
        "caught": caught_dict,
        "achievements": achievements,
        "locations": locations
    }

def save_user_data(user_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Update users table
        cursor.execute(
            'UPDATE users SET coins = ?, xp = ?, level = ? WHERE id = ?',
            (data.get('coins', 100), data.get('xp', 0), data.get('level', 1), user_id)
        )
        
        # Update upgrades table
        upgrades = data.get('upgrades', {})
        cursor.execute('''
            INSERT INTO user_upgrades (user_id, rod, reel, hook, line, bait)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                rod=excluded.rod, reel=excluded.reel, hook=excluded.hook, line=excluded.line, bait=excluded.bait
        ''', (
            user_id,
            upgrades.get('rod', 'wooden'),
            upgrades.get('reel', 'basic'),
            upgrades.get('hook', 'small'),
            upgrades.get('line', 'nylon'),
            upgrades.get('bait', 'worm')
        ))
        
        # Update caught fish table (clear and re-insert or use UPSERT)
        caught = data.get('caught', {})
        for fish_name, fish_data in caught.items():
            cursor.execute('''
                INSERT INTO user_caught (user_id, fish_name, count, max_weight, max_length)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, fish_name) DO UPDATE SET
                    count=excluded.count,
                    max_weight=MAX(user_caught.max_weight, excluded.max_weight),
                    max_length=MAX(user_caught.max_length, excluded.max_length)
            ''', (
                user_id,
                fish_name,
                fish_data.get('count', 0),
                fish_data.get('max_weight', 0.0),
                fish_data.get('max_length', 0.0)
            ))
            
        # Update achievements table
        achievements = data.get('achievements', [])
        for ach in achievements:
            cursor.execute('''
                INSERT OR IGNORE INTO user_achievements (user_id, achievement_id)
                VALUES (?, ?)
            ''', (user_id, ach))
            
        # Update locations table
        locations = data.get('locations', ['beach_shore'])
        for loc in locations:
            cursor.execute('''
                INSERT OR IGNORE INTO user_locations (user_id, location_id)
                VALUES (?, ?)
            ''', (user_id, loc))
            
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        conn.close()

def get_leaderboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT username, level, xp, coins
        FROM users
        ORDER BY level DESC, xp DESC, coins DESC
        LIMIT 10
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
