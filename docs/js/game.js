// ====== BASIC CAR GAME WITH SCORE & SPEED UP ======
// This expects <canvas id="gameCanvas"> in car-game.html

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Road settings
const roadMargin = 80; // empty space on left/right
const roadWidth = canvas.width - roadMargin * 2;

// Player (car) settings
const player = {
  width: 40,
  height: 70,
  x: canvas.width / 2 - 20,
  y: canvas.height - 110,
  color: "#38bdf8",
};

let targetX = player.x;
let isGameOver = false;
let gameOverMessage = "";

let obstacles = [];
let lastSpawnTime = 0;
const spawnInterval = 1000; // ms between spawns
let gameSpeed = 4;

// Score
let score = 0;

// ====== INPUT: MOUSE MOVE TO STEER ======
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  targetX = e.clientX - rect.left - player.width / 2;
});

// Crash if mouse leaves the game area
canvas.addEventListener("mouseleave", () => {
  if (!isGameOver) {
    endGame("You left the road!");
  }
});

// ====== OBSTACLES ======
function spawnObstacle() {
  // Randomly pick type: 'log' or 'pothole'
  const type = Math.random() < 0.5 ? "log" : "pothole";

  // Different sizes for different types
  let width, height;
  if (type === "log") {
    width = 70 + Math.random() * 60; // wider logs
    height = 24;
  } else {
    width = 50;
    height = 30;
  }

  const laneXMin = roadMargin;
  const laneXMax = roadMargin + roadWidth - width;
  const x = laneXMin + Math.random() * (laneXMax - laneXMin);

  obstacles.push({
    x,
    y: -100,
    width,
    height,
    type,
    hasScored: false, // track if this obstacle already gave a point
  });
}

function updateObstacles() {
  for (const o of obstacles) {
    o.y += gameSpeed;

    // If obstacle goes off the screen bottom and hasn't scored yet,
    // that means the player successfully passed it.
    if (!o.hasScored && o.y > canvas.height) {
      o.hasScored = true;
      score += 1;
      gameSpeed += 0.2; // increase speed slightly each obstacle passed
    }
  }

  // Remove off-screen obstacles
  obstacles = obstacles.filter((o) => o.y < canvas.height + 80);
}

// AABB collision
function isColliding(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

// ====== GAME LOOP ======
let lastTimestamp = 0;

function gameLoop(timestamp) {
  if (isGameOver) {
    drawScene();
    drawGameOver();
    return;
  }

  const dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // 1. Move player toward targetX (smooth follow)
  const moveSpeed = 0.2; // 0–1 (higher = snappier)
  player.x += (targetX - player.x) * moveSpeed;

  // 2. Border collision with road edges
  const leftLimit = roadMargin;
  const rightLimit = roadMargin + roadWidth - player.width;

  if (player.x < leftLimit || player.x > rightLimit) {
    endGame("You hit the barrier!");
  }

  // Clamp for drawing
  player.x = Math.max(leftLimit, Math.min(player.x, rightLimit));

  // 3. Spawn obstacles over time
  if (timestamp - lastSpawnTime > spawnInterval) {
    spawnObstacle();
    lastSpawnTime = timestamp;
  }

  // 4. Update obstacles (movement + scoring + speed increase)
  updateObstacles();

  // 5. Check collisions between player and obstacles
  for (const o of obstacles) {
    if (isColliding(player, o)) {
      endGame("You hit an obstacle!");
      break;
    }
  }

  // 6. Draw everything
  drawScene();

  // 7. Next frame
  requestAnimationFrame(gameLoop);
}

// ====== DRAWING ======
function drawScene() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Road
  ctx.fillStyle = "#111827";
  ctx.fillRect(roadMargin, 0, roadWidth, canvas.height);

  // Road side lines
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(roadMargin - 4, 0, 4, canvas.height);
  ctx.fillRect(roadMargin + roadWidth, 0, 4, canvas.height);

  // Center dashed line
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Obstacles
  for (const o of obstacles) {
    if (o.type === "log") {
      // Draw log-like rounded rectangle
      drawLog(o);
    } else {
      // Draw pothole as a dark oval
      drawPothole(o);
    }
  }

  // Player car
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Simple “hood” stripe
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(player.x + 6, player.y + 10, player.width - 12, 6);

  // HUD: score and speed
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 16, 28);
  ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 16, 50);
}

function drawLog(o) {
  // Rounded rectangle-ish log
  const radius = 10;

  ctx.fillStyle = "#b45309"; // brown log color
  ctx.beginPath();
  ctx.moveTo(o.x + radius, o.y);
  ctx.lineTo(o.x + o.width - radius, o.y);
  ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + radius);
  ctx.lineTo(o.x + o.width, o.y + o.height - radius);
  ctx.quadraticCurveTo(
    o.x + o.width,
    o.y + o.height,
    o.x + o.width - radius,
    o.y + o.height
  );
  ctx.lineTo(o.x + radius, o.y + o.height);
  ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - radius);
  ctx.lineTo(o.x, o.y + radius);
  ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
  ctx.closePath();
  ctx.fill();

  // Add a couple of darker “rings” / stripes
  ctx.strokeStyle = "rgba(30, 64, 175, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x + o.width * 0.3, o.y + 4);
  ctx.lineTo(o.x + o.width * 0.3, o.y + o.height - 4);
  ctx.moveTo(o.x + o.width * 0.6, o.y + 6);
  ctx.lineTo(o.x + o.width * 0.6, o.y + o.height - 6);
  ctx.stroke();
}

function drawPothole(o) {
  const centerX = o.x + o.width / 2;
  const centerY = o.y + o.height / 2;
  const radiusX = o.width / 2;
  const radiusY = o.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(radiusX, radiusY);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.restore();

  ctx.fillStyle = "#020617"; // very dark
  ctx.fill();

  // Slight lighter ring
  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * 0.9, radiusY * 0.8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGameOver() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f9fafb";
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "18px system-ui, -apple-system, sans-serif";
  ctx.fillText(gameOverMessage, canvas.width / 2, canvas.height / 2 + 15);
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 45
  );
  ctx.fillText(
    "Refresh the page to play again.",
    canvas.width / 2,
    canvas.height / 2 + 70
  );
}

// ====== GAME OVER HELPER ======
function endGame(message) {
  isGameOver = true;
  gameOverMessage = message;
  console.log("GAME OVER:", message);
}

// Start the game loop
requestAnimationFrame(gameLoop);
