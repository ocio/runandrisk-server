const { collect } = require('dop')
const { GAME_STATUS } = require('runandrisk-common/const')
const { now } = require('runandrisk-common/utils')
const {
    calcRecruitment,
    calcPercentageConquered
} = require('runandrisk-common/rules')
const Combinatorics = require('js-combinatorics')
const { GAME } = require('../const/parameters')
const state = require('../store/state')
const { changeTileUnitsFilter } = require('../store/filters')
const {
    startGame,
    changeTileUnits,
    updateFight,
    deleteTroops,
    changeRecruitmentTimes,
    deployUnits,
    changeGamePower
} = require('../store/actions')
const { getOwnerFromTile } = require('../store/getters')
const { diceFight, gameShouldStartAt, gameEndsAt } = require('../rules')

function startCron() {
    const interval = setInterval(() => {
        finishGame()
        launchGames()
        updateTroops()
        updateContested()
        makeFights()
        startRecruiting()
    }, GAME.CRON_INTERVAL)
}

function finishGame() {
    const n = now()
    const { games, players } = state
    for (const game_id in games) {
        const game = games[game_id]
        if (n > game.sub.ends_at) {
            game.sub.status = GAME_STATUS.FINISHED
            for (const player_id in game.players) {
                delete players[player_id]
            }
            delete games[game_id]
        } else {
            game.sub.now = n
            // console.log('recruit_start', game.sub.recruit_start - game.sub.now)
            // console.log('recruit_end', game.sub.recruit_end - game.sub.now)
            // console.log('ends_at', game.sub.ends_at - game.sub.now)
            // console.log('----')
        }
    }
}

function launchGames() {
    const { games } = state
    for (const game_id in games) {
        const game = games[game_id]
        const players = game.sub.players
        // // console.log(game.sub.starts_at - n)
        if (game.sub.status === GAME_STATUS.WAITING_PLAYERS) {
            const joined_times = Object.keys(players)
                .map(key => players[key].joined)
                .sort((a, b) => a - b)
            const starts_at = gameShouldStartAt(joined_times)
            // console.log({ starts_at })
            if (starts_at <= 0) {
                startGame({ game_id })
            } else {
                game.sub.starts_at = starts_at
            }
        }
    }
}

function updateTroops() {
    const n = now()
    const { games } = state
    for (const game_id in games) {
        const game = games[game_id]
        const troops = game.sub.troops
        for (const troop_id in troops) {
            const troop = troops[troop_id]
            // const total_diff = troop.arrives_at - troop.leaves_at
            const current_diff = troop.arrives_at - n
            if (current_diff < 1) {
                const player_index = troop.player_index
                const units = troop.units
                const tile_id = troop.tile_id_to
                changeTileUnits({ game_id, tile_id, player_index, units })
                deleteTroops({ game_id, troop_id })
            }
        }
    }
}

function updateContested() {
    const { games } = state
    for (const game_id in games) {
        const collector = collect()
        const game = games[game_id]
        const board = game.sub.board
        for (const tile_id in board) {
            const tile = board[tile_id]
            const power = tile.power
            const fighters = tile.fighters
            const fighters_ids = Object.keys(fighters)
            // const player_owner = getOwnerFromTile({ game_id, tile_id })
            // console.log(fighters[player_owner])
            if (
                fighters_ids.length === 1 // &&
                //fighters[player_owner].conquered < 100
            ) {
                for (const player_index in fighters) {
                    const conquered = fighters[player_index].conquered
                    if (conquered < 100) {
                        const new_conquered_value = calcPercentageConquered({
                            conquered,
                            tile_type: tile.type
                        })
                        fighters[player_index].conquered = new_conquered_value
                    }
                    if (
                        conquered < 100 &&
                        fighters[player_index].conquered >= 100
                    ) {
                        changeGamePower({ game_id, player_index, power })
                    }
                    break
                }
            }
        }
        collector.emit()
    }
}

function makeFights() {
    const { games } = state
    for (const game_id in games) {
        const collector = collect()
        const game = games[game_id]
        const board = game.sub.board
        for (const tile_id in board) {
            const tile = board[tile_id]
            const fighters = Object.keys(tile.fighters)
            const player_owner = getOwnerFromTile({ game_id, tile_id })
            if (fighters.length > 1) {
                const combinations = Combinatorics.combination(fighters, 2)
                // console.log
                combinations.forEach(cmb => {
                    if (tile.fighters[cmb[0]] === undefined) {
                        // console.log('cmb[0]', {
                        //     id: cmb[0],
                        //     fighters,
                        //     new_fighters: Object.keys(tile.fighters)
                        // })
                    } else if (tile.fighters[cmb[1]] === undefined) {
                        // console.log('cmb[1]', {
                        //     id: cmb[1],
                        //     fighters,
                        //     new_fighters: Object.keys(tile.fighters)
                        // })
                    } else {
                        const [player1, player2] = diceFight({
                            player1: {
                                id: cmb[0],
                                is_owner: player_owner === cmb[0],
                                units: tile.fighters[cmb[0]].units
                            },
                            player2: {
                                id: cmb[1],
                                is_owner: player_owner === cmb[1],
                                units: tile.fighters[cmb[1]].units
                            }
                        })
                        if (player1.add < 0) {
                            updateFight({
                                game_id,
                                tile_id,
                                player_looser: player1.id,
                                player_winner: player2.id
                            })
                        } else if (player2.add < 0) {
                            updateFight({
                                game_id,
                                tile_id,
                                player_looser: player2.id,
                                player_winner: player1.id
                            })
                        }
                    }
                    // console.log(result)
                })
            }
        }
        collector.emit(changeTileUnitsFilter({ game_id }))
    }
}

function startRecruiting() {
    const n = now()
    const { games } = state
    for (const game_id in games) {
        const collector = collect()
        const game = games[game_id]
        const sub = game.sub
        const recruit_start = sub.recruit_start
        const recruit_end = sub.recruit_end
        const recruiting = sub.recruiting
        const players = sub.players
        if (!recruiting && n >= recruit_start) {
            sub.recruiting = true
            for (const player_index in players) {
                players[player_index].clicks = 0
                players[player_index].recruited = 0
            }
        } else if (recruiting && n >= recruit_end) {
            changeRecruitmentTimes({ game_id })
            for (const player_index in players) {
                const player = players[player_index]
                player.recruited = calcRecruitment(player)
            }
            deployUnits({ game_id })
        }
        collector.emit(changeTileUnitsFilter({ game_id }))
    }
}

module.exports = {
    startCron
}
