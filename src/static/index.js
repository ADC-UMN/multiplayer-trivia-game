var socket = io()
var $startForm = $('#start')
var $roomField = $('#room')
var data = { room: null }

$('body').addClass('center')

$startForm.on('submit', function(event) {
  event.preventDefault()
  data.room = $roomField.val()
  
  socket.emit('exists', data)
})

socket.on('exists', function(exists) {
  if (exists) {
    window.location = '/' + data.room
  }
  else {
    alert('That game doesn\'t exist!')
  }
})