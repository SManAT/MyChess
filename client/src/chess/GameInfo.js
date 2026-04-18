export class GameInfo {
  constructor(container) {
    this.gameState = null;
    this.playerColor = null;
    this.playerId = null;
    this.container = container;
  }

  setGameState(gameState) {
    this.gameState = gameState;
    this.render();
  }

  setPlayerInfo(playerId, playerColor) {
    this.playerId = playerId;
    this.playerColor = playerColor;
    this.render();
  }

  render() {
    const infoElement = this.container;

    const { players, currentPlayer, gameStatus, moveHistory } = this.gameState;
    const playerList = Object.values(players);

    let html = `
      <h2>Game Info</h2>
      <div class="status-message">
        Status: ${gameStatus.toUpperCase()}
        ${gameStatus === "active" ? `<br>Current Turn: ${currentPlayer.toUpperCase()}` : ""}
      </div>
    `;

    // Players info
    html += '<div class="players-section"><h3>Players</h3>';
    playerList.forEach((player) => {
      const isCurrentPlayer =
        gameStatus === "active" && player.color === currentPlayer;
      const isThisPlayer = player.id === this.playerId;

      html += `
        <div class="player-info ${isCurrentPlayer ? "active" : ""}">
          <strong>${player.name}</strong> 
          <span style="float: right;">
            ${player.color === "white" ? "♔" : "♛"} ${player.color}
            ${isThisPlayer ? " (You)" : ""}
          </span>
        </div>
      `;
    });
    html += "</div>";

    // Move history
    if (moveHistory && moveHistory.length > 0) {
      html += '<div class="move-history"><h3>Move History</h3>';
      moveHistory.slice(-10).forEach((move, index) => {
        const moveNum = moveHistory.length - 10 + index + 1;
        html += `
          <div class="move-item">
            ${moveNum}. ${move.player}: ${this.formatMove(move.from, move.to)}
          </div>
        `;
      });
      html += "</div>";
    }

    // Game controls
    if (gameStatus === "waiting") {
      html += `
        <div class="status-message">
          Waiting for another player to join...
          <br><small>Game ID: ${this.gameState.id}</small>
        </div>
      `;
    }

    infoElement.innerHTML = html;
  }

  formatMove(from, to) {
    const files = "abcdefgh";
    const fromSquare = files[from[1]] + (8 - from[0]);
    const toSquare = files[to[1]] + (8 - to[0]);
    return `${fromSquare}-${toSquare}`;
  }
}
