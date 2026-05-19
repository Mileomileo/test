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
    gravity: 0.4, // Reduced from 0.6
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

    if (e.key.toLowerCase() === 'n' && gameState.currentLevel < 10) {
        nextLevel();
    }

    if (e.key.toLowerCase() === 'p' && gameState.currentLevel > 1) {
        prevLevel();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Level data - 10 Rooms
const levels = [
    {
        // Level 1: Basic platforming
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 100, y: 480, width: 120, height: 20 },
            { x: 300, y: 420, width: 120, height: 20 },
            { x: 500, y: 350, width: 150, height: 20 },
            { x: 250, y: 280, width: 120, height: 20 },
            { x: 600, y: 200, width: 150, height: 20 },
        ],
        obstacles: [
            { x: 250, y: 460, width: 40, height: 40, type: 'box' },
            { x: 450, y: 390, width: 60, height: 20, type: 'platform' },
        ],
        vines: [],
        spikes: [
            { x: 200, y: 500, width: 80, height: 30 },
            { x: 400, y: 440, width: 60, height: 30 },
        ],
        goal: { x: 650, y: 150, width: 50, height: 50 },
        collectibles: [
            { x: 150, y: 450, width: 15, height: 15 },
            { x: 350, y: 390, width: 15, height: 15 },
            { x: 550, y: 320, width: 15, height: 15 },
        ]
    },
    {
        // Level 2: Obstacle course
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 80, y: 480, width: 100, height: 20 },
            { x: 280, y: 420, width: 100, height: 20 },
            { x: 480, y: 380, width: 100, height: 20 },
            { x: 180, y: 320, width: 100, height: 20 },
            { x: 580, y: 260, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 200, y: 450, width: 50, height: 50, type: 'box' },
            { x: 350, y: 390, width: 40, height: 60, type: 'tall' },
            { x: 550, y: 340, width: 60, height: 40, type: 'wide' },
            { x: 300, y: 290, width: 35, height: 35, type: 'small' },
        ],
        vines: [],
        spikes: [
            { x: 150, y: 510, width: 100, height: 30 },
            { x: 350, y: 450, width: 80, height: 30 },
            { x: 550, y: 400, width: 100, height: 30 },
        ],
        goal: { x: 650, y: 180, width: 50, height: 50 },
        collectibles: [
            { x: 130, y: 450, width: 15, height: 15 },
            { x: 330, y: 390, width: 15, height: 15 },
            { x: 530, y: 330, width: 15, height: 15 },
        ]
    },
    {
        // Level 3: Climbing + obstacles
        platforms: [
            { x: 0, y: 550, width: 200, height: 50 },
            { x: 600, y: 550, width: 200, height: 50 },
            { x: 80, y: 450, width: 80, height: 20 },
            { x: 150, y: 350, width: 60, height: 20 },
        ],
        obstacles: [
            { x: 300, y: 480, width: 80, height: 40, type: 'box' },
            { x: 450, y: 400, width: 40, height: 80, type: 'tall' },
        ],
        vines: [
            { x: 350, y: 150, width: 40, height: 450 },
            { x: 100, y: 300, width: 40, height: 250 },
        ],
        spikes: [
            { x: 200, y: 520, width: 400, height: 30 },
            { x: 300, y: 360, width: 100, height: 30 },
        ],
        goal: { x: 350, y: 80, width: 50, height: 50 },
        collectibles: [
            { x: 360, y: 300, width: 15, height: 15 },
            { x: 360, y: 200, width: 15, height: 15 },
            { x: 360, y: 100, width: 15, height: 15 },
        ]
    },
    {
        // Level 4: Precision platforming
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 50, y: 480, width: 80, height: 20 },
            { x: 180, y: 440, width: 70, height: 20 },
            { x: 320, y: 400, width: 70, height: 20 },
            { x: 460, y: 360, width: 70, height: 20 },
            { x: 600, y: 300, width: 80, height: 20 },
            { x: 400, y: 240, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 150, y: 450, width: 25, height: 40, type: 'small' },
            { x: 300, y: 410, width: 20, height: 35, type: 'small' },
            { x: 450, y: 370, width: 20, height: 35, type: 'small' },
            { x: 580, y: 320, width: 30, height: 40, type: 'box' },
        ],
        vines: [],
        spikes: [
            { x: 130, y: 520, width: 60, height: 30 },
            { x: 280, y: 480, width: 50, height: 30 },
            { x: 420, y: 440, width: 50, height: 30 },
            { x: 560, y: 400, width: 50, height: 30 },
        ],
        goal: { x: 425, y: 190, width: 50, height: 50 },
        collectibles: [
            { x: 100, y: 450, width: 15, height: 15 },
            { x: 230, y: 410, width: 15, height: 15 },
            { x: 370, y: 370, width: 15, height: 15 },
            { x: 510, y: 330, width: 15, height: 15 },
        ]
    },
    {
        // Level 5: Obstacle maze
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 100, y: 480, width: 100, height: 20 },
            { x: 300, y: 420, width: 100, height: 20 },
            { x: 100, y: 350, width: 100, height: 20 },
            { x: 500, y: 350, width: 100, height: 20 },
            { x: 300, y: 280, width: 100, height: 20 },
            { x: 600, y: 200, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 220, y: 440, width: 60, height: 50, type: 'box' },
            { x: 220, y: 380, width: 60, height: 50, type: 'box' },
            { x: 420, y: 380, width: 50, height: 40, type: 'wide' },
            { x: 180, y: 320, width: 60, height: 40, type: 'box' },
            { x: 420, y: 310, width: 40, height: 50, type: 'tall' },
            { x: 520, y: 250, width: 50, height: 50, type: 'box' },
        ],
        vines: [],
        spikes: [
            { x: 180, y: 510, width: 80, height: 30 },
            { x: 380, y: 450, width: 70, height: 30 },
            { x: 220, y: 380, width: 50, height: 25 },
            { x: 580, y: 380, width: 60, height: 30 },
        ],
        goal: { x: 650, y: 150, width: 50, height: 50 },
        collectibles: [
            { x: 150, y: 450, width: 15, height: 15 },
            { x: 350, y: 390, width: 15, height: 15 },
            { x: 150, y: 320, width: 15, height: 15 },
            { x: 550, y: 320, width: 15, height: 15 },
        ]
    },
    {
        // Level 6: Climbing challenge
        platforms: [
            { x: 0, y: 550, width: 150, height: 50 },
            { x: 650, y: 550, width: 150, height: 50 },
            { x: 100, y: 450, width: 80, height: 20 },
            { x: 600, y: 400, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 250, y: 480, width: 60, height: 50, type: 'box' },
            { x: 450, y: 400, width: 50, height: 60, type: 'tall' },
        ],
        vines: [
            { x: 350, y: 150, width: 40, height: 450 },
            { x: 150, y: 300, width: 40, height: 250 },
            { x: 600, y: 250, width: 40, height: 300 },
        ],
        spikes: [
            { x: 200, y: 520, width: 300, height: 30 },
            { x: 400, y: 360, width: 150, height: 30 },
        ],
        goal: { x: 350, y: 80, width: 50, height: 50 },
        collectibles: [
            { x: 360, y: 350, width: 15, height: 15 },
            { x: 360, y: 250, width: 15, height: 15 },
            { x: 360, y: 150, width: 15, height: 15 },
        ]
    },
    {
        // Level 7: Dash challenge
        platforms: [
            { x: 0, y: 550, width: 100, height: 50 },
            { x: 200, y: 500, width: 80, height: 20 },
            { x: 380, y: 450, width: 80, height: 20 },
            { x: 560, y: 400, width: 80, height: 20 },
            { x: 200, y: 340, width: 80, height: 20 },
            { x: 500, y: 280, width: 100, height: 20 },
            { x: 300, y: 220, width: 80, height: 20 },
        ],
        obstacles: [
            { x: 160, y: 470, width: 50, height: 40, type: 'box' },
            { x: 340, y: 420, width: 50, height: 40, type: 'box' },
            { x: 520, y: 370, width: 50, height: 40, type: 'box' },
            { x: 480, y: 300, width: 40, height: 50, type: 'tall' },
            { x: 360, y: 240, width: 50, height: 35, type: 'wide' },
        ],
        vines: [],
        spikes: [
            { x: 100, y: 520, width: 100, height: 30 },
            { x: 320, y: 470, width: 60, height: 30 },
            { x: 500, y: 420, width: 60, height: 30 },
            { x: 150, y: 360, width: 100, height: 30 },
            { x: 450, y: 300, width: 80, height: 30 },
        ],
        goal: { x: 325, y: 170, width: 50, height: 50 },
        collectibles: [
            { x: 225, y: 470, width: 15, height: 15 },
            { x: 405, y: 420, width: 15, height: 15 },
            { x: 585, y: 370, width: 15, height: 15 },
        ]
    },
    {
        // Level 8: Complex platforming
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 80, y: 480, width: 100, height: 20 },
            { x: 250, y: 420, width: 100, height: 20 },
            { x: 420, y: 370, width: 100, height: 20 },
            { x: 150, y: 310, width: 80, height: 20 },
            { x: 500, y: 310, width: 80, height: 20 },
            { x: 300, y: 240, width: 100, height: 20 },
            { x: 600, y: 180, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 200, y: 440, width: 40, height: 50, type: 'tall' },
            { x: 370, y: 380, width: 50, height: 40, type: 'box' },
            { x: 100, y: 280, width: 50, height: 40, type: 'box' },
            { x: 550, y: 280, width: 50, height: 40, type: 'box' },
            { x: 400, y: 210, width: 40, height: 50, type: 'tall' },
        ],
        vines: [
            { x: 150, y: 250, width: 40, height: 300 },
        ],
        spikes: [
            { x: 180, y: 510, width: 80, height: 30 },
            { x: 350, y: 450, width: 80, height: 30 },
            { x: 520, y: 400, width: 80, height: 30 },
            { x: 250, y: 350, width: 100, height: 25 },
        ],
        goal: { x: 650, y: 130, width: 50, height: 50 },
        collectibles: [
            { x: 130, y: 450, width: 15, height: 15 },
            { x: 300, y: 390, width: 15, height: 15 },
            { x: 470, y: 340, width: 15, height: 15 },
            { x: 350, y: 210, width: 15, height: 15 },
        ]
    },
    {
        // Level 9: Mixed mechanics
        platforms: [
            { x: 0, y: 550, width: 150, height: 50 },
            { x: 250, y: 500, width: 100, height: 20 },
            { x: 450, y: 450, width: 100, height: 20 },
            { x: 200, y: 380, width: 80, height: 20 },
            { x: 550, y: 380, width: 100, height: 20 },
            { x: 350, y: 300, width: 100, height: 20 },
            { x: 650, y: 550, width: 150, height: 50 },
        ],
        obstacles: [
            { x: 200, y: 470, width: 50, height: 40, type: 'box' },
            { x: 400, y: 420, width: 50, height: 40, type: 'box' },
            { x: 300, y: 350, width: 50, height: 40, type: 'box' },
            { x: 550, y: 350, width: 40, height: 50, type: 'tall' },
        ],
        vines: [
            { x: 500, y: 200, width: 40, height: 350 },
        ],
        spikes: [
            { x: 150, y: 520, width: 100, height: 30 },
            { x: 350, y: 480, width: 80, height: 30 },
            { x: 200, y: 400, width: 50, height: 30 },
            { x: 450, y: 400, width: 50, height: 30 },
        ],
        goal: { x: 675, y: 450, width: 50, height: 50 },
        collectibles: [
            { x: 300, y: 470, width: 15, height: 15 },
            { x: 500, y: 420, width: 15, height: 15 },
            { x: 400, y: 350, width: 15, height: 15 },
        ]
    },
    {
        // Level 10: Final challenge
        platforms: [
            { x: 0, y: 550, width: 100, height: 50 },
            { x: 180, y: 500, width: 80, height: 20 },
            { x: 340, y: 450, width: 80, height: 20 },
            { x: 500, y: 400, width: 80, height: 20 },
            { x: 150, y: 340, width: 80, height: 20 },
            { x: 450, y: 340, width: 80, height: 20 },
            { x: 300, y: 280, width: 80, height: 20 },
            { x: 600, y: 220, width: 100, height: 20 },
        ],
        obstacles: [
            { x: 140, y: 470, width: 45, height: 40, type: 'box' },
            { x: 300, y: 420, width: 45, height: 40, type: 'box' },
            { x: 460, y: 370, width: 45, height: 40, type: 'box' },
            { x: 230, y: 310, width: 40, height: 50, type: 'tall' },
            { x: 510, y: 310, width: 40, height: 50, type: 'tall' },
            { x: 350, y: 250, width: 45, height: 40, type: 'box' },
        ],
        vines: [
            { x: 100, y: 300, width: 40, height: 250 },
            { x: 600, y: 150, width: 40, height: 300 },
        ],
        spikes: [
            { x: 100, y: 520, width: 80, height: 30 },
            { x: 280, y: 480, width: 60, height: 30 },
            { x: 440, y: 430, width: 60, height: 30 },
            { x: 620, y: 380, width: 80, height: 30 },
            { x: 200, y: 360, width: 70, height: 25 },
            { x: 480, y: 360, width: 70, height: 25 },
        ],
        goal: { x: 650, y: 170, width: 50, height: 50 },
        collectibles: [
            { x: 220, y: 470, width: 15, height: 15 },
            { x: 380, y: 420, width: 15, height: 15 },
            { x: 540, y: 370, width: 15, height: 15 },
            { x: 200, y: 310, width: 15, height: 15 },
            { x: 500, y: 310, width: 15, height: 15 },
        ]
    }
];

let currentLevelData = levels[0];

// Update UI
function updateUI() {
    document.getElementById('screen').textContent = `${gameState.currentLevel}/10`;
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

    // Obstacle collision
    for (let obstacle of currentLevelData.obstacles) {
        if (checkCollision(player, obstacle)) {
            if (player.velocityY >= 0 && player.y + player.height - player.velocityY <= obstacle.y + 10) {
                player.y = obstacle.y - player.height;
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
            break;
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
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }
}

function drawObstacles() {
    for (let obstacle of currentLevelData.obstacles) {
        ctx.fillStyle = '#DC143C'; // Crimson red
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#8B0000'; // Dark red
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
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
    gameState.health = 3;
    gameState.gameOver = false;
    gameState.won = false;
    currentLevelData = JSON.parse(JSON.stringify(levels[gameState.currentLevel - 1]));
}

function nextLevel() {
    if (gameState.currentLevel < 10) {
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
        gameState.health = 3;
        gameState.gameOver = false;
        gameState.won = false;
    } else {
        alert('You beat the game! Congratulations!');
        gameState.currentLevel = 1;
        gameState.health = 3;
        restartLevel();
    }
}

function prevLevel() {
    if (gameState.currentLevel > 1) {
        gameState.currentLevel--;
        currentLevelData = JSON.parse(JSON.stringify(levels[gameState.currentLevel - 1]));
        player.x = 50;
        player.y = 400;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isOnGround = false;
        player.isClimbing = false;
        player.canDash = true;
        player.isDashing = false;
        gameState.health = 3;
        gameState.gameOver = false;
        gameState.won = false;
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState.gameOver && !gameState.won) {
        updatePlayer();
    }

    // Draw game
    drawPlatforms();
    drawObstacles();
    drawVines();
    drawSpikes();
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
        if (gameState.currentLevel < 10) {
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
