export const PIECE_SYMBOLS = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

export function getPieceSymbol(piece) {
  return PIECE_SYMBOLS[piece] || "";
}

export function isLightSquare(row, col) {
  return (row + col) % 2 === 0;
}

export function formatMove(from, to) {
  const files = "abcdefgh";
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
