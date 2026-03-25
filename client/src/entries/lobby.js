import "@scss/lobby.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import $ from "jquery";
window.$ = $;

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
}

$(function () {
  // Start the lobby
  new Lobby();

  $("#game-add").on("click", function () {
    console.log("NEW GAME");
  });
});
