var socket = io()
var $startForm = $('#start')
var $nameField = $('#name')
var $panel = $('#panel')
var $buzzButton = $('#buzz')
var $state = $('#state')
var $buzzes = $('#buzzes')
var data = {
  room: window.location.pathname.split('/')[1], // get the first path
  name: null
}

$('body').addClass('center')

var count = 0
$score = $('#score')

$startForm.on('submit', function(event) {
  event.preventDefault()
  data.name = $nameField.val()
  $startForm.hide()
  $panel.show()
  $nameField.blur()
  
  socket.emit('join', data)
})

$buzzButton.on('click', function(event) {
  event.preventDefault()
  socket.emit('buzz', data)
  $buzzButton.hide()
  $state.show()
})

socket.on('buzz', function(buzzData) {
  count++
  
  if (data.name === buzzData.name) {
    $state.text('Number ' + count)
  }
})

socket.on('score', function(scoreData) {
  var my_score = scoreData.leaderboard[$nameField.val()]
  $score.html(`${my_score} (${Object.values(scoreData.leaderboard).sort().pop() - my_score} to lead)`)
})

socket.on('reset', function() {
  count = 0
  $buzzButton.hide()
  $state.show().text('Waiting...')
})

socket.on('begin', function() {
  $buzzButton.show()
  $state.hide()
})