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

  $("#game-add").on("click", function () {
    const modalElement = document.getElementById("newgameModal");
    if (modalElement) {
      const modal = new Modal(modalElement);
      loadPlayers();
      modal.show();
    }
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
    if (response.data?.authenticated) {
      //window.location.href = "/lobby.html";
      return;
    }
  }

  $("#newgameModal").on("submit", function (e) {
    let selectedPlayer = $("#selected-players>.badge");
    if (selectedPlayer.length > 0) {
      let gamename = $("#game-name").val();
      let gamerid = selectedPlayer.find("button").data("player-id");
      createGame(gamename, gamerid);
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

  //Update online Players in Lobby
  async function lobbyPlayers() {
    try {
      let data = {
        onlyOnline: true,
      };
      const response = await api.post("/api/getplayers", data);
      allPlayers = response.data;
      const playersArray = Object.values(allPlayers.players);
      console.log(playersArray);

      const list = $(".player-list ul");

      playersArray.forEach((player) => {
        console.log(player);

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

  lobbyPlayers();
});
