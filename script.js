const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const restartBtn = document.getElementById("restart");

const COLS = 10;
const ROWS = 20;
const BLOCK = 32;

let board;
let piece;
let nextPiece;
let score = 0;
let lines = 0;
let level = 1;
let gameOver = false;
let dropTimer = 0;
let dropSpeed = 700;
let lastTime = 0;

const colors = [
  "#ff4040",
  "#ffcc33",
  "#35e06f",
  "#35a7ff",
  "#b45cff",
  "#ff8c42"
];

const shapes = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];

function startGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  piece = createPiece();
  nextPiece = createPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropSpeed = 700;
  gameOver = false;
  updatePanel();
}

function createPiece() {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    matrix: shape.map(row => [...row]),
    x: 3,
    y: 0,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.strokeRect(x * BLOCK + 3, y * BLOCK + 3, BLOCK - 6, BLOCK - 6);

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x * BLOCK + 5, y * BLOCK + 5, BLOCK - 10, 5);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#080812";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);

      if (board[y][x]) {
        drawBlock(x, y, board[y][x]);
      }
    }
  }

  drawPiece(piece);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff3d68";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, 290);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Clique em reiniciar", canvas.width / 2, 325);
  }
}

function drawPiece(p) {
  p.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawBlock(p.x + x, p.y + y, p.color);
      }
    });
  });
}

function collide() {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (piece.matrix[y][x]) {
        const newX = piece.x + x;
        const newY = piece.y + y;

        if (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          board[newY]?.[newX]
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function mergePiece() {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[piece.y + y][piece.x + x] = piece.color;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }

  if (cleared > 0) {
    lines += cleared;
    score += cleared * 100 * level;

    if (cleared >= 2) score += 150;
    if (cleared >= 4) score += 500;

    level = Math.floor(lines / 5) + 1;
    dropSpeed = Math.max(120, 700 - level * 60);

    updatePanel();
  }
}

function drop() {
  piece.y++;

  if (collide()) {
    piece.y--;
    mergePiece();
    clearLines();

    piece = nextPiece;
    nextPiece = createPiece();

    if (collide()) {
      gameOver = true;
    }
  }

  dropTimer = 0;
}

function move(dir) {
  piece.x += dir;

  if (collide()) {
    piece.x -= dir;
  }
}

function rotate() {
  const old = piece.matrix;
  piece.matrix = old[0].map((_, i) => old.map(row => row[i]).reverse());

  if (collide()) {
    piece.matrix = old;
  }
}

function hardDrop() {
  while (!collide()) {
    piece.y++;
    score += 2;
  }

  piece.y--;
  drop();
  updatePanel();
}

function updatePanel() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    dropTimer += delta;

    if (dropTimer > dropSpeed) {
      drop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", function(e) {
  if (gameOver) return;

  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowDown") drop();
  if (e.key === "ArrowUp") rotate();
  if (e.code === "Space") hardDrop();
});

restartBtn.addEventListener("click", startGame);

startGame();
update();