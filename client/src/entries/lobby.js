import "@scss/lobby.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import $ from "jquery";
import axios from "axios";

window.$ = $;
window.axios = axios;

class Lobby {
  constructor(onJoinGame) {
    this.onJoinGame = onJoinGame;
  }

  attachEventListeners() {
    const joinButton = document.getElementById("joinGame");
    const playerNameInput = document.getElementById("playerName");
    const gameIdInput = document.getElementById("gameId");

    const handleJoin = () => {
      const playerName = playerNameInput.value.trim();
      const gameId = gameIdInput.value.trim();

      if (playerName) {
        this.onJoinGame(playerName, gameId);
      } else {
        alert("Please enter your name");
        playerNameInput.focus();
      }
    };

    joinButton.addEventListener("click", handleJoin);

    playerNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleJoin();
      }
    });

    gameIdInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleJoin();
      }
    });

    // Focus on name input
    setTimeout(() => playerNameInput.focus(), 100);
  }

  /**
   * creates a new Chess Game on Server
   */
  async createGame() {
    let data = {
      username: localStorage.getItem("username"),
      token: localStorage.getItem("authToken"),
    };
    const response = await axios.post("/creategame", data);
    if (response.data?.authenticated) {
      localStorage.setItem("authToken", response.data.token);
      window.location.href = "/lobby.html";
      return;
    }
  }
}

$(function () {
  // Start the lobby
  const lobby = new Lobby();

  $("#game-add").on("click", function () {
    lobby.createGame();
    $("#newgameModal").modal("show");
  });

  $("#newgameModal").on("shown.bs.modal", function (event) {
    $("#group-name").trigger("focus");
  });

  // After modal is fully hidden
  $("#newgameModal").on("hidden.bs.modal", function (event) {
    // Cleanup code here
  });
});
