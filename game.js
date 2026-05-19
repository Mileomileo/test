const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game states
const gameState = {
    currentLevel: 1,
    health: 3,
    score: 0,
    gameOver: false,
    won: false
};

// Player object
const player = {
    x: 50,
    y: 400,
    width: 30,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 15,
    gravity: 0.6,
    isJumping: false,
    isOnGround: false,
    isClimbing: false,
    canDash: true,
    isDashing: false,
    dashSpeed: 20,
    dashDuration: 10,
    dashCounter: 0,
    dashDirection: 1
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        if (player.isOnGround && !player.isClimbing) {
            player.isJumping = true;
            player.velocityY = -player.jumpPower;
            player.isOnGround = false;
        }
    }

    if (e.key === 'Shift') {
        e.preventDefault();
        if (player.canDash && !player.isDashing && !player.isClimbing) {
            player.isDashing = true;
            player.dashCounter = player.dashDuration;
            player.canDash = false;
            player.dashDirection = keys['ArrowRight'] || keys['d'] || keys['D'] ? 1 : -1;
        }
    }

    if (e.key.toLowerCase() === 'r') {
        restartLevel();
    }

    if (e.key.toLowerCase() === 'n') {
        nextLevel();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Level data
const levels = [
    {
        // Level 1: Basic platforming
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 }, // Ground
            { x: 150, y: 480, width: 150, height: 20 },
            { x: 450, y: 420, width: 150, height: 20 },
            { x: 150, y: 350, width: 500, height: 20 },
            { x: 600, y: 280, width: 150, height: 20 },
            { x: 250, y: 200, width: 300, height: 20 },
        ],
        enemies: [
            { x: 200, y: 450, width: 30, height: 30, speed: 2, minX: 100, maxX: 350, type: 'patrol' },
            { x: 500, y: 390, width: 30, height: 30, speed: 2, minX: 400, maxX: 650, type: 'patrol' },
        ],
        vines: [],
        spikes: [],
        goal: { x: 700, y: 220, width: 50, height: 50 },
        collectibles: [
            { x: 300, y: 320, width: 15, height: 15 },
            { x: 550, y: 250, width: 15, height: 15 },
        ]
    },
    {
        // Level 2: Climbing challenge
        platforms: [
            { x: 0, y: 550, width: 300, height: 50 }, // Ground left
            { x: 500, y: 550, width: 300, height: 50 }, // Ground right
            { x: 100, y: 450, width: 100, height: 20 },
            { x: 600, y: 450, width: 100, height: 20 },
        ],
        enemies: [
            { x: 150, y: 420, width: 30, height: 30, speed: 3, chaseRange: 150, type: 'chase' },
            { x: 650, y: 420, width: 30, height: 30, speed: 3, chaseRange: 150, type: 'chase' },
        ],
        vines: [
            { x: 350, y: 200, width: 40, height: 400 },
            { x: 150, y: 300, width: 40, height: 250 },
        ],
        spikes: [
            { x: 300, y: 520, width: 200, height: 30 },
        ],
        goal: { x: 350, y: 100, width: 50, height: 50 },
        collectibles: [
            { x: 360, y: 350, width: 15, height: 15 },
            { x: 360, y: 250, width: 15, height: 15 },
        ]
    },
    {
        // Level 3: Dash challenge
        platforms: [
            { x: 0, y: 550, width: 150, height: 50 },
            { x: 250, y: 500, width: 100, height: 20 },
            { x: 450, y: 450, width: 100, height: 20 },
            { x: 650, y: 400, width: 150, height: 20 },
            { x: 200, y: 350, width: 100, height: 20 },
            { x: 550, y: 300, width: 100, height: 20 },
            { x: 300, y: 250, width: 100, height: 20 },
        ],
        enemies: [
            { x: 300, y: 520, width: 30, height: 30, speed: 4, minX: 200, maxX: 400, type: 'patrol' },
            { x: 600, y: 370, width: 30, height: 30, speed: 3, minX: 500, maxX: 750, type: 'patrol' },
        ],
        vines: [],
        spikes: [
            { x: 150, y: 500, width: 100, height: 30 },
            { x: 400, y: 470, width: 50, height: 30 },
            { x: 700, y: 420, width: 80, height: 30 },
        ],
        goal: { x: 700, y: 150, width: 50, height: 50 },
        collectibles: [
            { x: 500, y: 270, width: 15, height: 15 },
            { x: 350, y: 220, width: 15, height: 15 },
            { x: 250, y: 320, width: 15, height: 15 },
        ]
    }
];

let currentLevelData = levels[0];

// Update UI
function updateUI() {
    document.getElementById('screen').textContent = gameState.currentLevel;
    document.getElementById('health').textContent = '❤️'.repeat(gameState.health);
    document.getElementById('dashReady').textContent = player.canDash ? '✓ Ready' : '✗ Recharging';
    document.getElementById('climbing').textContent = player.isClimbing ? 'Climbing' : 'Normal';
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update player
function updatePlayer() {
    if (player.isDashing) {
        player.dashCounter--;
        player.velocityX = player.dashSpeed * player.dashDirection;
        if (player.dashCounter <= 0) {
            player.isDashing = false;
        }
    } else {
        // Normal movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            player.velocityX = -player.speed;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            player.velocityX = player.speed;
        } else {
            player.velocityX *= 0.8; // Friction
        }
    }

    // Climbing logic
    player.isClimbing = false;
    for (let vine of currentLevelData.vines) {
        if (checkCollision(player, vine)) {
            player.isClimbing = true;
            player.velocityY = 0;
            player.isOnGround = false;

            if (keys['ArrowUp'] || keys['w'] || keys['W']) {
                player.velocityY = -player.speed;
            } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
                player.velocityY = player.speed;
            } else {
                player.velocityY = 0;
            }
            break;
        }
    }

    // Apply gravity
    if (!player.isClimbing) {
        player.velocityY += player.gravity;
    }

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Platform collision
    player.isOnGround = false;
    for (let platform of currentLevelData.platforms) {
        if (checkCollision(player, platform)) {
            if (player.velocityY >= 0 && player.y + player.height - player.velocityY <= platform.y + 10) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isOnGround = true;
                player.canDash = true;
            }
        }
    }

    // Spike collision
    for (let spike of currentLevelData.spikes) {
        if (checkCollision(player, spike)) {
            gameState.health--;
            player.x = 50;
            player.y = 400;
            player.velocityY = 0;
            player.canDash = true;
            if (gameState.health <= 0) {
                gameState.gameOver = true;
            }
        }
    }

    // Enemy collision
    for (let enemy of currentLevelData.enemies) {
        if (checkCollision(player, enemy)) {
            gameState.health--;
            player.x = 50;
            player.y = 400;
            player.velocityY = 0;
            player.canDash = true;
            if (gameState.health <= 0) {
                gameState.gameOver = true;
            }
        }
    }

    // Collectible collision
    for (let i = currentLevelData.collectibles.length - 1; i >= 0; i--) {
        if (checkCollision(player, currentLevelData.collectibles[i])) {
            gameState.score += 10;
            currentLevelData.collectibles.splice(i, 1);
        }
    }

    // Goal collision
    if (checkCollision(player, currentLevelData.goal)) {
        gameState.won = true;
    }

    // Fall off screen
    if (player.y > canvas.height) {
        gameState.health--;
        player.x = 50;
        player.y = 400;
        player.velocityY = 0;
        player.canDash = true;
        if (gameState.health <= 0) {
            gameState.gameOver = true;
        }
    }
}

// Update enemies
function updateEnemies() {
    for (let enemy of currentLevelData.enemies) {
        if (enemy.type === 'patrol') {
            enemy.x += enemy.speed;
            if (enemy.x < enemy.minX || enemy.x + enemy.width > enemy.maxX) {
                enemy.speed *= -1;
            }
        } else if (enemy.type === 'chase') {
            let distToPlayer = Math.abs(player.x - enemy.x);
            if (distToPlayer < enemy.chaseRange) {
                enemy.speed = Math.abs(enemy.speed);
                if (player.x < enemy.x) {
                    enemy.speed *= -1;
                }
                enemy.x += enemy.speed;
            }
        }
    }
}

// Draw functions
function drawPlayer() {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 8, player.y + 10, 6, 6);
    ctx.fillRect(player.x + 16, player.y + 10, 6, 6);

    // Mouth
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 22, 4, 0, Math.PI);
    ctx.stroke();

    // Dash effect
    if (player.isDashing) {
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x - 5, player.y + player.height / 2);
        ctx.lineTo(player.x - 20, player.y + player.height / 2);
        ctx.stroke();
    }
}

function drawPlatforms() {
    ctx.fillStyle = '#8B4513';
    for (let platform of currentLevelData.platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        // Platform outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }
}

function drawVines() {
    for (let vine of currentLevelData.vines) {
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(vine.x + vine.width / 2, vine.y);
        for (let i = 0; i < vine.height; i += 15) {
            ctx.lineTo(vine.x + vine.width / 2 + Math.sin(i / 20) * 5, vine.y + i);
        }
        ctx.stroke();
    }
}

function drawSpikes() {
    for (let spike of currentLevelData.spikes) {
        ctx.fillStyle = '#FF0000';
        for (let i = spike.x; i < spike.x + spike.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, spike.y + spike.height);
            ctx.lineTo(i + 5, spike.y);
            ctx.lineTo(i + 10, spike.y + spike.height);
            ctx.fill();
        }
    }
}

function drawEnemies() {
    for (let enemy of currentLevelData.enemies) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Angry eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 5, 5);
        ctx.fillRect(enemy.x + 20, enemy.y + 8, 5, 5);

        // Chase indicator
        if (enemy.type === 'chase') {
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
        }
    }
}

function drawCollectibles() {
    for (let item of currentLevelData.collectibles) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawGoal() {
    const goal = currentLevelData.goal;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', goal.x + goal.width / 2, goal.y + goal.height / 2 + 7);
}

// Game functions
function restartLevel() {
    player.x = 50;
    player.y = 400;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isOnGround = false;
    player.isClimbing = false;
    player.canDash = true;
    player.isDashing = false;
    gameState.health = 3; // FIXED: Reset health to 3
    gameState.gameOver = false;
    gameState.won = false;
    currentLevelData = JSON.parse(JSON.stringify(levels[gameState.currentLevel - 1]));
}

function nextLevel() {
    if (gameState.currentLevel < 3) {
        gameState.currentLevel++;
        currentLevelData = JSON.parse(JSON.stringify(levels[gameState.currentLevel - 1]));
        player.x = 50;
        player.y = 400;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isOnGround = false;
        player.isClimbing = false;
        player.canDash = true;
        player.isDashing = false;
        gameState.health = 3; // Reset health for new level
        gameState.gameOver = false;
        gameState.won = false;
    } else {
        alert('You beat the game! Congratulations!');
        gameState.currentLevel = 1;
        gameState.health = 3;
        restartLevel();
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState.gameOver && !gameState.won) {
        updatePlayer();
        updateEnemies();
    }

    // Draw game
    drawPlatforms();
    drawVines();
    drawSpikes();
    drawEnemies();
    drawCollectibles();
    drawGoal();
    drawPlayer();

    // Draw UI overlays
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }

    if (gameState.won) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        if (gameState.currentLevel < 3) {
            ctx.fillText('Press N for Next Level', canvas.width / 2, canvas.height / 2 + 30);
        } else {
            ctx.fillText('You beat the game!', canvas.width / 2, canvas.height / 2 + 30);
        }
    }

    updateUI();
    requestAnimationFrame(gameLoop);
}

// Start game
restartLevel();
gameLoop();
