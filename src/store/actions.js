const { uuid } = require('../utils')
const state = require('./state')
const Player = require('../model/Player')
const Game = require('../model/Game')
const { GAME_STATUS } = require('../const')

function createPlayer({ node, nickname }) {
    const id = 'Player_' + uuid(16, state.players)
    const player = new Player({ id, node, nickname })
    node.player_id = id
    state.players[id] = player
    console.log('createPlayer')
    return player
}

function getPlayer({ player_id }) {
    return state.players[player_id]
}

function deletePlayer({ player_id }) {
    const player = getPlayer({ player_id })
    // Checking if player has a playing game
    let isPlaying = false
    for (const game_id in player.games) {
        const game = getGame({ game_id })
        if (game.status === GAME_STATUS.WAITING_PLAYERS)
            deletePlayerFromGame({ game, player_id })
        else if (game.status === GAME_STATUS.PLAYING) {
            isPlaying = true
        }
    }
    if (!isPlaying) {
        delete state.players[player_id]
        console.log('deletePlayer', state.players, state.games)
    }
}

function createGame() {
    const id = 'Game_' + uuid(16, state.games)
    const game = new Game({ id, public: true })
    state.games[id] = game
    return game
}

function getGame({ game_id }) {
    return state.games[game_id]
}

function joinPublicGame({ player_id }) {
    const games = state.games
    for (const game_id in games) {
        const game = games[game_id]
        if (game.public && game.status === GAME_STATUS.WAITING_PLAYERS) {
            const player_index = addPlayerToGame({ game, player_id })
            return { game, player_index }
        }
    }
    // Creating a new game and looping again
    createGame()
    return joinPublicGame({ player_id })
}

function addPlayerToGame({ game, player_id }) {
    const player = getPlayer({ player_id })
    const player_index = game.addPlayer({
        player_id,
        nickname: player.nickname
    })
    player.games[game.id] = player_index
    console.log('addPlayerToGame', state.players, state.games)
    return player_index
}

function deletePlayerFromGame({ game, player_id }) {
    const player = getPlayer({ player_id })
    const player_index = game.removePlayer({ player_id })
    delete player.games[player_index]
    console.log('deletePlayerFromGame')
}

module.exports = {
    createPlayer,
    getPlayer,
    deletePlayer,
    getGame,
    joinPublicGame
    // addPlayer
}
