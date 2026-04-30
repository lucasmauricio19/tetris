const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const restartBtn = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;

const COLS = 10;
const ROWS = 20;
const BLOCK = 32;
const GRAIN = 4;

let sand;
let piece;
let effects = [];
let score = 0;
let level = 1;
let gameOver = false;
let keys = {};
let lastTime = 0;

const colors = [
  "#ffd166",
  "#f4a261",
  "#e76f51",
  "#ffdd57",
  "#f7b267",
  "#ff9f1c"
];

const shapes = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]]
];

function startGame() {
  sand = Array.from({ length: H / GRAIN }, () => Array(W / GRAIN).fill(null));
  piece = createPiece();
  effects = [];
  score = 0;
  level = 1;
  gameOver = false;
  updatePanel();
}

function createPiece() {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    matrix: shape.map(r => [...r]),
    x: 3 * BLOCK,
    y: -20,
    vy: 1.4 + level * 0.15,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

function drawBackground() {
  ctx.fillStyle = "#080812";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
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
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (!v) return;

      const px = piece.x + x * BLOCK;
      const py = piece.y + y * BLOCK;

      for (let gy = 0; gy < BLOCK; gy += GRAIN) {
        for (let gx = 0; gx < BLOCK; gx += GRAIN) {
          ctx.fillStyle = randomShade(piece.color);
          ctx.fillRect(px + gx, py + gy, GRAIN, GRAIN);
        }
      }
    });
  });
}

function randomShade(color) {
  return color;
}

function pieceCells() {
  const cells = [];

  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) {
        cells.push({
          x: piece.x + x * BLOCK,
          y: piece.y + y * BLOCK
        });
      }
    });
  });

  return cells;
}

function collides() {
  return pieceCells().some(c => {
    if (c.x < 0 || c.x + BLOCK > W || c.y + BLOCK >= H) return true;

    const left = Math.floor(c.x / GRAIN);
    const right = Math.floor((c.x + BLOCK - 1) / GRAIN);
    const bottom = Math.floor((c.y + BLOCK) / GRAIN);

    for (let x = left; x <= right; x++) {
      if (sand[bottom]?.[x]) return true;
    }

    return false;
  });
}

function convertPieceToSand() {
  pieceCells().forEach(c => {
    for (let y = 0; y < BLOCK; y += GRAIN) {
      for (let x = 0; x < BLOCK; x += GRAIN) {
        const sx = Math.floor((c.x + x) / GRAIN);
        const sy = Math.floor((c.y + y) / GRAIN);

        if (sy >= 0 && sy < sand.length && sx >= 0 && sx < sand[0].length) {
          sand[sy][sx] = piece.color;
        }
      }
    }
  });

  score += 10;
  level = Math.floor(score / 200) + 1;
  updatePanel();
  piece = createPiece();

  if (collides()) gameOver = true;
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

        if (sand[y + 1]?.[x + dir] === null) {
          sand[y + 1][x + dir] = color;
          sand[y][x] = null;
        } else if (sand[y + 1]?.[x - dir] === null) {
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
    borderParticles(0);
  }

  if (piece.x + piece.matrix[0].length * BLOCK > W) {
    piece.x = W - piece.matrix[0].length * BLOCK;
    borderParticles(W);
  }

  if (collides()) {
    piece.x -= dx;
  }
}

function rotatePiece() {
  const old = piece.matrix;
  piece.matrix = old[0].map((_, i) => old.map(row => row[i]).reverse());

  if (piece.x + piece.matrix[0].length * BLOCK > W) {
    piece.x = W - piece.matrix[0].length * BLOCK;
    borderParticles(W);
  }

  if (piece.x < 0) {
    piece.x = 0;
    borderParticles(0);
  }

  if (collides()) {
    piece.matrix = old;
  }
}

function hardDrop() {
  while (!collides()) {
    piece.y += 4;
  }

  piece.y -= 4;
  convertPieceToSand();
}

function borderParticles(side) {
  for (let i = 0; i < 18; i++) {
    effects.push({
      x: side === 0 ? 4 : W - 4,
      y: piece.y + Math.random() * 120,
      vx: side === 0 ? Math.random() * 3 : -Math.random() * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 35,
      color: piece.color
    });
  }
}

function updateEffects() {
  effects.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  effects = effects.filter(p => p.life > 0);
}

function drawEffects() {
  effects.forEach(p => {
    ctx.globalAlpha = p.life / 35;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function updatePanel() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    if (keys["ArrowLeft"]) movePiece(-3);
    if (keys["ArrowRight"]) movePiece(3);

    piece.y += piece.vy + (keys["ArrowDown"] ? 4 : 0);

    if (collides()) {
      piece.y -= piece.vy + (keys["ArrowDown"] ? 4 : 0);
      convertPieceToSand();
    }

    updateSand();
    updateSand();
    updateEffects();
  }

  drawBackground();
  drawSand();
  if (!gameOver) drawPiece();
  drawEffects();

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ff6b3d";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", W / 2, H / 2);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Clique em Reiniciar", W / 2, H / 2 + 35);
  }

  requestAnimationFrame(update);
}

document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (gameOver) return;

  if (e.key === "ArrowUp") rotatePiece();
  if (e.code === "Space") hardDrop();
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

restartBtn.addEventListener("click", startGame);

startGame();
update();