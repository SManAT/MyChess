import "@scss/lobby.scss";

import $ from "jquery";
import axios from "axios";

import { Modal } from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

window.$ = window.jQuery = $;
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
  let selectedPlayers = [];
  let allPlayers = [];

  //Debug
  const mm = document.getElementById("newgameModal");
  if (mm) {
    const modal = new Modal(mm);
    modal.show();
  }
  //Debug

  // Sample players data - replace with actual API call
  const samplePlayers = [
    { id: 1, username: "player1", email: "player1@example.com", online: true },
    { id: 2, username: "player2", email: "player2@example.com", online: false },
    {
      id: 3,
      username: "chessmaster",
      email: "chess@example.com",
      online: true,
    },
    { id: 4, username: "rookie", email: "rookie@example.com", online: true },
  ];

  // Load players from API
  async function loadPlayers() {
    try {
      // Replace with actual API call
      // const response = await axios.get('/api/players');
      // allPlayers = response.data;
      allPlayers = samplePlayers; // Using sample data
      updatePlayerDropdown(allPlayers);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  // Player search functionality
  $("#player-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    const filteredPlayers = allPlayers.filter(
      (player) =>
        player.username.toLowerCase().includes(searchTerm) ||
        player.email.toLowerCase().includes(searchTerm),
    );
    updatePlayerDropdown(filteredPlayers);
  });

  // Update dropdown with filtered players
  function updatePlayerDropdown(players) {
    const dropdown = $("#player-dropdown");
    dropdown.empty();

    if (players.length === 0) {
      dropdown.append(
        '<li><span class="dropdown-item-text text-muted">No players found</span></li>',
      );
      return;
    }

    players.forEach((player) => {
      // Skip already selected players
      if (selectedPlayers.find((p) => p.id === player.id)) return;

      const onlineIndicator = player.online
        ? '<i class="bi bi-circle-fill text-success me-2" style="font-size: 0.5rem;"></i>'
        : '<i class="bi bi-circle text-secondary me-2" style="font-size: 0.5rem;"></i>';

      dropdown.append(`
        <li>
          <a class="dropdown-item player-item" href="#" data-player-id="${player.id}">
            ${onlineIndicator}
            <strong>${player.username}</strong>
            <small class="text-muted d-block">${player.email}</small>
          </a>
        </li>
      `);
    });
  }

  // Handle player selection
  $(document).on("click", ".player-item", function (e) {
    e.preventDefault();
    const playerId = parseInt($(this).data("player-id"));
    const player = allPlayers.find((p) => p.id === playerId);

    if (player && !selectedPlayers.find((p) => p.id === playerId)) {
      selectedPlayers.push(player);
      updateSelectedPlayers();
      $("#player-search").val("").trigger("input"); // Clear search and refresh dropdown
    }
  });

  // Update selected players display
  function updateSelectedPlayers() {
    const container = $("#selected-players");
    container.empty();

    if (selectedPlayers.length === 0) {
      container.append('<small class="text-muted">No players selected</small>');
      return;
    }

    selectedPlayers.forEach((player) => {
      const onlineClass = player.online ? "success" : "secondary";
      container.append(`
        <span class="badge bg-${onlineClass} me-2 mb-2">
          ${player.username}
          <button type="button" class="btn-close btn-close-white ms-2 remove-player" 
                  data-player-id="${player.id}" style="font-size: 0.7rem;"></button>
        </span>
      `);
    });
  }

  // Remove selected player
  $(document).on("click", ".remove-player", function () {
    const playerId = parseInt($(this).data("player-id"));
    selectedPlayers = selectedPlayers.filter((p) => p.id !== playerId);
    updateSelectedPlayers();
    $("#player-search").trigger("input"); // Refresh dropdown
  });

  $("#game-add").on("click", function () {
    const modalElement = document.getElementById("newgameModal");
    if (modalElement) {
      const modal = new Modal(modalElement);
      loadPlayers();
      modal.show();
    }
  });

  // Use native event listeners for Bootstrap 5
  const modalElement = document.getElementById("newgameModal");
  if (modalElement) {
    modalElement.addEventListener("shown.bs.modal", function () {
      document.getElementById("group-name")?.focus();
    });

    modalElement.addEventListener("hidden.bs.modal", function () {
      // Cleanup code here
    });
  }
});
