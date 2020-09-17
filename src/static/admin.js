var socket = io()
var $startForm = $('#start')
var $roomField = $('#room')
var $panel = $('#panel')
var $beginButton = $('#begin')
var $resetButton = $('#reset')
var $shareLink = $('#shareLink')
var $buzzes = $('#buzzes')
var $roomCount = $('#roomCount')
var data = { room: null }

$('body').addClass('body--admin')

async function getData(url) {
	const response = await fetch(url)
	return response.json()
}

var count = 0
var leaderboard = {}
var $leaderboard = $('#leaderboard')
var stakes = 0
var $qcontent = $('#qcontent')
var $doneButton = $('#done')
var $skipButton = $('#skip')

var instructions = '<li class="paragraph"><b>INSTRUCTIONS</b><br><br>👫 <span class="li">Share the link in the top right to have people join your game.</span>⏱ <span class="li">Press the "Begin" button to start receiving questions to read or to read the next question.</span>👂 <span class="li">When you\'re done reading the question, hit the \'Done\' button to start accepting buzzes.</span>🎉 <span class="li">Play your game! Earn points for getting the question right, but lose points for getting it wrong.</span>🤟 <span class="li">Once you\'re ready for the next round, press the "Next" button. </span></li>'
$qcontent.html(instructions)
$roomCount.text('0 people')

$startForm.on('submit', function(event) {
  event.preventDefault()
  data.room = $roomField.val()
  
  socket.emit('create', data)
})

$resetButton.on('click', function() {
  for (const key in leaderboard) {
    leaderboard[key] = 0
  }
  $leaderboard.html(`
    ${Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
  `)
  data.leaderboard = leaderboard
  socket.emit('score', data)
})

socket.on('create', function(success) {
  if (success) {
    $startForm.hide()
    $panel.show()
    $shareLink.val(window.location.host+'/'+data.room)
  }
  else {
    alert('That room is taken')
  }
})

$beginButton.on('click', async function() {
  $beginButton.hide()
  $doneButton.show()
  $skipButton.show()
  const res = await getData('https://jservice.io/api/random?count=1')
  let reset_data = data
  reset_data.res = res
  socket.emit('reset', reset_data)
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
  $buzzes.html('')
  if (res[0].value == null) {
    $skipButton.click()
  }
})

$doneButton.on('click', function() {
  $doneButton.hide()
  $beginButton.show()
  socket.emit('begin', data)
})

$skipButton.on('click', async function() {
  const res = await getData('https://jservice.io/api/random?count=1')
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
  $buzzes.html('')
  $beginButton.click()
})

function correct(name) {
  leaderboard[name] += stakes
  $leaderboard.html(`
    ${Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
  `)
  $buzzes.html('')
  data.leaderboard = leaderboard
  socket.emit('score', data)
  $beginButton.click()
}

function incorrect(name) {
  leaderboard[name] -= stakes
  $leaderboard.html(`
    ${Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).map(([key, value]) => `<li class="panel__header">${key}<span>${value}</span></li>`).join('')}
  `)
  $buzzes.find(':first-child').remove()
  const next_name = $buzzes.find(':first-child').contents()[0].data.slice(0, -1)
  $buzzes.find(':first-child').append(`<span><span class="judge" onclick="correct('${next_name}')">✔️</span> <span class="judge" onclick="incorrect('${next_name}')">❌</span></span>`)
  data.leaderboard = leaderboard
  socket.emit('score', data)
}

socket.on('buzz', function(data) {
  $buzzes.append(`<li class="panel__header">${data.name} ${$buzzes.children().length > 0 ? '' : `<span><span class="judge" onclick="correct('${data.name}')">✔️</span> <span class="judge" onclick="incorrect('${data.name}')">❌</span></span>`}</li>`)
})

socket.on('leave', function() {
  count--
  $roomCount.text(count === 1 ? count + ' person' : count + ' people')
})

socket.on('join', function(data) {
  count++
  $roomCount.text(count === 1 ? count + ' person' : count + ' people')
  $leaderboard.append(`<li class="panel__header">${data.name}<span>0</span></li>`)
  leaderboard[data.name] = 0
})