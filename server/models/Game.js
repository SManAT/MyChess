const { v4: uuidv4 } = require("uuid");
const ChessLogic = require("./ChessLogic");

class Game {
  constructor() {
    this.id = uuidv4();
    this.players = {};
    this.board = this.initializeBoard();
    this.currentPlayer = "white";
    this.gameStatus = "waiting"; // waiting, active, finished
    this.moveHistory = [];
    this.chessLogic = new ChessLogic();
  }

  initializeBoard() {
    return [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];
  }

  addPlayer(playerId, playerName) {
    if (Object.keys(this.players).length >= 2) {
      return false;
    }

    const color = Object.keys(this.players).length === 0 ? "white" : "black";
    this.players[playerId] = {
      id: playerId,
      name: playerName,
      color: color,
    };

    if (Object.keys(this.players).length === 2) {
      this.gameStatus = "active";
    }

    return true;
  }

  removePlayer(playerId) {
    delete this.players[playerId];
    if (Object.keys(this.players).length === 0) {
      this.gameStatus = "finished";
    }
  }

  makeMove(playerId, from, to) {
    const player = this.players[playerId];
    if (
      !player ||
      player.color !== this.currentPlayer ||
      this.gameStatus !== "active"
    ) {
      return { success: false, error: "Invalid turn" };
    }

    const moveResult = this.chessLogic.makeMove(
      this.board,
      from,
      to,
      this.currentPlayer,
    );

    if (moveResult.success) {
      this.board = moveResult.board;
      this.moveHistory.push({
        from,
        to,
        player: this.currentPlayer,
        timestamp: Date.now(),
      });
      this.currentPlayer = this.currentPlayer === "white" ? "black" : "white";

      if (moveResult.checkmate) {
        this.gameStatus = "finished";
      }
    }

    return moveResult;
  }

  getGameState() {
    return {
      id: this.id,
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      players: this.players,
      moveHistory: this.moveHistory,
    };
  }
}

module.exports = Game;
