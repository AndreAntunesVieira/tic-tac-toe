const log = document.querySelector('#log')
const input = document.querySelector('#input')
const status = document.querySelector('#status')
const field = document.querySelector('#field')

const myState = {
  name: null,
  type: 'none',
}

window.WebSocket = window.WebSocket || window.MozWebSocket

if (!window.WebSocket) log.innerHTML = "Sorry, but your browser doesn't support WebSocket."

const connection = new WebSocket('ws://127.0.0.1:1337')

connection.onopen = function(e) {
  console.log(e)
  input.removeAttribute('disabled')
  status.innerText = 'Choose name:'
}

connection.onerror = function(error) {
  console.log(error)
  log.innerHTML = 'Erro ao conectar com o servidor'
}

connection.onmessage = function(message) {
  const data = JSON.parse(message.data)
  console.log(data)
  if (data.type === 'bootstrap') return bootstrapLogs(data.history)
  if (data.type === 'mark') return receiveMark(data)
  if (data.type === 'historyPush') return (log.innerHTML = log.innerHTML + `<div>${data.message}</div>`)
  if (data.type === 'clearBoard') return clearBoard()
  if (data.type === 'finish') return finishGame(data)
  if (data.type === 'confirm') {
    Object.assign(myState, data.player)
    status.innerHTML = `Seu nome é <b>${myState.name}</b> e você é o jogador <b>${typeName()}</b>`
  }

}

input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const name = input.value.trim()
    if (!name || myState.name) return

    sendMessage({ type: 'setUser', user: { name } })
    input.value = ''

    myState.type = 'confirmando...'
    myState.name = name
    status.innerHTML = `Seu nome é <b>${name}</b> e você é o jogador <b>${typeName()}</b>`
    status.style.textAlign = 'center'
    status.style.display = 'block'
    input.setAttribute('disabled', 'disabled')
    input.style.display = 'none'
  }
})

field.querySelectorAll('div').forEach(section => {
  section.addEventListener('click', e => {
    const element = e.target
    const index = Array.from(element.parentNode.children).indexOf(element)
    sendMessage({ type: 'mark', index })
  })
})

function clearBoard(){
  field.querySelectorAll('div').forEach(section => {
    section.classList.remove('o', 'x')
  })
}

function receiveMark(data) {
  if (!data.user) return null
  const element = field.querySelectorAll('div')[data.index]
  element.classList.add(data.user)
}

function sendMessage(data) {
  connection.send(JSON.stringify(data))
}

function typeName() {
  if (myState.type === 'o') return 'bolinha'
  return 'xis'
}

function finishGame(data){
  console.log(data)
}

setInterval(function() {
  if (connection.readyState !== 1) {
    status.innerHTML = 'Error'
    input.setAttribute('disabled', 'disabled')
    input.value = 'Unable to communicate with the WebSocket server.'
  }
}, 3000)

function bootstrapLogs(history) {
  let fullMessage = ''
  history.forEach(message => {
    fullMessage = fullMessage + `<div>${message}</div>`
  })
  log.innerHTML = fullMessage
}
