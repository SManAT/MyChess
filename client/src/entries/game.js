import "@scss/lobby.scss";
import "@scss/chess.scss";
import "@scss/sweetalert.scss";
import "@scss/notifications.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import $ from "jquery";
window.$ = $;

import api from "../utils/axiosApi.js";
import socketManager from "../utils/socketManager.js";
import { ChessBoard } from "../chess/ChessBoard.js";
import { GameInfo } from "../chess/GameInfo.js";

class ChessApp {
  constructor() {
    this.socket = null;
    this.gameState = null;
    this.playerColor = null;
    this.gameId = null;

    this.socket = socketManager.getSocket();
    if (this.socket && this.socket.connected) {
      // Use existing connection
    } else {
      // Reconnect if needed
      socketManager.connect();
    }

    this.chessBoard = new ChessBoard(
      (from, to) => this.makeMove(from, to),
      (row, col) => this.handleSquareClick(row, col),
    );

    this.gameId = localStorage.getItem("gameId");
    this.username = localStorage.getItem("username");
    this.userId = localStorage.getItem("userId");
    this.init();
  }

  async init() {
    console.log("Game Id: " + this.gameId);
    console.log("User joined Game: " + this.username);

    //get Game Stats from server
    let data = {
      gameid: this.gameId,
    };
    const response = await api.post("/api/getgamestats", data);
    let stats = response.data;

    console.log("STATS SSSSSSSSSSSSSSSSSSS");
    console.log(stats);

    this.joinGame(this.gameId);

    this.gameInfo = new GameInfo($("gameInfo"));

    this.render();
  }

  /**
   * Send to Server Im joined the game
   * @param {*} gameId
   */
  joinGame(gameId) {
    socketManager.emit("join-game", {
      userId: this.userId,
      username: this.username,
      gameId: this.gameId,
    });
  }

  setupSocketListeners() {
    this.socket.on("player-joined", (data) => {
      console.log("Joined game:", data);
      this.playerId = data.playerId;
      this.playerColor = data.color;
      this.currentView = "game";
      this.gameInfo.setPlayerInfo(this.playerId, this.playerColor);
      this.chessBoard.setPlayerColor(this.playerColor);
      this.render();
    });

    this.socket.on("game-state", (gameState) => {
      console.log("Game state updated:", gameState);
      this.gameState = gameState;
      this.chessBoard.setBoard(gameState.board);
      this.chessBoard.setCurrentPlayer(gameState.currentPlayer);
      this.gameInfo.setGameState(gameState);

      if (gameState.gameStatus === "finished") {
        this.showGameOver();
      }
    });

    this.socket.on("move-made", (data) => {
      console.log("Move made:", data);
      this.gameState = data.gameState;
      this.chessBoard.setBoard(data.gameState.board);
      this.chessBoard.setCurrentPlayer(data.gameState.currentPlayer);
      this.chessBoard.clearSelection();
      this.gameInfo.setGameState(data.gameState);
    });

    this.socket.on("possible-moves", (data) => {
      console.log("Possible moves:", data);
      this.chessBoard.setPossibleMoves(data.moves);
    });

    this.socket.on("move-error", (error) => {
      console.error("Move error:", error);
      this.showError(error);
      this.chessBoard.clearSelection();
    });

    this.socket.on("join-error", (error) => {
      console.error("Join error:", error);
      this.showError(error);
    });

    this.socket.on("player-disconnected", (data) => {
      console.log("Player disconnected:", data);
      this.gameState = data.gameState;
      this.gameInfo.setGameState(data.gameState);
      this.showInfo("A player has disconnected");
    });
  }

  makeMove(from, to) {
    if (this.gameState && this.gameState.currentPlayer === this.playerColor) {
      socketManager.emit("make-move", { from, to });
    }
  }

  handleSquareClick(row, col) {
    if (this.gameState && this.gameState.currentPlayer === this.playerColor) {
      const piece = this.gameState.board[row][col];
      if (piece) {
        socketManager.emit("get-possible-moves", { row, col });
      }
    }
  }

  showError(message) {
    this.showMessage(message, "error");
  }

  showInfo(message) {
    this.showMessage(message, "info");
  }

  showMessage(message, type = "info") {
    const messageEl = document.createElement("div");
    messageEl.className = type === "error" ? "error-message" : "status-message";
    messageEl.textContent = message;
    messageEl.style.position = "fixed";
    messageEl.style.top = "20px";
    messageEl.style.right = "20px";
    messageEl.style.zIndex = "1000";
    messageEl.style.minWidth = "250px";

    document.body.appendChild(messageEl);

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  showGameOver() {
    const winner = this.gameState.currentPlayer === "white" ? "black" : "white";
    this.showInfo(`Game Over! ${winner.toUpperCase()} wins!`);
  }

  render() {
    this.chessBoard.render();
    this.gameInfo.render();
    console.log("RENDERED ------------------");
  }
}

$(function () {
  // Start the application
  new ChessApp();

  //--------------------------------------------------------------
  // Listen for server status events -----------------------------
  window.addEventListener("server-unreachable", (event) => {
    console.log("Server unreachable:", event.detail);
    $(".network_status").removeClass("hidden");
    $("#online_icon").addClass("hidden");
    $(".network_status").html(
      '<i class="bi bi-database-x"></i>Server is currently unreachable. Please try again later...',
    );
  });

  window.addEventListener("server-reachable", (event) => {
    $(".network_status").addClass("hidden");
    $("#online_icon").removeClass("hidden");
  });
});
