export class GameLobby {
  constructor(onJoinGame) {
    this.onJoinGame = onJoinGame;
  }

  render() {
    return `
      <div class="lobby">
        <h1>♔ Chess Game ♛</h1>
        <p>Enter your name to start playing</p>
        <input type="text" id="playerName" placeholder="Your name" maxlength="20">
        <input type="text" id="gameId" placeholder="Game ID (optional)">
        <button id="joinGame">Join Game</button>
      </div>
    `;
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
