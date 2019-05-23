const GAME_STATUS = {
    WAITING_PLAYERS: 'WAITING_PLAYERS',
    PLAYING: 'PLAYING'
}

const GAME_MATCHMAKING = {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 3,
    TIMEOUT_TO_START: 5000
}

const TILE_TYPE = {
    COTTAGE: 0,
    VILLAGE: 1
}

const BOARD = {
    RANGE_NEIGHBORS: 3,
    COTTAGE_MULTIPLY_NEIGHBORS: 1,
    VILLAGE_MULTIPLY_NEIGHBORS: 2,
    COTTAGE_MULTIPLY: 1,
    VILLAGE_MULTIPLY: 5
}

const INSTRUCTION = {
    CONQUEST: 0, // when troops CONQUEST a tile
    ADD: 1 // add units
}

module.exports = {
    GAME_STATUS,
    GAME_MATCHMAKING,
    TILE_TYPE,
    BOARD,
    INSTRUCTION
}
