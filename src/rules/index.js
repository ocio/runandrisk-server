const generateBoard = require('./generateBoard')
const { minOrMax, getBestDice } = require('runandrisk-common/utils')
const { GAME } = require('../const/parameters')

function getVillagesByPlayers({ players = 2 }) {
    return players * 2
    // const villages = {
    //     2: 4,
    //     3: 6,
    //     4: 8,
    //     5: 10,
    //     6: 12,
    //     7: 14,
    //     8: 16
    // }
    // return villages[players]
}

function gameStartsAt(n) {
    return n + GAME.GAME_STARTS_AT // timestamp + minutes * seconds
}

function gameEndsAt(n) {
    return n + GAME.GAME_ENDS_AT // timestamp + minutes * seconds
}

function nextRecruitment(n) {
    return n + GAME.NEXT_RECRUITMENT // timestamp + minutes * seconds
}

function stopRecruitment(n) {
    return n + GAME.STOP_RECRUITMENT // timestamp + seconds
}

function calcRecruitment({ power, clicks }) {
    return Math.round((power * clicks) / 10)
}

function getInitialUnits() {
    return GAME.INITIAL_UNITS
}

function troopsArrivesAt(leaves_at) {
    return leaves_at + GAME.TROOPS_ARRIVES_AT // seconds
}

function diceFight({ player1, player2 }) {
    const factor1 = Math.round(player1.units / player2.units)
    const factor2 = Math.round(player2.units / player1.units)
    const min = 1
    const max_dices = 6
    const dice_size = 6
    const throws1 = minOrMax({ number: factor1, min, max: max_dices })
    const throws2 = minOrMax({ number: factor2, min, max: max_dices })
    const dices1 = getBestDice({ throws: throws1, dice_size })
    const dices2 = getBestDice({ throws: throws2, dice_size })
    const dice1 = dices1.dice
    const dice2 = dices2.dice
    return [
        {
            id: player1.id,
            add:
                dice1 < dice2 || (dice1 === dice2 && player2.is_owner) ? -1 : 0,
            dice: dice1,
            dices: dices1.dices
        },
        {
            id: player2.id,
            add:
                dice2 < dice1 || (dice1 === dice2 && player1.is_owner) ? -1 : 0,
            dice: dice2,
            dices: dices2.dices
        }
    ]
}

module.exports = {
    generateBoard,
    getVillagesByPlayers,
    getInitialUnits,
    troopsArrivesAt,
    diceFight,
    nextRecruitment,
    stopRecruitment,
    calcRecruitment,
    gameStartsAt,
    gameEndsAt
}
