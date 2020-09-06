# Part 1: Jinja Templating

## Introduction

Jinja is a text templating engine. It can work with any text-based format, but we'll work with HTML here. You can write normal HTML in the template as well as add variables between `{{ }}` and expressions between `{% %}`. Let's look at the template in `layout.html`:

```html
<!DOCTYPE html>
<html>
    <head>
        {% block head %}
        <title>{% block title %}{% endblock %}</title>
        <meta charset="utf-8">
        <meta http-equiv="X-US-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/static/style.css">
        <link rel="shortcut icon" href="/static/favicon.ico" type="image/x-icon">
        <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
        {% endblock %}
    </head>
    <body>
        <div class="container" id="content">
            {% block content %}
            {% endblock %}
        </div>
        <script src="//cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js" integrity="sha256-yr4fRk/GU1ehYJPAs8P4JlTgu0Hdsp4ZKrx8bDEDC3I=" crossorigin="anonymous"></script>
        <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
        {% block scripts %}
        {% endblock %}
    </body>
</html>
```

This template uses a special type of expression called blocks. They're good for taking advantage of template inheritance. So `layout.html` can take care of this boilerplate while the other templates can fill out the `head`, `title`, `content`, and `scripts` blocks. The SocketIO and jQuery JavaScript libraries are both required.

## Child Templates

### Admin

```html
{% extends "layout.html" %}
{% block title %} WhoDaMan - Admin {% endblock %}
{% block head %}
    {{ super() }}
{% endblock %}
{% block content %}
    <form id="start" class="center">
      <main>
          <header>
            <h1>WhoDaMan</h1>
          </header>
          <input id="room" type="text" placeholder="Game Name" />
          <p>Create a game, and start buzzing in!</p>
      </main>
    </form>
    <main>
      <section id="panel">
        <div class="panel__header">
          <h1>WhoDaMan</h1>
          <input id="shareLink" disabled />
        </div>
        <div class="panel">
          <div class="panel__header">
            <div class="panel__label">Leaderboard</div>
          </div>
          <ul id="leaderboard">
          </ul>
          <div class="panel__header">
            <div class="panel__label">Players &mdash; <span id="roomCount"></span></div>
            <div>
              <button id="begin">Begin</button>
              <button id="done" style="display: none;">Done</button>
              <button id="reset" style="display: none;">Next</button>
            </div>
          </div>
          <ul id="qcontent">
          </ul>
          <div class="panel__header">
            <div class="panel__label">Buzzes</div>
            <button id="skip" style="display: none;">Skip</button>
          </div>
          <ul id="buzzes">
          </ul>
        </div>
      </section>
    </main>
{% endblock %}
{% block scripts %}
    <script src="{{ url_for('static', filename='admin.js') }}"></script>
{% endblock %}
```

We use the `extends` keyword in the first statement to create a child template of the base template from `layout.html`. Since we do not want to override the original `head` block, we can just call `super()` to insert the base template's version. We can also use the `url_for` function to generate a filename. A few things to remember in the HTML that will be important for writing the client-side code later:

- An input with id 'room' for the admin to type the room they want to create
- A div with id 'panel' which will only be visible after a room is created
- A disabled input with id 'shareLink' for the admin to give to the players to join their room
- A list with id 'leaderboard' that will be populated the with players' scores
- A list with id 'qcontent' that will show the question or instructions for the admin
- A span with id 'roomCount' that will indicate how many players are in the room
- Buttons with ids 'begin', 'done', 'reset', and 'skip'. Note that some of them initially are not visible.

Feel free to look at `style.css`. It won't be addressed in this workshop.

### Play

```html
{% extends "layout.html" %}
{% block title %} WhoDaMan - Play {% endblock %}
{% block head %}
    {{ super() }}
{% endblock %}
{% block content %}
    <div>
      <main>
        <form id="start">
          <header>
            <h1>
              WhoDaMan
            </h1>
          </header>
          <input id="name" type="text" maxlength="100" placeholder="Your name">
          <p>P.S. Your name will be shared with the moderator</p>
        </form>
        <div id="panel">
          <div class="panel__label">Score &mdash; <span id="score">0</span></div>
          <button id="buzz" type="submit" style="display: none;">⚡️</button>
          <div id="state">Waiting...</div>
        </div>
        <ul id="buzzes"></ul>
      </main>
    </div>
{% endblock %}
{% block scripts %}
    <script src="{{ url_for('static', filename='play.js') }}"></script>
{% endblock %}
```

Things to note for the client-side code:

- An input with id 'name'
- A div with id 'panel' that is online visible after entering a name
- A span with id 'score' that will show the player's current score
- A button with id 'buzz' that will only be visible when the admin is done reading their question
- A waiting indicator that is shown while the admin is reading thier question

### Index

```html
{% extends "layout.html" %}
{% block title %} WhoDaMan - A trivia game {% endblock %}
{% block head %}
    {{ super() }}
{% endblock %}
{% block content %}
    <div>
      <header>
        <h1>WhoDaMan</h1>
      </header>
      <main >
        <form id="start">
          <input id="room" type="text" placeholder="Game Name" />
        </form>
        <p>
          Answer trivia questions with friends!
        </p>
      </main>
    </div>
    <footer><a href="/admin">Create a game</a></footer>
{% endblock %}
{% block scripts %}
    <script src="{{ url_for('static', filename='index.js') }}"></script>
{% endblock %}
```

The index page is very simple. It will only have client-side code to listen from the server if a room exists to join. Otherwise, it just redirects to admin or play.