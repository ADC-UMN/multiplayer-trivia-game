from flask import Flask, render_template, request, url_for
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__)
SECRET_KEY = os.urandom(32)
app.config['SECRET_KEY'] = SECRET_KEY
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")

# dictionary pairing room name to admin socket id
rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/<room>')
def play(room):
    return render_template('play.html')

def is_admin(id, room):
    return rooms[room] == id

@socketio.on('connection')
def on_connect(socket):
    print('user connected')

@socketio.on('disconnect')
def on_admin_disconnect():
    print('user disconnected')
    for room in rooms:
        if is_admin(request.sid, room):
            del rooms[room]
    emit('leave')

# only emitted by players

@socketio.on('join')
def on_join(data):
    name = data['name']
    room = data['room']
    join_room(room)
    emit('join', data, room=room)
    print(f'{name} joined {room}')

@socketio.on('buzz')
def on_buzz(data):
    name = data['name']
    room = data['room']
    emit('buzz', { 'name': name } , room=room)

@socketio.on('exists')
def exists(data):
    room = data['room']
    emit('exists', room in rooms)

# only emitted by admin

@socketio.on('create')
def on_create(data):
    room = data['room']
    if (room in rooms or len(room) < 3):
        emit('create', False)
    else:
        join_room(room)
        rooms[room] = request.sid
        emit('create', True)
        print(f'created room: {room}')

@socketio.on('reset')
def on_reset(data):
    room = data['room']
    res = data['res']
    if is_admin(request.sid, room):
        emit('reset', { 'res': res }, room=room)

@socketio.on('begin')
def on_begin(data):
    room = data['room']
    if is_admin(request.sid, room):
        emit('begin', room=room)

@socketio.on('score')
def on_score(data):
    leaderboard = data['leaderboard']
    room = data['room']
    if is_admin(request.sid, room):
        emit('score', { 'leaderboard' : leaderboard }, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0')