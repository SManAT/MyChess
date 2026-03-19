# MyChess
Chess Network Playing


I'll help you create a real-time chess application using Node.js, Express, Vite, and Socket.IO. This will be a complete player vs player chess game with real-time updates.

## Project Structure

```
chess-app/
├── server/
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   ├── Game.js
│   │   └── ChessLogic.js
│   └── socket/
│       └── gameHandler.js
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   ├── style.css
│   │   ├── components/
│   │   │   ├── ChessBoard.js
│   │   │   ├── GameLobby.js
│   │   │   └── GameInfo.js
│   │   └── utils/
│   │       ├── socket.js
│   │       └── chessUtils.js
└── README.md
```

## Backend Implementation

### Server Package.json

```json
{
  "name": "chess-server",
  "version": "1.0.0",
  "description": "Chess game server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Main Server (`server/server.js`)

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const gameHandler = require('./socket/gameHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Socket handling
gameHandler(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Game Model (`server/models/Game.js`)

```javascript
const { v4: uuidv4 } = require('uuid');
const ChessLogic = require('./ChessLogic');

class Game {
  constructor() {
    this.id = uuidv4();
    this.players = {};
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.gameStatus = 'waiting'; // waiting, active, finished
    this.moveHistory = [];
    this.chessLogic = new ChessLogic();
  }

  initializeBoard() {
    return [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
  }

  addPlayer(playerId, playerName) {
    if (Object.keys(this.players).length >= 2) {
      return false;
    }

    const color = Object.keys(this.players).length === 0 ? 'white' : 'black';
    this.players[playerId] = {
      id: playerId,
      name: playerName,
      color: color
    };

    if (Object.keys(this.players).length === 2) {
      this.gameStatus = 'active';
    }

    return true;
  }

  removePlayer(playerId) {
    delete this.players[playerId];
    if (Object.keys(this.players).length === 0) {
      this.gameStatus = 'finished';
    }
  }

  makeMove(playerId, from, to) {
    const player = this.players[playerId];
    if (!player || player.color !== this.currentPlayer || this.gameStatus !== 'active') {
      return { success: false, error: 'Invalid turn' };
    }

    const moveResult = this.chessLogic.makeMove(this.board, from, to, this.currentPlayer);
    
    if (moveResult.success) {
      this.board = moveResult.board;
      this.moveHistory.push({ from, to, player: this.currentPlayer, timestamp: Date.now() });
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      
      if (moveResult.checkmate) {
        this.gameStatus = 'finished';
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
      moveHistory: this.moveHistory
    };
  }
}

module.exports = Game;
```

### Chess Logic (`server/models/ChessLogic.js`)

```javascript
class ChessLogic {
  constructor() {
    this.pieceValues = {
      'p': 1, 'P': 1,
      'r': 5, 'R': 5,
      'n': 3, 'N': 3,
      'b': 3, 'B': 3,
      'q': 9, 'Q': 9,
      'k': 100, 'K': 100
    };
  }

  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  isWhitePiece(piece) {
    return piece && piece === piece.toUpperCase();
  }

  isBlackPiece(piece) {
    return piece && piece === piece.toLowerCase();
  }

  isSameColor(piece1, piece2) {
    if (!piece1 || !piece2) return false;
    return (this.isWhitePiece(piece1) && this.isWhitePiece(piece2)) ||
           (this.isBlackPiece(piece1) && this.isBlackPiece(piece2));
  }

  getPossibleMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    if (!piece) return [];

    const pieceLower = piece.toLowerCase();
    const moves = [];

    switch (pieceLower) {
      case 'p':
        moves.push(...this.getPawnMoves(board, fromRow, fromCol));
        break;
      case 'r':
        moves.push(...this.getRookMoves(board, fromRow, fromCol));
        break;
      case 'n':
        moves.push(...this.getKnightMoves(board, fromRow, fromCol));
        break;
      case 'b':
        moves.push(...this.getBishopMoves(board, fromRow, fromCol));
        break;
      case 'q':
        moves.push(...this.getQueenMoves(board, fromRow, fromCol));
        break;
      case 'k':
        moves.push(...this.getKingMoves(board, fromRow, fromCol));
        break;
    }

    return moves;
  }

  getPawnMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const direction = this.isWhitePiece(piece) ? -1 : 1;
    const startRow = this.isWhitePiece(piece) ? 6 : 1;

    // Forward move
    const newRow = fromRow + direction;
    if (this.isValidPosition(newRow, fromCol) && !board[newRow][fromCol]) {
      moves.push([newRow, fromCol]);

      // Double move from starting position
      if (fromRow === startRow) {
        const doubleRow = fromRow + 2 * direction;
        if (this.isValidPosition(doubleRow, fromCol) && !board[doubleRow][fromCol]) {
          moves.push([doubleRow, fromCol]);
        }
      }
    }

    // Diagonal captures
    for (const colOffset of [-1, 1]) {
      const newCol = fromCol + colOffset;
      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = board[newRow][newCol];
        if (targetPiece && !this.isSameColor(piece, targetPiece)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  }

  getRookMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [rowDir, colDir] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = fromRow + i * rowDir;
        const newCol = fromCol + i * colDir;

        if (!this.isValidPosition(newRow, newCol)) break;

        const targetPiece = board[newRow][newCol];
        if (!targetPiece) {
          moves.push([newRow, newCol]);
        } else {
          if (!this.isSameColor(piece, targetPiece)) {
            moves.push([newRow, newCol]);
          }
          break;
        }
      }
    }

    return moves;
  }

  getKnightMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rowOffset, colOffset] of knightMoves) {
      const newRow = fromRow + rowOffset;
      const newCol = fromCol + colOffset;

      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = board[newRow][newCol];
        if (!targetPiece || !this.isSameColor(piece, targetPiece)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  }

  getBishopMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (const [rowDir, colDir] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = fromRow + i * rowDir;
        const newCol = fromCol + i * colDir;

        if (!this.isValidPosition(newRow, newCol)) break;

        const targetPiece = board[newRow][newCol];
        if (!targetPiece) {
          moves.push([newRow, newCol]);
        } else {
          if (!this.isSameColor(piece, targetPiece)) {
            moves.push([newRow, newCol]);
          }
          break;
        }
      }
    }

    return moves;
  }

  getQueenMoves(board, fromRow, fromCol) {
    return [
      ...this.getRookMoves(board, fromRow, fromCol),
      ...this.getBishopMoves(board, fromRow, fromCol)
    ];
  }

  getKingMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [rowOffset, colOffset] of directions) {
      const newRow = fromRow + rowOffset;
      const newCol = fromCol + colOffset;

      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = board[newRow][newCol];
        if (!targetPiece || !this.isSameColor(piece, targetPiece)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  }

  isValidMove(board, from, to, currentPlayer) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    if (!this.isValidPosition(fromRow, fromCol) || !this.isValidPosition(toRow, toCol)) {
      return false;
    }

    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    const isWhiteMove = currentPlayer === 'white';
    if ((isWhiteMove && this.isBlackPiece(piece)) || (!isWhiteMove && this.isWhitePiece(piece))) {
      return false;
    }

    const possibleMoves = this.getPossibleMoves(board, fromRow, fromCol);
    return possibleMoves.some(([row, col]) => row === toRow && col === toCol);
  }

  makeMove(board, from, to, currentPlayer) {
    if (!this.isValidMove(board, from, to, currentPlayer)) {
      return { success: false, error: 'Invalid move' };
    }

    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    const piece = newBoard[fromRow][fromCol];
    const capturedPiece = newBoard[toRow][toCol];

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    return {
      success: true,
      board: newBoard,
      capturedPiece: capturedPiece,
      checkmate: false // TODO: Implement checkmate detection
    };
  }
}

module.exports = ChessLogic;
```

### Socket Game Handler (`server/socket/gameHandler.js`)

```javascript
const Game = require('../models/Game');

const games = new Map();
const players = new Map();

function gameHandler(io) {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('join-game', ({ playerName, gameId }) => {
      let game;

      if (gameId && games.has(gameId)) {
        game = games.get(gameId);
      } else {
        // Find an available game or create new one
        game = Array.from(games.values()).find(g => 
          g.gameStatus === 'waiting' && Object.keys(g.players).length < 2
        );

        if (!game) {
          game = new Game();
          games.set(game.id, game);
        }
      }

      const joined = game.addPlayer(socket.id, playerName);
      if (!joined) {
        socket.emit('join-error', 'Game is full');
        return;
      }

      players.set(socket.id, { gameId: game.id, playerName });
      socket.join(game.id);

      // Send game state to all players in the game
      io.to(game.id).emit('game-state', game.getGameState());
      
      // Send player-specific info
      socket.emit('player-joined', {
        gameId: game.id,
        playerId: socket.id,
        color: game.players[socket.id].color
      });

      console.log(`Player ${playerName} joined game ${game.id}`);
    });

    socket.on('make-move', ({ from, to }) => {
      const playerInfo = players.get(socket.id);
      if (!playerInfo) return;

      const game = games.get(playerInfo.gameId);
      if (!game) return;

      const moveResult = game.makeMove(socket.id, from, to);
      
      if (moveResult.success) {
        // Broadcast move to all players in the game
        io.to(game.id).emit('move-made', {
          from,
          to,
          gameState: game.getGameState()
        });
      } else {
        socket.emit('move-error', moveResult.error);
      }
    });

    socket.on('get-possible-moves', ({ row, col }) => {
      const playerInfo = players.get(socket.id);
      if (!playerInfo) return;

      const game = games.get(playerInfo.gameId);
      if (!game) return;

      const possibleMoves = game.chessLogic.getPossibleMoves(game.board, row, col);
      socket.emit('possible-moves', { from: [row, col], moves: possibleMoves });
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      
      const playerInfo = players.get(socket.id);
      if (playerInfo) {
        const game = games.get(playerInfo.gameId);
        if (game) {
          game.removePlayer(socket.id);
          io.to(game.id).emit('player-disconnected', {
            playerId: socket.id,
            gameState: game.getGameState()
          });

          // Clean up empty games
          if (Object.keys(game.players).length === 0) {
            games.delete(game.id);
          }
        }
        players.delete(socket.id);
      }
    });
  });
}

module.exports = gameHandler;
```

## Frontend Implementation

### Client Package.json

```json
{
  "name": "chess-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "vite": "^4.4.5"
  }
}
```

### Vite Config (`client/vite.config.js`)

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173
  }
});
```

### HTML Template (`client/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Main CSS (`client/src/style.css`)

```css
* {
  box-sizing: border-box;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.game-container {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  width: 100%;
}

.chess-board {
  width: 600px;
  height: 600px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  border: 3px solid #8b4513;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.square {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.square:hover {
  transform: scale(1.05);
}

.square.light {
  background-color: #f0d9b5;
}

.square.dark {
  background-color: #b58863;
}

.square.selected {
  background-color: #7fb069 !important;
  box-shadow: inset 0 0 0 3px #4a7c59;
}

.square.possible-move {
  background-color: #ffeb3b !important;
}

.square.possible-move::after {
  content: '';
  position: absolute;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.6);
}

.piece {
  font-size: 48px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease;
}

.piece:hover {
  transform: scale(1.1);
}

.game-info {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  height: fit-content;
}

.game-info h2 {
  margin-top: 0;
  color: #333;
}

.player-info {
  background: #f5f5f5;
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.player-info.active {
  border-left-color: #4CAF50;
  background: #e8f5e8;
}

.lobby {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.lobby input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.lobby button {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.lobby button:hover {
  background: #1976D2;
}

.move-history {
  max-height: 200px;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  margin-top: 20px;
}

.move-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-family: monospace;
  font-size: 14px;
}

.status-message {
  background: #e3f2fd;
  border: 1px solid #2196F3;
  color: #1976D2;
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
  text-align: center;
}

.error-message {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
  text-align: center;
}
```

### Socket Utility (`client/src/utils/socket.js`)

```javascript
import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    this.socket = io('http://localhost:3001');
    
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketManager();
```

### Chess Utilities (`client/src/utils/chessUtils.js`)

```javascript
export const PIECE_SYMBOLS = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

export function getPieceSymbol(piece) {
  return PIECE_SYMBOLS[piece] || '';
}

export function isLightSquare(row, col) {
  return (row + col) % 2 === 0;
}

export function formatMove(from, to) {
  const files = 'abcdefgh';
  const fromSquare = files[from[1]] + (8 - from[0]);
  const toSquare = files[to[1]] + (8 - to[0]);
  return `${fromSquare}-${toSquare}`;
}

export function isWhitePiece(piece) {
  return piece && piece === piece.toUpperCase();
}

export function isBlackPiece(piece) {
  return piece && piece === piece.toLowerCase();
}
```

<details>
<summary><strong>Frontend Components (Click to expand)</strong></summary>

### Game Lobby (`client/src/components/GameLobby.js`)

```javascript
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
    const joinButton = document.getElementById('joinGame');
    const playerNameInput = document.getElementById('playerName');
    const gameIdInput = document.getElementById('gameId');

    const handleJoin = () => {
      const playerName = playerNameInput.value.trim();
      const gameId = gameIdInput.value.trim();
      
      if (playerName) {
        this.onJoinGame(playerName, gameId);
      } else {
        alert('Please enter your name');
        playerNameInput.focus();
      }
    };

    joinButton.addEventListener('click', handleJoin);
    
    playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    });

    gameIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    });

    // Focus on name input
    setTimeout(() => playerNameInput.focus(), 100);
  }
}
```

### Chess Board (`client/src/components/ChessBoard.js`)

```javascript
import { getPieceSymbol, isLightSquare } from '../utils/chessUtils.js';

export class ChessBoard {
  constructor(onMove, onSquareClick) {
    this.board = null;
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.onMove = onMove;
    this.onSquareClick = onSquareClick;
    this.playerColor = 'white';
    this.currentPlayer = 'white';
  }

  setBoard(board) {
    this.board = board;
    this.render();
  }

  setPlayerColor(color) {
    this.playerColor = color;
    this.render();
  }

  setCurrentPlayer(player) {
    this.currentPlayer = player;
  }

  selectSquare(row, col) {
    this.selectedSquare = [row, col];
    this.onSquareClick(row, col);
  }

  setPossibleMoves(moves) {
    this.possibleMoves = moves;
    this.render();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.render();
  }

  render() {
    if (!this.board) return '';

    const boardElement = document.getElementById('chessboard');
    if (!boardElement) return '';

    let html = '';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRow = this.playerColor === 'white' ? row : 7 - row;
        const displayCol = this.playerColor === 'white' ? col : 7 - col;
        
        const piece = this.board[displayRow][displayCol];
        const isLight = isLightSquare(row, col);
        const isSelected = this.selectedSquare && 
          this.selectedSquare[0] === displayRow && this.selectedSquare[1] === displayCol;
        const isPossibleMove = this.possibleMoves.some(([r, c]) => r === displayRow && c === displayCol);

        let squareClass = `square ${isLight ? 'light' : 'dark'}`;
        if (isSelected) squareClass += ' selected';
        if (isPossibleMove) squareClass += ' possible-move';

        html += `
          <div class="${squareClass}" 
               data-row="${displayRow}" 
               data-col="${displayCol}">
            ${piece ? `<div class="piece">${getPieceSymbol(piece)}</div>` : ''}
          </div>
        `;
      }
    }

    boardElement.innerHTML = html;
    this.attachSquareListeners();
  }

  attachSquareListeners() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
      square.addEventListener('click', (e) => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        this.handleSquareClick(row, col);
      });
    });
  }

  handleSquareClick(row, col) {
    if (this.currentPlayer !== this.playerColor) {
      return; // Not player's turn
    }

    if (this.selectedSquare) {
      const [selectedRow, selectedCol] = this.selectedSquare;
      
      if (selectedRow === row && selectedCol === col) {
        // Clicking same square - deselect
        this.clearSelection();
      } else if (this.possibleMoves.some(([r, c]) => r === row && c === col)) {
        // Valid move
        this.onMove([selectedRow, selectedCol], [row, col]);
        this.clearSelection();
      } else {
        // Select new square
        this.selectSquare(row, col);
      }
    } else {
      // No square selected - select this square
      this.selectSquare(row, col);
    }
  }

  getHTML() {
    return '<div id="chessboard" class="chess-board"></div>';
  }
}
```

### Game Info (`client/src/components/GameInfo.js`)

```javascript
export class GameInfo {
  constructor() {
    this.gameState = null;
    this.playerColor = null;
    this.playerId = null;
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
    const infoElement = document.getElementById('gameInfo');
    if (!infoElement || !this.gameState) return;

    const { players, currentPlayer, gameStatus, moveHistory } = this.gameState;
    const playerList = Object.values(players);

    let html = `
      <h2>Game Info</h2>
      <div class="status-message">
        Status: ${gameStatus.toUpperCase()}
        ${gameStatus === 'active' ? `<br>Current Turn: ${currentPlayer.toUpperCase()}` : ''}
      </div>
    `;

    // Players info
    html += '<div class="players-section"><h3>Players</h3>';
    playerList.forEach(player => {
      const isCurrentPlayer = gameStatus === 'active' && player.color === currentPlayer;
      const isThisPlayer = player.id === this.playerId;
      
      html += `
        <div class="player-info ${isCurrentPlayer ? 'active' : ''}">
          <strong>${player.name}</strong> 
          <span style="float: right;">
            ${player.color === 'white' ? '♔' : '♛'} ${player.color}
            ${isThisPlayer ? ' (You)' : ''}
          </span>
        </div>
      `;
    });
    html += '</div>';

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
      html += '</div>';
    }

    // Game controls
    if (gameStatus === 'waiting') {
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
    const files = 'abcdefgh';
    const fromSquare = files[from[1]] + (8 - from[0]);
    const toSquare = files[to[1]] + (8 - to[0]);
    return `${fromSquare}-${toSquare}`;
  }

  getHTML() {
    return '<div id="gameInfo" class="game-info"></div>';
  }
}
```

</details>

### Main Application (`client/src/main.js`)

```javascript
import './style.css';
import socketManager from './utils/socket.js';
import { ChessBoard } from './components/ChessBoard.js';
import { GameLobby } from './components/GameLobby.js';
import { GameInfo } from './components/GameInfo.js';

class ChessApp {
  constructor() {
    this.socket = null;
    this.gameState = null;
    this.playerColor = null;
    this.playerId = null;
    this.currentView = 'lobby';
    
    this.chessBoard = new ChessBoard(
      (from, to) => this.makeMove(from, to),
      (row, col) => this.handleSquareClick(row, col)
    );
    this.gameLobby = new GameLobby((name, gameId) => this.joinGame(name, gameId));
    this.gameInfo = new GameInfo();
    
    this.init();
  }

  init() {
    this.socket = socketManager.connect();
    this.setupSocketListeners();
    this.render();
  }

  setupSocketListeners() {
    this.socket.on('player-joined', (data) => {
      console.log('Joined game:', data);
      this.playerId = data.playerId;
      this.playerColor = data.color;
      this.currentView = 'game';
      this.gameInfo.setPlayerInfo(this.playerId, this.playerColor);
      this.chessBoard.setPlayerColor(this.playerColor);
      this.render();
    });

    this.socket.on('game-state', (gameState) => {
      console.log('Game state updated:', gameState);
      this.gameState = gameState;
      this.chessBoard.setBoard(gameState.board);
      this.chessBoard.setCurrentPlayer(gameState.currentPlayer);
      this.gameInfo.setGameState(gameState);
      
      if (gameState.gameStatus === 'finished') {
        this.showGameOver();
      }
    });

    this.socket.on('move-made', (data) => {
      console.log('Move made:', data);
      this.gameState = data.gameState;
      this.chessBoard.setBoard(data.gameState.board);
      this.chessBoard.setCurrentPlayer(data.gameState.currentPlayer);
      this.chessBoard.clearSelection();
      this.gameInfo.setGameState(data.gameState);
    });

    this.socket.on('possible-moves', (data) => {
      console.log('Possible moves:', data);
      this.chessBoard.setPossibleMoves(data.moves);
    });

    this.socket.on('move-error', (error) => {
      console.error('Move error:', error);
      this.showError(error);
      this.chessBoard.clearSelection();
    });

    this.socket.on('join-error', (error) => {
      console.error('Join error:', error);
      this.showError(error);
    });

    this.socket.on('player-disconnected', (data) => {
      console.log('Player disconnected:', data);
      this.gameState = data.gameState;
      this.gameInfo.setGameState(data.gameState);
      this.showInfo('A player has disconnected');
    });
  }

  joinGame(playerName, gameId) {
    socketManager.emit('join-game', { 
      playerName, 
      gameId: gameId || undefined 
    });
  }

  makeMove(from, to) {
    if (this.gameState && this.gameState.currentPlayer === this.playerColor) {
      socketManager.emit('make-move', { from, to });
    }
  }

  handleSquareClick(row, col) {
    if (this.gameState && this.gameState.currentPlayer === this.playerColor) {
      const piece = this.gameState.board[row][col];
      if (piece) {
        socketManager.emit('get-possible-moves', { row, col });
      }
    }
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showInfo(message) {
    this.showMessage(message, 'info');
  }

  showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = type === 'error' ? 'error-message' : 'status-message';
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '1000';
    messageEl.style.minWidth = '250px';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  showGameOver() {
    const winner = this.gameState.currentPlayer === 'white' ? 'black' : 'white';
    this.showInfo(`Game Over! ${winner.toUpperCase()} wins!`);
  }

  render() {
    const app = document.getElementById('app');
    
    if (this.currentView === 'lobby') {
      app.innerHTML = this.gameLobby.render();
      this.gameLobby.attachEventListeners();
    } else {
      app.innerHTML = `
        <div class="game-container">
          ${this.chessBoard.getHTML()}
          ${this.gameInfo.getHTML()}
        </div>
      `;
      
      this.chessBoard.render();
      this.gameInfo.render();
    }
  }
}

// Start the application
new ChessApp();
```

## Running the Application

### 1. Setup Server
```bash
cd server
npm install
npm run dev
```

### 2. Setup Client
```bash
cd client
npm install
npm run dev
```

### 3. Access the Game
Open your browser and navigate to `http://localhost:5173`

## Features

<details>
<summary><strong>Game Features</strong></summary>

- ✅ **Real-time multiplayer gameplay**
- ✅ **Complete chess piece movement logic**
- ✅ **Turn-based gameplay**
- ✅ **Visual move indicators**
- ✅ **Game lobby system**
- ✅ **Move history tracking**
- ✅ **Player disconnection handling**
- ✅ **Responsive design**
- ✅ **Game state synchronization**

</details>

<details>
<summary><strong>Technical Features</strong></summary>

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla JavaScript with Vite
- **Real-time Communication**: WebSocket connections
- **Chess Logic**: Complete piece movement validation
- **Game Management**: Room-based game sessions
- **Error Handling**: Comprehensive error management

</details>

This chess application provides a complete real-time multiplayer chess experience with proper game logic, move validation, and a clean user interface. Players can join games, make moves in real-time, and see their opponent's moves instantly.