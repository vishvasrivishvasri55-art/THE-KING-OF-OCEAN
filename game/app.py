from flask import Flask, request, jsonify, session, send_from_directory
import os
import database

app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = os.urandom(24)

# Initialize database
database.init_db()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if len(username) < 3 or len(password) < 4:
        return jsonify({"error": "Username must be >= 3 chars and password >= 4 chars"}), 400
        
    res = database.register_user(username, password)
    if "error" in res:
        return jsonify(res), 400
    
    session['user_id'] = res['user_id']
    session['username'] = res['username']
    return jsonify(res)

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    res = database.login_user(username, password)
    if "error" in res:
        return jsonify(res), 401
        
    session['user_id'] = res['user_id']
    session['username'] = res['username']
    return jsonify(res)

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route('/api/auth/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user_id": session['user_id'],
            "username": session['username']
        })
    return jsonify({"logged_in": False})

@app.route('/api/load', methods=['GET'])
def load_game():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = database.load_user_data(user_id)
    if not data:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify(data)

@app.route('/api/save', methods=['POST'])
def save_game():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json() or {}
    res = database.save_user_data(user_id, data)
    if "error" in res:
        return jsonify(res), 500
        
    return jsonify(res)

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    lb = database.get_leaderboard()
    return jsonify(lb)

@app.route('/api/tournament', methods=['GET'])
def tournament():
    # Simulate a weekly tournament with some static and dynamic entries
    # In a real game, this might pull from top catches this week.
    # We will generate a nice list of competitors including the player's potential place.
    username = session.get('username', 'VISHVA SRI')
    
    # Static bot entries
    competitors = [
        {"username": "DeepSeaCaptain", "score": 9850, "rank": 1},
        {"username": "WaveRider99", "score": 8200, "rank": 2},
        {"username": "ReelLegend", "score": 7550, "rank": 3},
        {"username": "FishWhisperer", "score": 6100, "rank": 4},
        {"username": "BaitMaster", "score": 4500, "rank": 5},
    ]
    
    # We'll pull the current user's score based on their level and caught fish in the database
    # Let's say score is calculated as: coins / 10 + xp
    user_score = 0
    user_id = session.get('user_id')
    if user_id:
        data = database.load_user_data(user_id)
        if data:
            # Score = level * 1000 + xp + sum(caught fish count * 50)
            caught_count = sum(fish.get('count', 0) for fish in data.get('caught', {}).values())
            user_score = data.get('level', 1) * 1000 + data.get('xp', 0) + caught_count * 50
    else:
        # Fallback for guest
        user_score = 1500 # Default guest mock score
        
    # Inject user into competitors
    competitors.append({"username": username, "score": user_score, "rank": 6})
    # Re-sort competitors
    competitors.sort(key=lambda x: x['score'], reverse=True)
    # Re-rank
    for index, comp in enumerate(competitors):
        comp['rank'] = index + 1
        
    return jsonify({
        "tournament_name": "Summer Beach Classic",
        "time_left": "3 days, 4 hours",
        "leaderboard": competitors[:8]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
