'use strict'
process.title = 'node-chat'

const WS_PORT = 1337

const webSocketServer = require('websocket').server
const http = require('http')

const game = {
  x: null,
  o: null,
  board: {},
  turn: null,
}
const states = {}
const history = []
const server = http.createServer(function(request, response) {})

server.listen(WS_PORT, () => console.log(new Date() + ' Server is listening on port ' + WS_PORT))

const wsServer = new webSocketServer({ httpServer: server })
const randString = () => Math.round(Math.random() * 10000).toString()

wsServer.on('request', function(request) {
  console.log(`${new Date()} Connection from origin ${request.origin}.`)

  const id = generateId()
  const connection = request.accept(null, request.origin)
  const send = setSender(connection)

  states[id] = { connection }

  console.log(`${new Date()} Connection accepted.`)

  send({ type: 'bootstrap', history })

  connection.on('message', function(message) {
    if (message.type !== 'utf8') return null
    const data = JSON.parse(message.utf8Data)
    if (data.type === 'setUser') return setUser(id, data.user)
    if (data.type === 'mark') return mark(id, data.index)
  })

  connection.on('close', function() {
    if (!states[id].name) return null
    disconnectUser(id)
  })
})

function setUser(id, user) {
  const state = states[id]
  const send = setSender(state.connection)
  Object.assign(state, user)
  if (!game.x) {
    game.x = { id }
    state.type = 'x'
  } else if (!game.o) {
    game.o = { id }
    state.type = 'o'
  }
  if (game.x && game.o && !game.turn) game.turn = 'x'
  const historyMessage = `User ${state.name} connected as ${state.type}`
  send({ type: 'confirm', player: { type: state.type } })
  broadcastData({ type: 'historyPush', message: historyMessage })
}

function disconnectUser(id) {
  const state = states[id]
  console.log(`${new Date()} Peer ${state.connection.remoteAddress} disconnected.`)
  if (!state.type) return broadcastData({ type: 'historyPush', message: `User ${state.name || state.id} disconnected` })
  broadcastHistory(`User ${state.name} (${state.type}) disconnected`)
  broadcastData({ type: 'clearBoard' })
  game[state.type] = null
  delete states[id]
}

function setSender(connection) {
  return data => connection.send(JSON.stringify(data))
}

function mark(id, index) {
  const state = states[id]
  if (game.board[index] || state.type !== game.turn) {
    const blockedMessage = `Jogador ${state.name} (${state.type}) tentou marcar na posição ${index} e foi bloqueado.`
    return broadcastHistory(blockedMessage)
  }
  game.board[index] = state.type
  game.turn = state.type === 'o' ? 'x' : 'o'
  broadcastData({ type: 'mark', user: state.type, index })
  broadcastHistory(`Jogador ${state.name} (${state.type}) marcou posição ${index}`)
  broadCastIfFinished(state.type)
}

function broadCastIfFinished(user) {
  const matrix = boardToMatrix(user)

  const row = matchRow(matrix)
  if (row >= 0) return broadcastFinish({ user, row })

  const column = matchColumn(matrix)
  if (column >= 0) return broadcastFinish({ user, column })

  const diagonal = matchDiagonal(matrix)
  if (diagonal >= 0) return broadcastFinish({ user, diagonal })
}

function boardToMatrix(player) {
  const matrix = []
  for (let i = 0; i < 3; i++) {
    const row = []
    for (let j = 0; j < 3; j++) {
      const field = i * 3 + j
      const value = game.board[field] === player
      row.push(Number(value))
    }
    matrix.push(row)
  }
  return matrix
}

function matchRow(matrix) {
  return matrix.findIndex(row => row.every(column => column === 1))
}

function matchColumn(matrix) {
  const totals = matrix.reduce((sum, row) => [sum[0] + row[0], sum[1] + row[1], sum[2] + row[2]], [0, 0, 0])
  return totals.findIndex(columnSum => columnSum === 3)
}

function matchDiagonal(matrix) {
  const diagonals = matrix.reduce((d, row, i) => [d[0] + row[i], d[1] + row[2 - i]], [0, 0])
  return diagonals.findIndex(d => d === 3)
}

function broadcastFinish(options) {
  return broadcastData({ type: 'finish', ...options })
}

function broadcastHistory(message) {
  history.push(message)
  return broadcastData({ type: 'historyPush', message })
}

function broadcastData(data) {
  for (const id in states) {
    const client = states[id]
    client.connection.send(JSON.stringify(data))
  }
}

function generateId() {
  return new Date().getTime().toString() + randString()
}
