const { isLogged, isValidGame, isPlayerInGame } = require('../validators')
const { getPlayerFromArgs, getGame } = require('../store/getters')

function sendUnits({ game_id, tile_id_from, tile_id_to, units }, ...args) {
    if (typeof tile_id_from !== 'string') throw '`tile_id_from` must be passed'
    if (typeof tile_id_to !== 'string') throw '`tile_id_to` must be passed'
    if (typeof units !== 'number') throw 'A number of `units` must be passed'
    if (units < 1) throw 'You must send at least one unit'
    const player = getPlayerFromArgs(args)
    const game = getGame({ game_id })
    const player_index = game.players[player.id]
    const board = game.sub.board
    const tile_from = board[tile_id_from]
    const tile_to = board[tile_id_to]
    if (tile_from === undefined) throw 'Invalid `tile_id_from`'
    if (tile_to === undefined) throw 'Invalid `tile_id_to`'
    const units_availables = tile_from.units[player_index] || 0
    if (units > units_availables) throw 'Not enough units to send'
    return { tile_id_from, tile_id_to, units, units_availables }
}

module.exports = isLogged(isValidGame(isPlayerInGame(sendUnits)))
