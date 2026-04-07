import "@scss/lobby.scss";

import $ from "jquery";
import api from "../utils/axiosApi.js";

import { Modal } from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

window.$ = window.jQuery = $;

$(function () {
  // Start the lobby
  let selectedPlayers = [];
  let allPlayers = [];
  let stackAllPlayers = [];

  // Load players from API
  async function loadPlayers() {
    try {
      const response = await api.post("/api/getplayers");
      allPlayers = response.data;
      const playersArray = Object.values(allPlayers.players);
      updatePlayerDropdown(playersArray);
      stackAllPlayers = playersArray;
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  // Player search functionality
  $("#player-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    if (searchTerm != "") {
      // Convert object values to array
      const playersArray = Object.values(allPlayers.players);
      const filteredPlayers = playersArray.filter((player) => {
        if (!player) return false;
        if (!player.username || typeof player.username !== "string")
          return false;
        if (!searchTerm || typeof searchTerm !== "string") return false;
        return player.username.toLowerCase().includes(searchTerm.toLowerCase());
      });
      updatePlayerDropdown(filteredPlayers);
    } else {
      //bei leer wieder befüllen
      updatePlayerDropdown(stackAllPlayers);
    }
  });

  // Update dropdown with filtered players
  function updatePlayerDropdown(data) {
    const dropdown = $("#player-dropdown");
    dropdown.empty();

    if (data.length === 0) {
      dropdown.append(
        '<li><span class="dropdown-item-text text-muted">No players found</span></li>',
      );
      return;
    }

    data.forEach((player) => {
      // Skip already selected players
      if (selectedPlayers.find((p) => p.id === player.id)) return;

      const onlineIndicator = player.online
        ? '<i class="bi bi-circle-fill text-success me-2 dropdown-icon green"></i>'
        : '<i class="bi bi-circle text-secondary me-2 dropdown-icon red"></i>';

      dropdown.append(`
        <li>
          <a class="dropdown-item player-item" href="#" data-player-id="${player.id}">
            ${onlineIndicator}
            <strong>${player.username}</strong>
          </a>
        </li>
      `);
    });
  }

  // Handle player selection -----------------------------
  $(document).on("click", ".player-item", function (e) {
    e.preventDefault();
    const playerId = parseInt($(this).data("player-id"));
    const player = allPlayers.players.find((p) => p.id === playerId);

    if (player && !selectedPlayers.find((p) => p.id === playerId)) {
      selectedPlayers.push(player);
      updateSelectedPlayers();
    }
  });

  // Update selected players display ------------
  function updateSelectedPlayers() {
    const container = $("#selected-players");
    container.html("");

    selectedPlayers.forEach((player) => {
      container.append(`
        <span class="badge bg-success me-2 mb-2 thebadge">
          <span class="txt">
            ${player.username}
          </span>
          <button type="button" class="btn-close btn-close-white ms-2 remove-player" 
                  data-player-id="${player.id}"></button>
        </span>
      `);
    });
    selectedPlayers = [];
  }

  // Remove selected player
  $(document).on("click", ".remove-player", function () {
    const playerId = parseInt($(this).data("player-id"));
    //selectedPlayers = selectedPlayers.filter((p) => p.id !== playerId);
    selectedPlayers = [];
    $("#selected-players").html("");

    //updateSelectedPlayers();
    //$("#player-search").trigger("input"); // Refresh dropdown
  });

  const modalElement = document.getElementById("newgameModal");
  const modal = new Modal(modalElement);

  $("#game-add").on("click", function () {
    loadPlayers();
    modal.show();
  });

  /**
   * creates a new Chess Game on Server
   */
  async function createGame(gamename, gamerid) {
    let data = {
      name: gamename,
      owner: localStorage.getItem("userId"),
      player: gamerid,
    };
    const response = await api.post("/api/creategame", data);
    loadOwnerGames();
  }

  $("#newgameModal form").on("submit", function (e) {
    e.preventDefault();
    let selectedPlayer = $("#selected-players>.badge");
    if (selectedPlayer.length > 0) {
      let gamename = $("#game-name").val();
      let gamerid = selectedPlayer.find("button").data("player-id");
      createGame(gamename, gamerid);

      // Close modal and reset form
      modal.hide();
      this.reset();
      $("#selected-players").html("");
    }
  });

  //Update online Players in Lobby
  async function lobbyPlayers() {
    try {
      let data = {
        onlyOnline: true,
      };
      const response = await api.post("/api/getplayers", data);
      allPlayers = response.data;
      const playersArray = Object.values(allPlayers.players);
      const list = $(".player-list ul");

      playersArray.forEach((player) => {
        list.append(`
          <li class="player-item" data-id="${player.id}">
              <span>${player.username}</span>
              <div class="action-icons">
                <i class="bi bi-chat" title="Chat"></i>
              </div>
            </li>`);
      });
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  //Update online Players in Lobby
  async function loadOwnerGames() {
    try {
      let data = {};
      const response = await api.post("/api/getgames", data);
      let allGames = response.data;

      const gamesArray = Object.values(allGames.games);
      const list = $(".game-list ul");
      gamesArray.forEach((game) => {
        console.log(game);

        //Opponent Online?
        let badge_color = "sucess";
        if (game.online === false) {
          let badge_color = "alert";
        }

        list.append(`
          <li class="game-item" data-id="${game.id}">
              <span>${game.name}</span>

              <span class="badge bg-${badge_color} me-2 mb-2 thebadge">
              <span class="txt">
                ${game.username}
              </span>
            </span>

              <span>${game.created_at}</span>
              <div class="action-icons">
                <i class="bi bi-play-circle" title="Join"></i>
                <i class="bi bi-chat" title="Chat"></i>
              </div>
            </li>`);
      });
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  lobbyPlayers();
  loadOwnerGames();
});
