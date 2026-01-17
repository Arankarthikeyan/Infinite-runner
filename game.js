// Game constants
const GAME_STATES = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

const NUM_LANES = 3;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;
const INITIAL_SCROLL_SPEED = 6;
const MIN_SPAWN_INTERVAL = 0.8;
const MAX_SPAWN_INTERVAL = 1.8;
const LANE_SWITCH_SPEED = 15;

// Game object
const game = {
    canvas: null,
    ctx: null,
    gameState: GAME_STATES.START,
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0,
    gameTime: 0,
    
    // Lane system
    laneWidth: 0,
    lanes: [],
    
    // Player
    player: {
        currentLane: 1, // 0 = left, 1 = center, 2 = right
        targetLane: 1,
        x: 0,
        y: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityX: 0,
        color: '#FF6B6B'
    },
    
    // Game mechanics
    obstacles: [],
    scrollSpeed: INITIAL_SCROLL_SPEED,
    lastObstacleSpawn: 0,
    spawnInterval: MAX_SPAWN_INTERVAL,
    scrollOffset: 0,
    
    // Touch handling
    touchStartX: 0,
    touchStartY: 0,
    swipeThreshold: 50,
    
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
    
    // Calculate lane positions
    calculateLanes();
    
    // Initialize player position
    game.player.y = game.canvas.height * 0.75;
    game.player.x = game.lanes[game.player.currentLane];
    
    // Set up UI
    updateBestScoreDisplay();
    setupEventListeners();
    
    // Start game loop
    gameLoop();
}

function calculateLanes() {
    game.laneWidth = game.canvas.width / NUM_LANES;
    game.lanes = [];
    for (let i = 0; i < NUM_LANES; i++) {
        game.lanes.push(i * game.laneWidth + game.laneWidth / 2 - PLAYER_WIDTH / 2);
    }
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
    
    // Recalculate lanes
    calculateLanes();
    
    // Update player X position
    if (game.player) {
        game.player.x = game.lanes[game.player.currentLane];
    }
}

function setupEventListeners() {
    // Canvas touch events
    game.canvas.addEventListener('touchstart', handleTouchStart, false);
    game.canvas.addEventListener('touchend', handleTouchEnd, false);
    game.canvas.addEventListener('click', handleCanvasClick, false);
    
    // Keyboard for desktop
    document.addEventListener('keydown', handleKeyPress, false);
    
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

function handleKeyPress(e) {
    if (game.gameState !== GAME_STATES.PLAYING) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveLane(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveLane(1);
    }
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
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - game.touchStartX;
        const deltaY = touchEndY - game.touchStartY;
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > game.swipeThreshold) {
            if (deltaX > 0) {
                // Swipe right
                moveLane(1);
            } else {
                // Swipe left
                moveLane(-1);
            }
        } else if (Math.abs(deltaX) < game.swipeThreshold) {
            // Tap - treat as lane change based on screen position
            const tapX = touchEndX;
            const screenThird = game.canvas.width / 3;
            
            if (tapX < screenThird) {
                moveLane(-1);
            } else if (tapX > screenThird * 2) {
                moveLane(1);
            }
        }
    }
}

function moveLane(direction) {
    game.player.targetLane = Math.max(0, Math.min(NUM_LANES - 1, game.player.targetLane + direction));
}

function handleCanvasClick(e) {
    if (game.gameState === GAME_STATES.START || game.gameState === GAME_STATES.GAME_OVER) {
        startGame();
        return;
    }
    
    if (game.gameState === GAME_STATES.PLAYING) {
        const clickX = e.clientX - game.canvas.getBoundingClientRect().left;
        const screenThird = game.canvas.width / 3;
        
        if (clickX < screenThird) {
            moveLane(-1);
        } else if (clickX > screenThird * 2) {
            moveLane(1);
        }
    }
}

function startGame() {
    game.gameState = GAME_STATES.PLAYING;
    game.score = 0;
    game.gameTime = 0;
    game.scrollSpeed = INITIAL_SCROLL_SPEED;
    game.difficulty = 1;
    game.obstacles = [];
    game.lastObstacleSpawn = Date.now();
    game.spawnInterval = MAX_SPAWN_INTERVAL;
    game.scrollOffset = 0;
    
    // Reset player
    game.player.currentLane = 1;
    game.player.targetLane = 1;
    game.player.y = game.canvas.height * 0.75;
    game.player.x = game.lanes[game.player.currentLane];
    game.player.velocityX = 0;
    
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
    
    // Update scroll speed (gradually increase)
    game.scrollSpeed = INITIAL_SCROLL_SPEED * game.difficulty;
    
    // Update spawn interval (obstacles spawn more frequently)
    game.spawnInterval = MAX_SPAWN_INTERVAL - Math.min((game.difficulty - 1) * 0.25, 0.9);
    game.spawnInterval = Math.max(game.spawnInterval, MIN_SPAWN_INTERVAL);
    
    // Update score
    updateScore();
    
    // Update scroll offset
    game.scrollOffset += game.scrollSpeed;
    
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
    // Smooth lane transition
    const targetX = game.lanes[game.player.targetLane];
    const dx = targetX - game.player.x;
    
    if (Math.abs(dx) > 1) {
        game.player.x += dx * 0.2; // Smooth interpolation
    } else {
        game.player.x = targetX;
        game.player.currentLane = game.player.targetLane;
    }
}

function spawnObstacle() {
    // Randomly choose a lane
    const randomLane = Math.floor(Math.random() * NUM_LANES);
    
    // Sometimes spawn multiple obstacles (but not all lanes)
    const numObstacles = Math.random() < 0.3 ? 2 : 1;
    const spawnedLanes = new Set();
    
    for (let i = 0; i < numObstacles; i++) {
        let lane = randomLane;
        
        // Make sure we don't spawn in the same lane twice
        if (numObstacles > 1) {
            while (spawnedLanes.has(lane)) {
                lane = Math.floor(Math.random() * NUM_LANES);
            }
        }
        spawnedLanes.add(lane);
        
        const obstacle = {
            lane: lane,
            x: game.lanes[lane],
            y: -OBSTACLE_HEIGHT,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            color: '#FF6B6B'
        };
        game.obstacles.push(obstacle);
    }
}

function updateObstacles(deltaTime) {
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        game.obstacles[i].y += game.scrollSpeed;
        
        // Remove off-screen obstacles
        if (game.obstacles[i].y > game.canvas.height) {
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
    
    // Draw sky gradient (top to bottom)
    const gradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    game.ctx.fillStyle = gradient;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // Draw lane dividers (vertical lines)
    game.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    game.ctx.lineWidth = 2;
    game.ctx.setLineDash([10, 10]);
    
    for (let i = 1; i < NUM_LANES; i++) {
        const x = i * game.laneWidth;
        game.ctx.beginPath();
        game.ctx.moveTo(x, 0);
        game.ctx.lineTo(x, game.canvas.height);
        game.ctx.stroke();
    }
    game.ctx.setLineDash([]);
    
    // Draw scrolling road lines
    const lineSpacing = 80;
    const offset = game.scrollOffset % lineSpacing;
    
    game.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    game.ctx.lineWidth = 3;
    
    for (let y = -offset; y < game.canvas.height; y += lineSpacing) {
        for (let i = 1; i < NUM_LANES; i++) {
            const x = i * game.laneWidth;
            game.ctx.beginPath();
            game.ctx.moveTo(x - 1, y);
            game.ctx.lineTo(x + 1, y + 30);
            game.ctx.stroke();
        }
    }
    
    // Draw obstacles
    for (let obstacle of game.obstacles) {
        game.ctx.fillStyle = obstacle.color;
        game.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add a gradient
        const obstacleGradient = game.ctx.createLinearGradient(
            obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height
        );
        obstacleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        obstacleGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        game.ctx.fillStyle = obstacleGradient;
        game.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add border
        game.ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
        game.ctx.lineWidth = 2;
        game.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
    
    // Draw player
    drawPlayer();
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
