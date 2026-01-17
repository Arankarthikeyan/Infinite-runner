// Game constants
const GAME_STATES = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

const GROUND_COLOR = '#8B7355';
const GROUND_HEIGHT = 60;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const OBSTACLE_WIDTH = 25;
const OBSTACLE_HEIGHT = 50;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const MAX_FALL_SPEED = 15;
const INITIAL_OBSTACLE_SPEED = 6;
const MIN_SPAWN_INTERVAL = 1.2;
const MAX_SPAWN_INTERVAL = 2.5;

// Game object
const game = {
    canvas: null,
    ctx: null,
    gameState: GAME_STATES.START,
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0,
    gameTime: 0,
    
    // Player
    player: {
        x: 0,
        y: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
        isJumping: false,
        canDoubleJump: false,
        color: '#FF6B6B'
    },
    
    // Game mechanics
    obstacles: [],
    obstacleSpeed: INITIAL_OBSTACLE_SPEED,
    lastObstacleSpawn: 0,
    spawnInterval: MAX_SPAWN_INTERVAL,
    
    // Touch handling
    lastTouchTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    
    // Difficulty scaling
    difficulty: 1
};

// Initialize game
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Set up canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize player position
    game.player.x = game.canvas.width * 0.15;
    game.player.y = game.canvas.height - GROUND_HEIGHT - game.player.height;
    
    // Set up UI
    updateBestScoreDisplay();
    setupEventListeners();
    
    // Start game loop
    gameLoop();
}

function resizeCanvas() {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
    
    // Adjust for header/footer if they exist
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const headerHeight = header ? header.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;
    
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight - headerHeight - footerHeight;
    
    // Ensure player stays in bounds
    if (game.player.y + game.player.height > game.canvas.height) {
        game.player.y = game.canvas.height - GROUND_HEIGHT - game.player.height;
    }
}

function setupEventListeners() {
    // Canvas touch events
    game.canvas.addEventListener('touchstart', handleTouchStart, false);
    game.canvas.addEventListener('touchend', handleTouchEnd, false);
    game.canvas.addEventListener('click', handleCanvasClick, false);
    
    // Prevent page scroll while playing
    document.addEventListener('touchmove', (e) => {
        if (game.gameState === GAME_STATES.PLAYING) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // UI buttons
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    
    // Share button
    document.getElementById('shareBtn').addEventListener('click', shareGame);
}

function handleTouchStart(e) {
    e.preventDefault();
    game.touchStartX = e.touches[0].clientX;
    game.touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (game.gameState === GAME_STATES.START) {
        startGame();
        return;
    }
    
    if (game.gameState === GAME_STATES.GAME_OVER) {
        startGame();
        return;
    }
    
    if (game.gameState === GAME_STATES.PLAYING) {
        const currentTime = Date.now();
        const isDoubleTap = currentTime - game.lastTouchTime < 300;
        
        if (isDoubleTap) {
            // Double tap - second jump
            if (game.player.canDoubleJump && !game.player.isJumping) {
                game.player.velocityY = JUMP_STRENGTH * 0.9;
                game.player.canDoubleJump = false;
                game.player.isJumping = true;
            }
        } else {
            // Single tap - jump
            if (!game.player.isJumping) {
                game.player.velocityY = JUMP_STRENGTH;
                game.player.isJumping = true;
                game.player.canDoubleJump = true;
            }
        }
        
        game.lastTouchTime = currentTime;
    }
}

function handleCanvasClick(e) {
    if (game.gameState === GAME_STATES.START || game.gameState === GAME_STATES.GAME_OVER) {
        startGame();
        return;
    }
    
    if (game.gameState === GAME_STATES.PLAYING) {
        if (!game.player.isJumping) {
            game.player.velocityY = JUMP_STRENGTH;
            game.player.isJumping = true;
            game.player.canDoubleJump = true;
        }
    }
}

function startGame() {
    game.gameState = GAME_STATES.PLAYING;
    game.score = 0;
    game.gameTime = 0;
    game.obstacleSpeed = INITIAL_OBSTACLE_SPEED;
    game.difficulty = 1;
    game.obstacles = [];
    game.lastObstacleSpawn = Date.now();
    game.spawnInterval = MAX_SPAWN_INTERVAL;
    
    // Reset player
    game.player.x = game.canvas.width * 0.15;
    game.player.y = game.canvas.height - GROUND_HEIGHT - game.player.height;
    game.player.velocityY = 0;
    game.player.isJumping = false;
    game.player.canDoubleJump = false;
    
    // Hide screens and show game UI
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('gameUI').style.display = 'block';
}

function updateScore() {
    game.score = Math.floor(game.gameTime / 100);
    document.getElementById('currentScore').textContent = game.score;
}

function updateBestScoreDisplay() {
    document.getElementById('displayBestScore').textContent = game.bestScore;
    document.getElementById('bestScore').textContent = game.bestScore;
}

function endGame() {
    game.gameState = GAME_STATES.GAME_OVER;
    
    // Update best score
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        localStorage.setItem('bestScore', game.bestScore);
        updateBestScoreDisplay();
    }
    
    // Show game over screen
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function update(deltaTime) {
    if (game.gameState !== GAME_STATES.PLAYING) return;
    
    game.gameTime += deltaTime;
    
    // Update difficulty
    const difficultyLevel = Math.floor(game.gameTime / 10000);
    game.difficulty = 1 + difficultyLevel * 0.15;
    
    // Update obstacle speed (gradually increase)
    game.obstacleSpeed = INITIAL_OBSTACLE_SPEED * game.difficulty;
    
    // Update spawn interval (obstacles spawn more frequently)
    game.spawnInterval = MAX_SPAWN_INTERVAL - Math.min((game.difficulty - 1) * 0.3, 1.2);
    game.spawnInterval = Math.max(game.spawnInterval, MIN_SPAWN_INTERVAL);
    
    // Update score
    updateScore();
    
    // Update player
    updatePlayer(deltaTime);
    
    // Spawn obstacles
    const currentTime = Date.now();
    if (currentTime - game.lastObstacleSpawn > game.spawnInterval * 1000) {
        spawnObstacle();
        game.lastObstacleSpawn = currentTime;
    }
    
    // Update obstacles
    updateObstacles(deltaTime);
    
    // Check collisions
    if (checkCollisions()) {
        endGame();
    }
}

function updatePlayer(deltaTime) {
    const ground = game.canvas.height - GROUND_HEIGHT;
    
    // Apply gravity
    game.player.velocityY += GRAVITY;
    if (game.player.velocityY > MAX_FALL_SPEED) {
        game.player.velocityY = MAX_FALL_SPEED;
    }
    
    // Update position
    game.player.y += game.player.velocityY;
    
    // Ground collision
    if (game.player.y + game.player.height >= ground) {
        game.player.y = ground - game.player.height;
        game.player.velocityY = 0;
        game.player.isJumping = false;
        game.player.canDoubleJump = false;
    }
}

function spawnObstacle() {
    const ground = game.canvas.height - GROUND_HEIGHT;
    const obstacle = {
        x: game.canvas.width,
        y: ground - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        color: '#FF6B6B'
    };
    game.obstacles.push(obstacle);
}

function updateObstacles(deltaTime) {
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        game.obstacles[i].x -= game.obstacleSpeed;
        
        // Remove off-screen obstacles
        if (game.obstacles[i].x + game.obstacles[i].width < 0) {
            game.obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let obstacle of game.obstacles) {
        if (
            game.player.x < obstacle.x + obstacle.width &&
            game.player.x + game.player.width > obstacle.x &&
            game.player.y < obstacle.y + obstacle.height &&
            game.player.y + game.player.height > obstacle.y
        ) {
            return true;
        }
    }
    return false;
}

function draw() {
    // Clear canvas
    game.ctx.fillStyle = '#87CEEB';
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // Draw sky gradient
    const gradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    game.ctx.fillStyle = gradient;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // Draw ground
    const groundY = game.canvas.height - GROUND_HEIGHT;
    game.ctx.fillStyle = GROUND_COLOR;
    game.ctx.fillRect(0, groundY, game.canvas.width, GROUND_HEIGHT);
    
    // Draw ground pattern
    game.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    game.ctx.lineWidth = 1;
    for (let i = 0; i < game.canvas.width; i += 40) {
        game.ctx.beginPath();
        game.ctx.moveTo(i, groundY);
        game.ctx.lineTo(i + 20, groundY + GROUND_HEIGHT);
        game.ctx.stroke();
    }
    
    // Draw player
    drawPlayer();
    
    // Draw obstacles
    for (let obstacle of game.obstacles) {
        game.ctx.fillStyle = obstacle.color;
        game.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add a gradient
        const obstacleGradient = game.ctx.createLinearGradient(
            obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y
        );
        obstacleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        obstacleGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        game.ctx.fillStyle = obstacleGradient;
        game.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

function drawPlayer() {
    // Draw player as a rounded rectangle
    const radius = 5;
    game.ctx.fillStyle = game.player.color;
    
    game.ctx.beginPath();
    game.ctx.moveTo(game.player.x + radius, game.player.y);
    game.ctx.lineTo(game.player.x + game.player.width - radius, game.player.y);
    game.ctx.quadraticCurveTo(
        game.player.x + game.player.width,
        game.player.y,
        game.player.x + game.player.width,
        game.player.y + radius
    );
    game.ctx.lineTo(game.player.x + game.player.width, game.player.y + game.player.height - radius);
    game.ctx.quadraticCurveTo(
        game.player.x + game.player.width,
        game.player.y + game.player.height,
        game.player.x + game.player.width - radius,
        game.player.y + game.player.height
    );
    game.ctx.lineTo(game.player.x + radius, game.player.y + game.player.height);
    game.ctx.quadraticCurveTo(
        game.player.x,
        game.player.y + game.player.height,
        game.player.x,
        game.player.y + game.player.height - radius
    );
    game.ctx.lineTo(game.player.x, game.player.y + radius);
    game.ctx.quadraticCurveTo(
        game.player.x,
        game.player.y,
        game.player.x + radius,
        game.player.y
    );
    game.ctx.fill();
    
    // Add shine effect
    game.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    game.ctx.fillRect(game.player.x + 2, game.player.y + 2, game.player.width * 0.4, game.player.height * 0.3);
}

function shareGame() {
    const gameUrl = window.location.href;
    const shareText = `🏃 I scored ${game.score} points in Infinite Runner! Can you beat my score? 🎮`;
    
    if (navigator.share) {
        // Use native share if available (mobile)
        navigator.share({
            title: 'Infinite Runner',
            text: shareText,
            url: gameUrl
        }).catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
        });
    } else {
        // Fallback: copy to clipboard
        const textToCopy = `${shareText}\n${gameUrl}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Show feedback
            const shareBtn = document.getElementById('shareBtn');
            const originalText = shareBtn.textContent;
            shareBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            // Fallback: show alert
            alert(`Check out Infinite Runner!\n${gameUrl}`);
        });
    }
}

// Game loop
let lastTime = Date.now();

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
window.addEventListener('load', init);
