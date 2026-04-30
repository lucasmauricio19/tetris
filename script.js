const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const restartBtn = document.getElementById("restartBtn");

const W = canvas.width;
const H = canvas.height;

const GRAIN = 4;
const BLOCK = 32;

let sand;
let piece;
let particles;
let score;
let level;
let gameOver;
let keys;

const colors = ["#ffd166", "#f4a261", "#e76f51", "#ffdd57", "#f77f00"];

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
  sand = Array.from({ length: H / GRAIN }, () => Array(W / GRAIN).fill(null));
  particles = [];
  score = 0;
  level = 1;
  gameOver = false;
  keys = {};
  piece = createPiece();
  updatePanel();
}

function createPiece() {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    matrix: shape.map(row => [...row]),
    x: 128,
    y: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 1.3 + level * 0.12
  };
}

function getBlocks() {
  const blocks = [];

  piece.matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        blocks.push({
          x: piece.x + colIndex * BLOCK,
          y: piece.y + rowIndex * BLOCK
        });
      }
    });
  });

  return blocks;
}

function touchingGround() {
  const blocks = getBlocks();

  for (const block of blocks) {
    if (block.y + BLOCK >= H) return true;

    const bottom = Math.floor((block.y + BLOCK) / GRAIN);
    const left = Math.floor(block.x / GRAIN);
    const right = Math.floor((block.x + BLOCK - 1) / GRAIN);

    for (let x = left; x <= right; x++) {
      if (sand[bottom] && sand[bottom][x]) return true;
    }
  }

  return false;
}

function pieceToSand() {
  const blocks = getBlocks();

  for (const block of blocks) {
    for (let y = 0; y < BLOCK; y += GRAIN) {
      for (let x = 0; x < BLOCK; x += GRAIN) {
        const sx = Math.floor((block.x + x) / GRAIN);
        const sy = Math.floor((block.y + y) / GRAIN);

        if (sy >= 0 && sy < sand.length && sx >= 0 && sx < sand[0].length) {
          sand[sy][sx] = piece.color;
        }
      }
    }
  }

  score += 10;
  level = Math.floor(score / 200) + 1;
  updatePanel();

  piece = createPiece();

  if (touchingGround()) {
    gameOver = true;
  }
}

function updateSand() {
  for (let y = sand.length - 2; y >= 0; y--) {
    for (let x = 0; x < sand[y].length; x++) {
      if (!sand[y][x]) continue;

      const color = sand[y][x];

      if (!sand[y + 1][x]) {
        sand[y + 1][x] = color;
        sand[y][x] = null;
      } else {
        const dir = Math.random() < 0.5 ? -1 : 1;

        if (x + dir >= 0 && x + dir < sand[y].length && !sand[y + 1][x + dir]) {
          sand[y + 1][x + dir] = color;
          sand[y][x] = null;
        } else if (x - dir >= 0 && x - dir < sand[y].length && !sand[y + 1][x - dir]) {
          sand[y + 1][x - dir] = color;
          sand[y][x] = null;
        }
      }
    }
  }
}

function movePiece(dx) {
  piece.x += dx;

  if (piece.x < 0) {
    piece.x = 0;
    makeBorderParticles(0);
  }

  const width = piece.matrix[0].length * BLOCK;

  if (piece.x + width > W) {
    piece.x = W - width;
    makeBorderParticles(W);
  }
}

function rotatePiece() {
  const oldMatrix = piece.matrix;
  piece.matrix = oldMatrix[0].map((_, i) => oldMatrix.map(row => row[i]).reverse());

  const width = piece.matrix[0].length * BLOCK;

  if (piece.x + width > W) piece.x = W - width;
  if (piece.x < 0) piece.x = 0;
}

function hardDrop() {
  while (!touchingGround()) {
    piece.y += 4;
  }

  piece.y -= 4;
  pieceToSand();
}

function makeBorderParticles(side) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x: side === 0 ? 4 : W - 4,
      y: piece.y + Math.random() * 120,
      vx: side === 0 ? Math.random() * 3 : -Math.random() * 3,
      vy: Math.random() * 2 - 1,
      life: 25,
      color: piece.color
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }

  particles = particles.filter(p => p.life > 0);
}

function drawBackground() {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x < W; x += BLOCK) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}

function drawSand() {
  for (let y = 0; y < sand.length; y++) {
    for (let x = 0; x < sand[y].length; x++) {
      if (sand[y][x]) {
        ctx.fillStyle = sand[y][x];
        ctx.fillRect(x * GRAIN, y * GRAIN, GRAIN, GRAIN);
      }
    }
  }
}

function drawPiece() {
  ctx.fillStyle = piece.color;

  for (const block of getBlocks()) {
    for (let y = 0; y < BLOCK; y += GRAIN) {
      for (let x = 0; x < BLOCK; x += GRAIN) {
        ctx.fillRect(block.x + x, block.y + y, GRAIN, GRAIN);
      }
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / 25;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ff3b70";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", W / 2, H / 2);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Clique em Reiniciar", W / 2, H / 2 + 35);
}

function updatePanel() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function loop() {
  if (!gameOver) {
    if (keys["ArrowLeft"]) movePiece(-3);
    if (keys["ArrowRight"]) movePiece(3);

    const fallSpeed = keys["ArrowDown"] ? 5 : piece.speed;
    piece.y += fallSpeed;

    if (touchingGround()) {
      piece.y -= fallSpeed;
      pieceToSand();
    }

    updateSand();
    updateSand();
    updateParticles();
  }

  drawBackground();
  drawSand();

  if (!gameOver) {
    drawPiece();
  }

  drawParticles();

  if (gameOver) {
    drawGameOver();
  }

  requestAnimationFrame(loop);
}

document.addEventListener("keydown", function(event) {
  if (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.code === "Space"
  ) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (!gameOver && event.key === "ArrowUp") {
    rotatePiece();
  }

  if (!gameOver && event.code === "Space") {
    hardDrop();
  }
});

document.addEventListener("keyup", function(event) {
  keys[event.key] = false;
});

restartBtn.addEventListener("click", startGame);

startGame();
loop();