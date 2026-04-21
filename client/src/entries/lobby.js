import "@scss/lobby.scss";
import "@scss/sweetalert.scss";
import "@scss/notifications.scss";

import $ from "jquery";
import api from "../utils/axiosApi.js";
import tools from "../utils/tools.js";
import socketManager from "../utils/socketManager.js";
import GAMESTATS from "../utils/gameStats.js";

import { Modal } from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Swal from "sweetalert2";
import moment from "moment";

window.$ = window.jQuery = $;

//User is logged in?
tools.AuthGuard();

const socket = socketManager.connect();

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

  async function logout() {
    let data = {
      username: localStorage.getItem("username"),
    };
    return api
      .post("/api/logout", data)
      .then((response) => {
        console.log("Logout successful:", response.data);

        // Clear storage
        localStorage.removeItem("userId");
        localStorage.removeItem("authToken");

        // Redirect
        window.location.href = "/";

        return response.data;
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
        throw error;
      });
  }

  $("#logout").on("click", function () {
    logout();
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

      const list = $(".game-list ul");

      const sortedGames = allGames.games.sort((a, b) => {
        // Sort by stat first
        if (a.stat !== b.stat) {
          return b.stat - a.stat;
        }

        // Sort by date using moment
        const momentA = moment(a.created_at);
        const momentB = moment(b.created_at);
        return momentB.diff(momentA); // Newest first
      });

      console.log(allGames);
      sortedGames.forEach((game) => {
        //Opponent Online?
        let badge_color = "online";
        if (game.otheronline === false) {
          badge_color = "offline";
        }

        let created = moment(game.created_at);

        let gamestatus = "closed";
        let icons = `<a class="trash-icon"><i class="bi bi-trash-fill" title="Trash"></i></a>`;
        if (game.stat === GAMESTATS.ACTIVE) {
          gamestatus = "active";
          icons = "";
        }

        list.append(`
          <li class="game-item ${gamestatus}" data-id="${game.id}">
            <div class="d-flex justify-content-between flex-wrap" style="width:100%;">
            <div>
              <b>${game.name}</b>
              vs.
              <span class="onlinebadge ${badge_color}">
                <span class="txt">${game.otherplayer}</span>
              </span>
            </div>
            <div>
              <div class="action-icons">
              ${created.format("DD.MM.YYYY")}
              ${icons}
              </div>
            </div>
            </div>
          </li>`);
      });
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  lobbyPlayers();
  loadOwnerGames().then(() => {
    $(".trash-icon").on("click", function (e) {
      e.stopPropagation();
      const gameId = $(this).closest("li.game-item").data("id");
      console.log("Trash Delete");
      console.log(gameId);
    });

    $("li.game-item").on("click", function (e) {
      if (!$(e.target).closest(".trash-icon").length) {
        //game closed?
        if ($(this).hasClass("closed")) {
          Swal.fire({
            html: `Partie ist beendet!`,
            showDenyButton: false,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            iconHtml: '<img src="/src/public/cat/cat-sleep.png">',
            customClass: {
              icon: "my-cats",
              actions: "my-actions",
            },
          });
        } else {
          let id = $(this).data("id");
          const badge = $(this).find(".onlinebadge");
          let opponent = badge.find(".txt").html();
          let online = false;
          if (badge.hasClass("online")) {
            online = true;
          }

          if (online) {
            Swal.fire({
              html: `<b>Partie</b> gegen <i>${opponent}</i> spielen?`,
              showDenyButton: true,
              confirmButtonText: "Ja",
              denyButtonText: "Nein",
              iconHtml: '<img src="/src/public/cat/cat-chess.png">',
              customClass: {
                icon: "my-cats",
                actions: "my-actions",
                confirmButton: "order-2",
                denyButton: "order-1",
              },
            }).then((result) => {
              if (result.isConfirmed) {
                localStorage.setItem("gameId", id);
                localStorage.setItem("gameStatus", id);
                window.location = "/game.html";
              }
            });
          } else {
            Swal.fire({
              title: "Dein Gegenüber ist offline!",
              icon: "success",
              iconHtml: '<img src="/src/public/cat/cat-sleep.png">',
              customClass: {
                icon: "my-cats",
              },
            });
          }
        }
      }
    });
  });
  //Username
  $(".user-dropdown>span").html(localStorage.getItem("username"));
  $("#navusername>span").html(localStorage.getItem("username"));

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
