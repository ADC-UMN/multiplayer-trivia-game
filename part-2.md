# Part 2: Client-side Code

## Introduction

The client-side code is meant to handle form submissions and listen to/handle SocketIO events.

## Events

### Exists

This event is only relevant to the index page. Let's create our `index.js` in the static folder:

```js
var socket = io() // open a two-way connection to the server
var $startForm = $('#start') // use jQuery to select HTML element with id 'start'
var $roomField = $('#room') // to grab elements
$('body').addClass('center') // add some styling
```

The user's computer will emit an exists event along with some data that indicates which room the user wants to join. The user's computer will listen to a response from the server and respond. If the room exists, redirect to it. Otherwise, alert the user that the room doesn't exist.

```js
var data = { room: null }
// emit an exists event on submission
$startForm.on('submit', function(event) {
    event.preventDefault() // the default behavior includes reloading the page
    data.room = $roomField.val() // take the room that tha user wants to join
    socket.emit('exists', data)
})
// handle an exists event coming from the server
// when we write the server, we will emit the event
// with a true Boolean for success and a false Boolean
// for failure
socket.on('exists', function(exists) {
    if (exists) {
        window.location = '/' + data.room // redirect to the desired room
    }
    else {
        alert('That game doesn\'t exist')
    }
})
```

### Create

Only admin emits the 'create' event. Let's create `admin.js`:

```js
var socket = io()
var $startForm = $('#start')
var $roomField = $('#room')
var $panel = $('#panel')
var $shareLink = $('#shareLink')
var data = { room: null }
```

Similar to the 'exists' in the index page, the 'create' event is emitted when the admin enters a room name and hits submit. It then listens to the server to emit a 'create' event along with a Boolean indicating success (`true`) or failure (`false`). If successful, show the panel. Otherwise, alert the user that a room with that name already exists.

```js
// emit a 'create' event on submission along with the room requested
$startForm.on('submit', function(event) {
    event.preventDefault()
    data.room = $roomField.val()
    socket.emit('create', data)
})
// listen to a successful or failed 'create' reply from the server
socket.on('create', function(success) {
    if (success) {
        $startForm.hide()
        $panel.show()
        $shareLink.val(window.location.host + '/' + data.room)
    }
    else {
        alert('That room is taken')
    }
})
```

### Join

The rest of the events are emitted by either admin or play and listened to by the other. Join is emitted by play. When they enter their name to join the room.

```js
// in play.js
var $startForm = $('#start')
var data = {
    room: window.location.pathname.split('/')[1], // the URL will look like domain.com/room
    name: null
}

$startForm.on('submit', function(event) {
    event.preventDefault()
    data.name = $nameField.val()
    $startForm.hide()
    $panel.show()
    $nameField.blur()
    socket.emit('join', data)
})
```

```js
// in admin.js
$roomCount = $('#roomCount')
$leaderboard = $('#leaderboard')
var count = 0
var leaderboard = {}

socket.on('join', function(data) {
    count++
    $roomCount.text(count === 1 ? count + ' person' : count + ' people') // update the span to be grammatically correct according the number of players
    $leaderboard.append(`<li class="panel_header">${data.name}<span>0</span></li>`) // in JavaScript, we can create template strings between `` backticks with string representations of any JavaScript expression surrounded by ${}
    leaderboard[data.name] = 0
})
```

### Buzz

Buzz is emitted by play and listened to by both play and admin. This is because we plan to display what order a player buzzed in to them. 

```js
// in play.js
var $buzzButton = $('#buzz')
var count = 0

$('body').addClass('center') // leverage our CSS styling on this page

// emit the 'buzz' event
$buzzButton.on('click', function(event) {
    // this is actually just jQuery's way of defining an event handler
    event.preventDefault()
    socket.emit('buzz', data)
    $buzzButton.hide()
    $state.show() // display 'Waiting...' until the next question
})

// listen for 'buzz' events emitted by any player in the same room (including yourself)
socket.on('buzz', function(buzzData) {
    count++

    if (data.name === buzzData.name) {
        // if you emitted the buzz
        $state.text('Number ' + count)
        // display the order in which you buzzed
    }
})
```

Let's first go over the client-side code for all the buttons in the admin page. We want a button to start the game after the admin has read/explained the rules, a button to press to enable buzzing after the question has been read, a button to skip a question, and a button to go to the next question.

```js
// in admin.js
var $buzzes = $('#buzzes')
var $beginButton = $('#begin')
var $resetButton = $('#reset')
var $skipButton = $('#skip')
var $doneButton = $('#done')
var $qcontent = $('#qcontent') // for displaying the questions and the intructions
var stakes = 0 // the value of the current question
var $roomCount = $('#roomCount')

// initialize the page for an empty room
var instructions = '<li class="paragraph"><b>INSTRUCTIONS</b><br><br>👫 <span class="li">Share the link in the top right to have people join your game.</span>⏱ <span class="li">Press the "Begin" button to start receiving questions to read or to read the next question.</span>👂 <span class="li">When you\'re done reading the question, hit the \'Done\' button to start accepting buzzes.</span>🎉 <span class="li">Play your game! Earn points for getting the question right, but lose points for getting it wrong.</span>🤟 <span class="li">Once you\'re ready for the next round, press the "Next" button. </span></li>'
$qcontent.html(instructions)
$roomCount.text('0 people')

// a helper function to grab data from the Jeopardy! questions API
async function getData(url) {
    // It's asynchronous, which means it returns a Promise object
    // They are essentially containers for a value that will resolve sometime in the future
    // We tell our app to wait until the request to the API can resolve before using the value by
    // using the 'await' keyword
    const response = await fetch(url)
    return response.json()
}

$beginButton.on('click', async function() {
    // only async functions can use await
    $beginButton.hide()
    $doneButton.show() // for allowing buzzing after the question is done being read
    const res = await getData('http://jservice.io/api/random?count=1') // try putting this in your address bar to see what the data will look like
    let reset_data = data
    reset_data.res = res
    socket.emit('reset', reset_data) // play will listen for this
    $qcontent.html(`
        <li class="paragraph">
            <b>QUESTION</b>
            <br>
            <br>
            📙 <span class="li">Category &mdash; ${res[0].category.title}</span>
            💯 <span class="li">Points &mdash; ${res[0].value}</span>
            🕵️ <span class="li">Question &mdash; ${res[0].question}</span>
            🙋 <span class="li">Answer &mdash; ${res[0].answer}</span>
        </li>
    `) // use template strings again
  stakes = res[0].value
  $buzzes.html('') // clear the buzzes for the next question
  if (res[0].value == null) { // sometimes the API will give us unscored questions
      $skipButton.click() // just skip in that case
  }
})

$doneButton.on('click', function() {
  $doneButton.hide()
  $beginButton.show()
  socket.emit('begin', data) // play will listen for this
})

$skipButton.on('click', async function() {
  const res = await getData('http://jservice.io/api/random?count=1')
  $qcontent.html(`
    <li class="paragraph">
      <b>QUESTION</b>
      <br>
      <br>
      📙 <span class="li">Category &mdash; ${res[0].category.title}</span>
      💯 <span class="li">Points &mdash; ${res[0].value}</span>
      🕵️ <span class="li">Question &mdash; ${res[0].question}</span>
      🙋 <span class="li">Answer &mdash; ${res[0].answer}</span>
    </li>
  `)
  stakes = res[0].value
  $buzzes.html('') // clear any buzzes that had already occurred
  // restart the 
  $beginButton.click() // go to the next question
})
```

Now that we know the general flow of the page, let's handle a player buzz. When a player buzzes, we need the ability to judge/score the incorrect or correct answer.

```js
// in admin.js
function correct(name) {
    leaderboard[name] += stakes
    // another template string, this time used to generate HTML
    // first convert an object into an array of arrays where the inner array's first element is a key and the second element is a value
    // { 'a': 1, 'b': 2 } -> [[a, 1], [b, 2]]
    // sort in descending order in terms of score
    // translate the array into the HTML required for our leaderboard
    // the .join('') is needed or else JavaScript will add commas into our HTML since we are working with an array
    $leaderboard.html(`
        ${Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
    `)
    $buzzes.html('') // if a player gets the question right there is no need to judge the rest of the players who buzzed
    data.leaderboard = leaderboard 
    socket.emit('score', data) // play will listen for this
    $beginButton.click() // view the next question
}

function incorrect(name) {
    leaderboard[name] -= stakes
    $leaderboard.html(`
        ${Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
    `)
    $buzzes.find(':first-child').remove()
    // find the name of the next player to buzz
    // explore the DOM in the console
    // then use jQuery functions to grab what you want
    const next_name = $buzzes.find(':first-child').contents()[0].data.slice(0, -1)
    // if a player answers incorrectly, they are removed from the queue to judge
    $buzzes.find(':first-child').append(`<span><span class="judge" onclick="correct('${next_name}')">✔️</span> <span class="judge" onclick="incorrect('${next_name}')">❌</span></span>`)
    // the new first child of the buzzes <ul> is the player who buzzed last
    // allow the admin to judge this next player
    data.leaderboard = leaderboard
    socket.emit('score', data)
}

socket.on('buzz', function(data) {
    $buzzes.append(`<li class="panel__header">${data.name} ${$buzzes.children().length > 0 ? '' : `<span><span class="judge" onclick="correct('${data.name}')">✔️</span> <span class="judge" onclick="incorrect('${data.name}')">❌</span></span>`}</li>`)
    // only add the ability to judge if the player buzzed in first
})
```

We can also create a reset button to clear the leaderboard.

```js
$resetButton.on('click', function() {
    for (const key in leaderboard) {
        leaderboard[key] = 0 // reset the scores
    }
    $leaderboard.html(`
        ${Object.entreis(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
    `)
    data.leaderboard = leaderboard
    socket.emit('score', data)
})
```

### Score

We just finished how the admin emits the 'score' event. Let's determine how the play page handles it.

```js
// in play.js
$score = $('#score')

socket.on('score', function(scoreData) {
    var my_score = scoreData.leaderboard[$nameField.val()] // lookup the player's score on the leaderboard
    $score.html(`${my_score} (${Object.values(scoreData.leaderboard).sort().pop() - my_score} to lead)`) // update the header above the button to show the player's score
    // and how many points they need to earn to lead
})
```

### Reset

Remember that the 'reset' event was emitted from the admin page when they either begin the game or move on to the next question. On the play page, we just need to reset the counter for how many players have buzzed in, hide the buzzer, and display an indicator to wait until the admin allows buzzing.

```js
// in play.js
socket.on('reset', function(resetData) {
    count = 0
    $buzzButton.hide()
    let res = resetData.res
    $state.show().html(`
        <li class="paragraph">
            <b>QUESTION</b>
            <br>
            <br>
            📙 <span class="li">Category &mdash; ${res[0].category.title}</span>
            💯 <span class="li">Points &mdash; ${res[0].value}</span>
            🕵️ <span class="li">Question &mdash; ${res[0].question}</span>
        </li>
    `)
})
```

### Begin

The 'begin' event is emitted from the admin page when they click the done button. The play page just needs to show the buzz button.

```js
// in play.js
socket.on('begin', function() {
    $buzzButton.show() // allow buzzing
})
```

### Leave

This event isn't emitted by either the play page or the admin page. The server will listen to disconnections and in response emit a 'leave' event to other sockets connected to that room. The admin page needs to indicate someone has left by decrementing the player counter.

```js
// in admin.js
socket.on('leave', function() {
    count--
    $roomCount.text(count === 1 ? count + ' person' : count + ' people')
    // use a ternary to have correct grammar
})
```

## Conclusion

Remember that sockets do not connect the admin and players correctly. Sockets connect admins to the server and players to the server. The server has some of its own business logic, but for this game it mostly just broadcasts the event to the other sockets connected to the room.