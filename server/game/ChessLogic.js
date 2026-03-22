class ChessLogic {
  constructor() {
    this.pieceValues = {
      p: 1,
      P: 1,
      r: 5,
      R: 5,
      n: 3,
      N: 3,
      b: 3,
      B: 3,
      q: 9,
      Q: 9,
      k: 100,
      K: 100,
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
    return (
      (this.isWhitePiece(piece1) && this.isWhitePiece(piece2)) ||
      (this.isBlackPiece(piece1) && this.isBlackPiece(piece2))
    );
  }

  getPossibleMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    if (!piece) return [];

    const pieceLower = piece.toLowerCase();
    const moves = [];

    switch (pieceLower) {
      case "p":
        moves.push(...this.getPawnMoves(board, fromRow, fromCol));
        break;
      case "r":
        moves.push(...this.getRookMoves(board, fromRow, fromCol));
        break;
      case "n":
        moves.push(...this.getKnightMoves(board, fromRow, fromCol));
        break;
      case "b":
        moves.push(...this.getBishopMoves(board, fromRow, fromCol));
        break;
      case "q":
        moves.push(...this.getQueenMoves(board, fromRow, fromCol));
        break;
      case "k":
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
        if (
          this.isValidPosition(doubleRow, fromCol) &&
          !board[doubleRow][fromCol]
        ) {
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
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

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
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
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
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

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
      ...this.getBishopMoves(board, fromRow, fromCol),
    ];
  }

  getKingMoves(board, fromRow, fromCol) {
    const piece = board[fromRow][fromCol];
    const moves = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
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

    if (
      !this.isValidPosition(fromRow, fromCol) ||
      !this.isValidPosition(toRow, toCol)
    ) {
      return false;
    }

    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    const isWhiteMove = currentPlayer === "white";
    if (
      (isWhiteMove && this.isBlackPiece(piece)) ||
      (!isWhiteMove && this.isWhitePiece(piece))
    ) {
      return false;
    }

    const possibleMoves = this.getPossibleMoves(board, fromRow, fromCol);
    return possibleMoves.some(([row, col]) => row === toRow && col === toCol);
  }

  makeMove(board, from, to, currentPlayer) {
    if (!this.isValidMove(board, from, to, currentPlayer)) {
      return { success: false, error: "Invalid move" };
    }

    const newBoard = board.map((row) => [...row]);
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
      checkmate: false, // TODO: Implement checkmate detection
    };
  }
}

module.exports = ChessLogic;
