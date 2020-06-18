
// A normal poker hand comes in this format::
// -> _onStartHand is received with initalization data.
// -> Stuff happens {ante, blinds, posts, cards....}.
// -> _onEndHand is received.
// Nothing "Poker Table" related other than tournament updates are received between the
// last hands _onEndHand event and the new _startHand event
// Tournament updates come when neccesary (at any time)

// Hero == customer who is using the software
// Rake -> doesnt matter since return_chips and win Actions exist & pot updates with _onDealPotCards


const eventConstants = {

  _onTableOpened: 1,
  _onTableClosed: 2,
  _onPlayerJoinsTable: 3, // Not needed if Hud is never an option
  _onPlayerLeaveTable: 4, // Not needed if Hud is never an option
  _onRotateTable: 5, // Not needed if hud is never an option

  _onStartHand: 100,
  _onBettingRoundCompleted: 200,
  _onPlayerAction: 300,
  _onPlayerTurn: 400, // Not strictly needed if Hud is never an option
  _onDealPlayerCards: 500,
  _onDealPotCards: 600,
  _onEndHand: 700,

  _onTournamentMovedToTable: 1000, // Not needed if Hud is never an option
  _onTournamentPlayerInactive: 1001,
  _onTournamentPlayerBackOnTable: 1002,
  _onTournamentPlayerFinished: 1003,
  _onTournamentReenter: 1004,
  _onTournamentRebuy: 1005,
  _onTournamentAddon: 1006,
  _onTournamentStats: 1007
};

const actionConstants = {

  _actionAnte: 0,
  _actionSmallBlind: 1,
  _actionPostSmallBlindAmount: 2, // Possibly not supported
  _actionBigBlind: 3,
  _actionPostBigBlindAmount: 4,   // Possibly not supported

  _actionCheck: 5,
  _actionBet: 6,
  _actionCall: 7,
  _actionRaise: 8,
  _actionFold: 9,

  _actionShowCards: 10,
  _actionMuckCards: 11,

  _actionChopBlinds: 12, // Possible not supported
  _actionReturnChips: 13,
  _actionWin: 14,
};

/**
 * Poker window gets created OR when client connects to server when a hand is in progress.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object}  windowData - minimal information about the window created so we appear on screen
 */


/*
[
    {
        "event": _onTableOpened,
        "tableId" : number,
        "data": {
            "windowHandle": number, // https://docs.microsoft.com/en-us/windows/win32/sysinfo/handles-and-objects and https://docs.microsoft.com/en-us/windows/win32/winmsg/about-windows
            "windowTitle": "string" // The windows "Title bar" string
        }
    }
]
*/

/**
 * Poker window gets destroyed.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number}  windowHandle - window identifier, same as in _onTableOpened.
 */

/*
[
    {
        "event": _onTableClosed,
        "tableId" : number,
        "windowHandle": number // https://docs.microsoft.com/en-us/windows/win32/sysinfo/handles-and-objects and https://docs.microsoft.com/en-us/windows/win32/winmsg/about-windows
    }
]
*/

/**
 * Client connects to server OR a player joins the table when a hand is in progress.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {array}  playerData - Array of minimal player data joining the table & relative distance between server seat.
 */

/*
[
    {
        "event": _onPlayerJoinsTable,
        "tableId" : number,
        "data": {
            "seats" [
                {
                "name": "string",
                "stackSize": number,
                "seat": number,         // Seat according to server
                "effectiveSeat": number // Seat according to client
                }
            ]
        }
    }
]
*/

/**
 * A player (who is not our Hero) leaves the table.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} seat - Server side seat position of the player leaving the table.
 */

/*
[
    {
        "event": _onPlayerLeavesTable,
        "tableId" : number,
        "seat": number
    }
]
*/

/**
 * Hero switches seats.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} seatOffset - Distance between server seat 0 and the Hero seat according to the client display
 */

/*
[
    {
        "event": _onRotateTable,
        "tableId" : number,
        "seatOffset": number
    }
]
*/

/**
 * A Poker hand gets initialized.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} tableData - Initial table state right when the hand "starts" (no actions have happened by playerswwww or dealer)
 */

/*
[
    {
        "event": _onStartHand,
        "tableId" : number,
        "data": {
            "name": "string",
            ...
            "seats": [
                {
                    "name": "string",
                    ...
                }
            ]
        }
    }
]
*/


/**
 * Betting round ends.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 */

/*
[
    {
        "event": _onBettingRoundCompleted,
        "tableId": number
    }
]
*/


/**
 * Player performs an action.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} action - actionConstant
 * @param {number} chips - chip related to the action
 */

/*
[
    {
        "event": _onPlayerAction,
        "tableId": number,
        "action": number,
        "chips": number
    }
]
*/

/**
 * Turn switches to another player.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} seat - whos turn it is
 */

/*
[
    {
        "event": _onPlayerAction,
        "tableId": number,
        "seat": number
    }
]
*/

/**
 * Player gets dealt cards.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} seatData - seat and cards dealt
 */

/*
[
    {
        "event": _onDealPlayerCards,
        "tableId": number,
        "data": {
            "seat": number,
            "cards": [
                {
                    "suit": number,
                    "num": number
                }
            ]
        }
    }
]
*/

/**
 * Pot gets dealt cards.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} potData - cards dealt and current pots
 */

/*
[
    {
        "event": _onDealPotCards,
        "tableId": number,
        "data": {
            "pots": [ number, number ... ], // ordered in a way that the "active pot" (if players all in without a showdown situation and the hand continues normally) is in front
            "cards": [
                {
                    "suit": number,
                    "num": number
                }
            ]
        }
    }
]
*/

/**
 * Hand ends.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} handId - hand identifier
 */

/*
[
    {
        "event": _onEndHand,
        "tableId": number,
        "hand_id": number
    }
]
*/

/**
 * Hand ends.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} handId - hand identifier
 */

/*
[
    {
        "event": _onEndHand,
        "tableId": number,
        "hand_id": number
    }
]
*/

/**
 * Hero is moved between tournament tables.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier for old table
 * @param {number} newTableId - hand identifier for the table being moved on
 * @param {number} newWindowHandle - window
 */

/*
[
    {
        "event": _onTournamentMovedToTable,
        "tableId": number,
        "newTableId": number,
        "newWindowHandle": number
    }
]
*/

/**
 * Player on the Hero table decides to sit out.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} seat - seat of player sitting out
 */

/*
[
    {
        "event": _onTournamentPlayerInactive,
        "tableId": number,
        "seat": number
    }
]
*/

/**
 * Player on the Hero stops sitting out.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {number} seat - seat of player returning
 */

/*
[
    {
        "event": _onTournamentPlayerBackOnTable,
        "tableId": number,
        "seat": number
    }
]
*/

/**
 * Tournament ends for the Hero.
 *
 * @param {number} event - eventConstant
 * @param {number} tourneyId - Tournament identifier
 * @param {object} tournamentRes - Hero results for the tournament
 */

/*
[
    {
        "event": _onTournamentPlayerFinished,
        "tourneyId": number,
        "tournamentRes": {
            "position": number,
            ...
        }
    }
]
*/

/**
 * Hero re-enters into the tournament.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} reenterData - Reenter information
 */

/*
[
    {
        "event": _onTournamentReenter,
        "tableId": number,
        "reenterData": {
            "amount": number,
            ...
        }
    }
]
*/

/**
 * Hero rebuys into the tournament.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} rebuyData - Rebuy information
 */

/*
[
    {
        "event": _onTournamentRebuy,
        "tableId": number,
        "rebuyData": {
            "amount": number,
            ...
        }
    }
]
*/

/**
 * Hero addons into the tournament.
 *
 * @param {number} event - eventConstant
 * @param {number} tableId - table identifier
 * @param {object} addonData - Addon information
 */

/*
[
    {
        "event": _onTournamentAddon,
        "tableId": number,
        "addonData": {
            "amount": number,
            ...
        }
    }
]
*/

/**
 * Tournament information updates.
 *
 * @param {number} event - eventConstant
 * @param {number} tourneyId - table identifier
 * @param {object} tourneyData - Tournament information
 */

/*
[
    {
        "event": _onTournamentStats,
        "tourneyId": number,
        "tourneyData": {
            "position": number,
            ...
        }
    }
]
*/
