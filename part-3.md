# Part 3: Server-side Code

## Introduction

It was easy to write the client-side code of the admin and play pages when we abstracted away the server code and simply assumed its responses to emitted events. Let's see how we can use Flask to serve the web pages and Flask-SocketIO to handle socket events.

```python
from flask import Flask, render_template, request, url_for
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__) # Flask wrapper
SECRET_KEY = os.urandom(32) # a secret key for encryption purposes of size 32 bytes
app.config['SECRET_KEY'] = SECRET_KEY # secret key for 
socketio = SocketIO(app) # SocketIO wrapper
```

## Serving the pages

Flask has a really easy API for mapping URLS to pages.

```python
@app.route('/') # the landing page at domain.com/
# the @ syntax indicates a function decorator
def index():
    return render_template('index.html')

@app.route('/admin') # page for domain.com/admin
def admin():
    return render_template('admin.html')

@app.route('/<room>') # page for domain.com/<any string that isn't 'admin'>
def play(room);
    return render_template('play.html')
```

## Handling events

We first need a way to keep track who is the admin for each room. This is so rooms can be deleted if their admin disconnects and to prevent players from performing admin actions.

```python
# dictionary pairing room name to admin socket id
rooms = {}

def is_admin(id, room):
    # helper function to check if a socket is the admin of a room
    return rooms[room] == id
```

### Events

#### Connection

We simply log the connection on the server.

```python
@socketio.on('connection')
def on_connect(socket):
    print('user connected')
```

This can easily be extended to be a pop up alert. Just have the server emit a new event, perhaps called 'new_player'. Have both the admin and play pages listen for the event. Add the required CSS, HTML, and JavaScript to respond to that event with a pop up alerting that a new player has joined.

#### Disconnect

Admin disconnects are important so that leaderless rooms can be deleted.

```python
@socketio.on('disconnect')
def on_admin_disconnect():
    print('user disconnected')
    for room in rooms:
        if is_admin(request.sid, room):
            del rooms[room]
    emit('leave') # player disconnects are handled by the admin
```

While not requiring any addition to the server-side code, you could similarly extend the game by adding pop up alerts for player disconnects. Just add socket listeners to the leave event.

#### Join, Buzz

These events are only emitted by players. The common pattern is a simple unpacking of the received data and broadcasting to the entire room.

```python
@socketio.on('join')
def on_join(data):
    name = data['name']
    room = data['room']
    join_room(room) # subscribe the socket that emitted the join event to the room
    emit('join', data, room=room) # broadcast the event to the other sockets subscribed to the room
    print(f'{name} joined {room}') # log the event on the server

@socketio.on('buzz')
def on_buzz(data):
    name = data['name']
    room = data['room']
    emit('buzz', { 'name': name } , room=room)
```

#### Exists

When a player enters a room to join, their behavior is different depending on the reply from the server whether the room name is valid or not. The server simply checks the dictionary to see if the room exists.

```python
@socketio.on('exists')
def exists(data):
    room = data['room']
    emit('exists', room in rooms) # returns a Boolean indicating the existence of a key in the dictionary
```

#### Create

Creating a room needs to update the server's dictionary and classify the socket as an admin.

```python
@socketio.on('create')
def on_create(data):
    room = data['room']
    if (room in rooms or len(room) < 3): # room names have to be unique and at least 2 characters long
        emit('create', False)
    else:
        join_room(room)
        rooms[room] = request.sid # we can use request.sid to get the socket's unique id
        emit('create', True)
        print(f'created room: {room}')
```

#### Reset, Begin, Score

These events are handled similarly to 'join' and 'buzz' events. They additionally require that the socket that emitted the event be the admin of their room.

```python
@socketio.on('reset')
def on_reset(data):
    room = data['room']
    if is_admin(request.sid, room):
        emit('reset', room=room)

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
```

## Conclusion

Just add the last lines of code:

```python
if __name__ == '__main__':
    socketio.run(app, debug=True)
```

Running `python app.py` on the command line will allow you to view your game on `localhost:5000`.

I challenge you to try to add other new features to the game!