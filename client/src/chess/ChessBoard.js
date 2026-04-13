import $ from "jquery";
import { getPieceSymbol, isLightSquare } from "../utils/chessUtils.js";

export class ChessBoard {
  constructor(onMove, onSquareClick) {
    this.board = [];
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.onMove = onMove;
    this.onSquareClick = onSquareClick;
    this.playerColor = "white";
    this.currentPlayer = "white";

    this.board = this.initBoard();
  }

  initBoard() {
    const array = [];
    for (let i = 0; i < 8; i++) {
      array[i] = [];
      for (let j = 0; j < 8; j++) {
        array[i][j] = null;
      }
    }
    return array;
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
    const board = $("#chessboard");
    console.log(board);

    let html = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRow = this.playerColor === "white" ? row : 7 - row;
        const displayCol = this.playerColor === "white" ? col : 7 - col;

        const piece = this.board[displayRow][displayCol];
        const isLight = isLightSquare(row, col);
        const isSelected =
          this.selectedSquare &&
          this.selectedSquare[0] === displayRow &&
          this.selectedSquare[1] === displayCol;
        const isPossibleMove = this.possibleMoves.some(
          ([r, c]) => r === displayRow && c === displayCol,
        );

        let squareClass = `square ${isLight ? "light" : "dark"}`;
        if (isSelected) squareClass += " selected";
        if (isPossibleMove) squareClass += " possible-move";

        html += `
          <div class="${squareClass}" 
              data-row="${displayRow}" 
              data-col="${displayCol}">
            ${piece ? `<div class="piece">${getPieceSymbol(piece)}</div>` : ""}
          </div>
        `;
      }
    }

    console.log(html);

    board.html(html);
    this.attachSquareListeners();
  }

  attachSquareListeners() {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.addEventListener("click", (e) => {
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
}
