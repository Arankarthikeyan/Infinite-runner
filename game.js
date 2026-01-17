// Game constants
const GAME_STATES = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

const NUM_LANES = 3;
const INITIAL_SCROLL_SPEED = 1.8; // Further reduced from 2.5 for even smoother gameplay
const MIN_SPAWN_INTERVAL = 2.0; // Increased from 1.5 to give more reaction time
const MAX_SPAWN_INTERVAL = 3.5; // Increased from 3.0 for easier start

// 3D Perspective constants
const HORIZON_Y = 0.25; // Horizon at 25% from top
const ROAD_WIDTH_HORIZON = 0.3; // Road width at horizon (30% of screen)
const ROAD_WIDTH_BOTTOM = 0.95; // Road width at bottom (95% of screen)
const PERSPECTIVE_SCALE_MIN = 0.3; // Minimum scale for distant objects
const PERSPECTIVE_SCALE_MAX = 1.0; // Maximum scale for close objects

// Game object
const game = {
    canvas: null,
    ctx: null,
    gameState: GAME_STATES.START,
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0,
    gameTime: 0,
    animationFrame: 0,
    
    // 3D Perspective
    horizonY: 0,
    roadLeftHorizon: 0,
    roadRightHorizon: 0,
    roadLeftBottom: 0,
    roadRightBottom: 0,
    
    // Lane system (3D lanes)
    lanes: [],
    
    // Player
    player: {
        currentLane: 1, // 0 = left, 1 = center, 2 = right
        targetLane: 1,
        z: 0.75, // Position on road (0 = horizon, 1 = bottom)
        laneOffset: 0,
        runCycle: 0, // Animation frame for running
        armSwing: 0,
        legSwing: 0
    },
    
    // Game mechanics
    obstacles: [],
    scrollSpeed: INITIAL_SCROLL_SPEED,
    lastObstacleSpawn: 0,
    spawnInterval: MAX_SPAWN_INTERVAL,
    scrollOffset: 0,
    
    // Environmental objects
    roadMarkers: [],
    buildings: [],
    
    // Touch handling
    touchStartX: 0,
    touchStartY: 0,
    swipeThreshold: 50,
    lastTouchTime: 0, // Track last touch to prevent double events
    lastMoveTime: 0, // Track last lane change to prevent rapid double-moves
    moveCooldown: 200, // Minimum time between lane changes in ms
    
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
    
    // Calculate 3D perspective
    calculate3DPerspective();
    
    // Initialize buildings
    initializeBuildings();
    
    // Set up UI
    updateBestScoreDisplay();
    setupEventListeners();
    
    // Start game loop
    gameLoop();
}

function calculate3DPerspective() {
    const w = game.canvas.width;
    const h = game.canvas.height;
    
    // Calculate horizon line
    game.horizonY = h * HORIZON_Y;
    
    // Calculate road edges at horizon
    const horizonRoadWidth = w * ROAD_WIDTH_HORIZON;
    game.roadLeftHorizon = (w - horizonRoadWidth) / 2;
    game.roadRightHorizon = (w + horizonRoadWidth) / 2;
    
    // Calculate road edges at bottom
    const bottomRoadWidth = w * ROAD_WIDTH_BOTTOM;
    game.roadLeftBottom = (w - bottomRoadWidth) / 2;
    game.roadRightBottom = (w + bottomRoadWidth) / 2;
    
    // Calculate lane positions (3 lanes in 3D space)
    game.lanes = [];
    for (let i = 0; i < NUM_LANES; i++) {
        game.lanes.push((i + 0.5) / NUM_LANES);
    }
}

function initializeBuildings() {
    game.buildings = [];
    // Left side buildings
    for (let i = 0; i < 5; i++) {
        game.buildings.push({
            side: 'left',
            z: i * 0.2,
            height: 0.3 + Math.random() * 0.4,
            color: `hsl(${200 + Math.random() * 40}, 40%, ${30 + Math.random() * 20}%)`
        });
    }
    // Right side buildings
    for (let i = 0; i < 5; i++) {
        game.buildings.push({
            side: 'right',
            z: i * 0.2,
            height: 0.3 + Math.random() * 0.4,
            color: `hsl(${200 + Math.random() * 40}, 40%, ${30 + Math.random() * 20}%)`
        });
    }
}

function calculateLanes() {
    calculate3DPerspective();
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
    
    // Recalculate 3D perspective
    calculate3DPerspective();
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
        
        // Mark that we handled a touch (prevent click event from firing)
        game.lastTouchTime = Date.now();
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > game.swipeThreshold) {
            if (deltaX > 0) {
                // Swipe right
                moveLane(1);
            } else {
                // Swipe left
                moveLane(-1);
            }
        } else if (Math.abs(deltaX) < game.swipeThreshold && Math.abs(deltaY) < game.swipeThreshold) {
            // Only tap if not swiping - treat as lane change based on screen position
            const tapX = touchEndX;
            const screenThird = game.canvas.width / 3;
            
            if (tapX < screenThird) {
                moveLane(-1);
            } else if (tapX > screenThird * 2) {
                moveLane(1);
            }
            // Middle third does nothing - prevents accidental moves
        }
    }
}

function moveLane(direction) {
    // Prevent rapid double-moves with cooldown
    const currentTime = Date.now();
    if (currentTime - game.lastMoveTime < game.moveCooldown) {
        return; // Ignore move if still in cooldown
    }
    
    game.player.targetLane = Math.max(0, Math.min(NUM_LANES - 1, game.player.targetLane + direction));
    game.lastMoveTime = currentTime;
}

function handleCanvasClick(e) {
    // Ignore click events if a touch event just happened (prevents double-triggering on mobile)
    if (Date.now() - game.lastTouchTime < 500) {
        return;
    }
    
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
    game.animationFrame = 0;
    
    // Reset player
    game.player.currentLane = 1;
    game.player.targetLane = 1;
    game.player.z = 0.75;
    game.player.laneOffset = 0;
    game.player.runCycle = 0;
    
    // Reset road markers
    game.roadMarkers = [];
    
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
    game.animationFrame++;
    
    // Update difficulty
    const difficultyLevel = Math.floor(game.gameTime / 10000);
    game.difficulty = 1 + difficultyLevel * 0.1; // Reduced from 0.15 to 0.1 for more gradual increase
    
    // Update scroll speed (gradually increase)
    game.scrollSpeed = INITIAL_SCROLL_SPEED * game.difficulty;
    
    // Update spawn interval (obstacles spawn more frequently)
    game.spawnInterval = MAX_SPAWN_INTERVAL - Math.min((game.difficulty - 1) * 0.25, 0.9);
    game.spawnInterval = Math.max(game.spawnInterval, MIN_SPAWN_INTERVAL);
    
    // Update score
    updateScore();
    
    // Update scroll offset
    game.scrollOffset += game.scrollSpeed * (deltaTime / 16.67);
    
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
    
    // Update road markers
    updateRoadMarkers(deltaTime);
    
    // Check collisions
    if (checkCollisions()) {
        endGame();
    }
}

function updatePlayer(deltaTime) {
    // Smooth lane transition
    const targetLanePos = game.lanes[game.player.targetLane];
    const currentLanePos = game.lanes[game.player.currentLane];
    
    // Interpolate lane offset
    const laneDistance = targetLanePos - currentLanePos;
    
    if (Math.abs(game.player.laneOffset - laneDistance) > 0.01) {
        game.player.laneOffset += (laneDistance - game.player.laneOffset) * 0.15;
    } else {
        game.player.laneOffset = laneDistance;
        game.player.currentLane = game.player.targetLane;
    }
    
    // Update running animation
    game.player.runCycle += game.scrollSpeed * 0.15;
    game.player.armSwing = Math.sin(game.player.runCycle) * 0.3;
    game.player.legSwing = Math.sin(game.player.runCycle + Math.PI) * 0.5;
}

function updateRoadMarkers(deltaTime) {
    // Add new markers if needed
    if (game.roadMarkers.length === 0 || game.roadMarkers[game.roadMarkers.length - 1].z > 0.1) {
        game.roadMarkers.push({ z: 0 });
    }
    
    // Update existing markers
    const speed = game.scrollSpeed * 0.01;
    for (let i = game.roadMarkers.length - 1; i >= 0; i--) {
        game.roadMarkers[i].z += speed;
        
        // Remove markers that are too close
        if (game.roadMarkers[i].z > 1) {
            game.roadMarkers.splice(i, 1);
        }
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
            z: 0, // Start at horizon
            type: 'car',
            color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8DADC'][Math.floor(Math.random() * 4)]
        };
        game.obstacles.push(obstacle);
    }
}

function updateObstacles(deltaTime) {
    const speed = game.scrollSpeed * 0.006; // Further reduced from 0.008 to 0.006 for much slower cars
    
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        game.obstacles[i].z += speed;
        
        // Remove off-screen obstacles
        if (game.obstacles[i].z > 1) {
            game.obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    const playerLane = game.player.currentLane;
    const playerZ = game.player.z;
    const collisionThreshold = 0.08; // Z-distance for collision
    
    for (let obstacle of game.obstacles) {
        // Check if in same lane
        if (obstacle.lane === playerLane && Math.abs(game.player.laneOffset) < 0.2) {
            // Check if at similar Z position
            if (Math.abs(obstacle.z - playerZ) < collisionThreshold) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    const w = game.canvas.width;
    const h = game.canvas.height;
    
    // Clear canvas and draw sky
    const skyGradient = game.ctx.createLinearGradient(0, 0, 0, game.horizonY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    game.ctx.fillStyle = skyGradient;
    game.ctx.fillRect(0, 0, w, game.horizonY);
    
    // Draw ground gradient below horizon
    const groundGradient = game.ctx.createLinearGradient(0, game.horizonY, 0, h);
    groundGradient.addColorStop(0, '#90EE90');
    groundGradient.addColorStop(1, '#228B22');
    game.ctx.fillStyle = groundGradient;
    game.ctx.fillRect(0, game.horizonY, w, h - game.horizonY);
    
    // Draw buildings in the background
    drawBuildings();
    
    // Draw road
    drawRoad();
    
    // Draw road markers
    drawRoadMarkers();
    
    // Sort and draw obstacles (far to near)
    game.obstacles.sort((a, b) => a.z - b.z);
    for (let obstacle of game.obstacles) {
        drawCar(obstacle);
    }
    
    // Draw player (running boy)
    drawRunningBoy();
}

function drawBuildings() {
    for (let building of game.buildings) {
        // Slower parallax effect for buildings - divide by 3 instead of 1 for depth perception
        const z = (building.z + game.scrollOffset * 0.0003) % 1;
        const scale = PERSPECTIVE_SCALE_MIN + (PERSPECTIVE_SCALE_MAX - PERSPECTIVE_SCALE_MIN) * z;
        const y = game.horizonY + (game.canvas.height - game.horizonY) * z;
        
        const buildingHeight = game.canvas.height * building.height * scale;
        const buildingWidth = 80 * scale;
        
        let x;
        if (building.side === 'left') {
            x = lerp(game.roadLeftHorizon, game.roadLeftBottom, z) - buildingWidth - 20;
        } else {
            x = lerp(game.roadRightHorizon, game.roadRightBottom, z) + 20;
        }
        
        // Draw building
        game.ctx.fillStyle = building.color;
        game.ctx.fillRect(x, y - buildingHeight, buildingWidth, buildingHeight);
        
        // Add windows
        game.ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
        const windowSize = 4 * scale;
        const windowSpacing = 10 * scale;
        for (let wy = y - buildingHeight + 10; wy < y - 10; wy += windowSpacing) {
            for (let wx = x + 10; wx < x + buildingWidth - 10; wx += windowSpacing) {
                game.ctx.fillRect(wx, wy, windowSize, windowSize);
            }
        }
    }
}

function drawRoad() {
    // Draw road as trapezoid
    game.ctx.fillStyle = '#4A4A4A';
    game.ctx.beginPath();
    game.ctx.moveTo(game.roadLeftHorizon, game.horizonY);
    game.ctx.lineTo(game.roadRightHorizon, game.horizonY);
    game.ctx.lineTo(game.roadRightBottom, game.canvas.height);
    game.ctx.lineTo(game.roadLeftBottom, game.canvas.height);
    game.ctx.closePath();
    game.ctx.fill();
    
    // Draw road edges
    game.ctx.strokeStyle = '#FFFFFF';
    game.ctx.lineWidth = 3;
    game.ctx.beginPath();
    game.ctx.moveTo(game.roadLeftHorizon, game.horizonY);
    game.ctx.lineTo(game.roadLeftBottom, game.canvas.height);
    game.ctx.stroke();
    
    game.ctx.beginPath();
    game.ctx.moveTo(game.roadRightHorizon, game.horizonY);
    game.ctx.lineTo(game.roadRightBottom, game.canvas.height);
    game.ctx.stroke();
    
    // Draw lane dividers
    for (let i = 1; i < NUM_LANES; i++) {
        const lanePos = i / NUM_LANES;
        game.ctx.strokeStyle = '#FFFF00';
        game.ctx.lineWidth = 2;
        game.ctx.setLineDash([10, 10]);
        game.ctx.beginPath();
        
        const xTop = lerp(game.roadLeftHorizon, game.roadRightHorizon, lanePos);
        const xBottom = lerp(game.roadLeftBottom, game.roadRightBottom, lanePos);
        
        game.ctx.moveTo(xTop, game.horizonY);
        game.ctx.lineTo(xBottom, game.canvas.height);
        game.ctx.stroke();
        game.ctx.setLineDash([]);
    }
}

function drawRoadMarkers() {
    for (let marker of game.roadMarkers) {
        for (let i = 1; i < NUM_LANES; i++) {
            const lanePos = i / NUM_LANES;
            const scale = PERSPECTIVE_SCALE_MIN + (PERSPECTIVE_SCALE_MAX - PERSPECTIVE_SCALE_MIN) * marker.z;
            const y = game.horizonY + (game.canvas.height - game.horizonY) * marker.z;
            const x = lerp(
                lerp(game.roadLeftHorizon, game.roadRightHorizon, lanePos),
                lerp(game.roadLeftBottom, game.roadRightBottom, lanePos),
                marker.z
            );
            
            const markerLength = 30 * scale;
            const markerWidth = 4 * scale;
            
            game.ctx.fillStyle = '#FFFFFF';
            game.ctx.fillRect(x - markerWidth / 2, y, markerWidth, markerLength);
        }
    }
}

function drawCar(obstacle) {
    const z = obstacle.z;
    const scale = PERSPECTIVE_SCALE_MIN + (PERSPECTIVE_SCALE_MAX - PERSPECTIVE_SCALE_MIN) * z;
    const y = game.horizonY + (game.canvas.height - game.horizonY) * z;
    
    // Calculate X position based on lane
    const lanePosNorm = game.lanes[obstacle.lane];
    const xTop = lerp(game.roadLeftHorizon, game.roadRightHorizon, lanePosNorm);
    const xBottom = lerp(game.roadLeftBottom, game.roadRightBottom, lanePosNorm);
    const x = lerp(xTop, xBottom, z);
    
    const carWidth = 50 * scale;
    const carHeight = 80 * scale;
    const carBodyHeight = 50 * scale;
    const carRoofHeight = 30 * scale;
    
    // Draw shadow
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    game.ctx.beginPath();
    game.ctx.ellipse(x, y + carHeight * 0.9, carWidth * 0.6, carWidth * 0.2, 0, 0, Math.PI * 2);
    game.ctx.fill();
    
    // Draw car body
    game.ctx.fillStyle = obstacle.color;
    game.ctx.fillRect(x - carWidth / 2, y - carHeight, carWidth, carBodyHeight);
    
    // Draw car roof
    const roofWidth = carWidth * 0.7;
    game.ctx.fillRect(x - roofWidth / 2, y - carHeight, roofWidth, carRoofHeight);
    
    // Add shading
    const carGradient = game.ctx.createLinearGradient(x - carWidth / 2, y - carHeight, x + carWidth / 2, y - carHeight);
    carGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    carGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    carGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    game.ctx.fillStyle = carGradient;
    game.ctx.fillRect(x - carWidth / 2, y - carHeight, carWidth, carBodyHeight);
    
    // Draw windows
    game.ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
    const windowWidth = roofWidth * 0.8;
    const windowHeight = carRoofHeight * 0.7;
    game.ctx.fillRect(x - windowWidth / 2, y - carHeight + 5 * scale, windowWidth, windowHeight);
    
    // Draw wheels
    const wheelRadius = 8 * scale;
    const wheelY = y - carBodyHeight + carHeight - wheelRadius;
    
    game.ctx.fillStyle = '#2C2C2C';
    game.ctx.beginPath();
    game.ctx.arc(x - carWidth / 3, wheelY, wheelRadius, 0, Math.PI * 2);
    game.ctx.fill();
    
    game.ctx.beginPath();
    game.ctx.arc(x + carWidth / 3, wheelY, wheelRadius, 0, Math.PI * 2);
    game.ctx.fill();
    
    // Wheel rims
    game.ctx.fillStyle = '#888';
    game.ctx.beginPath();
    game.ctx.arc(x - carWidth / 3, wheelY, wheelRadius * 0.5, 0, Math.PI * 2);
    game.ctx.fill();
    
    game.ctx.beginPath();
    game.ctx.arc(x + carWidth / 3, wheelY, wheelRadius * 0.5, 0, Math.PI * 2);
    game.ctx.fill();
}

function drawRunningBoy() {
    const z = game.player.z;
    const scale = PERSPECTIVE_SCALE_MIN + (PERSPECTIVE_SCALE_MAX - PERSPECTIVE_SCALE_MIN) * z;
    const y = game.horizonY + (game.canvas.height - game.horizonY) * z;
    
    // Calculate X position based on lane and offset
    const baseLanePos = game.lanes[game.player.currentLane];
    const targetLanePos = game.lanes[game.player.targetLane];
    const lanePosNorm = baseLanePos + game.player.laneOffset;
    
    const xTop = lerp(game.roadLeftHorizon, game.roadRightHorizon, lanePosNorm);
    const xBottom = lerp(game.roadLeftBottom, game.roadRightBottom, lanePosNorm);
    const x = lerp(xTop, xBottom, z);
    
    const boyHeight = 60 * scale;
    const headRadius = 10 * scale;
    const bodyHeight = 25 * scale;
    const legHeight = 20 * scale;
    
    // Running animation offset
    const bounce = Math.abs(Math.sin(game.player.runCycle)) * 3 * scale;
    const baseY = y - boyHeight + bounce;
    
    // Draw shadow
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    game.ctx.beginPath();
    game.ctx.ellipse(x, y - 2 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2);
    game.ctx.fill();
    
    // Draw legs (animated)
    const legSwing = game.player.legSwing;
    game.ctx.strokeStyle = '#4A90E2';
    game.ctx.lineWidth = 4 * scale;
    game.ctx.lineCap = 'round';
    
    // Left leg
    game.ctx.beginPath();
    game.ctx.moveTo(x, baseY + headRadius * 2 + bodyHeight);
    game.ctx.lineTo(x - 5 * scale + legSwing * 10, baseY + headRadius * 2 + bodyHeight + legHeight);
    game.ctx.stroke();
    
    // Right leg
    game.ctx.beginPath();
    game.ctx.moveTo(x, baseY + headRadius * 2 + bodyHeight);
    game.ctx.lineTo(x + 5 * scale - legSwing * 10, baseY + headRadius * 2 + bodyHeight + legHeight);
    game.ctx.stroke();
    
    // Draw body
    game.ctx.fillStyle = '#4A90E2';
    game.ctx.fillRect(x - 8 * scale, baseY + headRadius * 2, 16 * scale, bodyHeight);
    
    // Draw arms (animated)
    const armSwing = game.player.armSwing;
    game.ctx.strokeStyle = '#FDB99B';
    game.ctx.lineWidth = 3 * scale;
    
    // Left arm
    game.ctx.beginPath();
    game.ctx.moveTo(x - 8 * scale, baseY + headRadius * 2 + 5 * scale);
    game.ctx.lineTo(x - 15 * scale + armSwing * 15, baseY + headRadius * 2 + bodyHeight / 2);
    game.ctx.stroke();
    
    // Right arm
    game.ctx.beginPath();
    game.ctx.moveTo(x + 8 * scale, baseY + headRadius * 2 + 5 * scale);
    game.ctx.lineTo(x + 15 * scale - armSwing * 15, baseY + headRadius * 2 + bodyHeight / 2);
    game.ctx.stroke();
    
    // Draw head
    game.ctx.fillStyle = '#FDB99B';
    game.ctx.beginPath();
    game.ctx.arc(x, baseY + headRadius, headRadius, 0, Math.PI * 2);
    game.ctx.fill();
    
    // Draw hair
    game.ctx.fillStyle = '#3C2A1E';
    game.ctx.beginPath();
    game.ctx.arc(x, baseY + headRadius - 2 * scale, headRadius * 0.9, Math.PI, Math.PI * 2);
    game.ctx.fill();
    
    // Draw eyes
    game.ctx.fillStyle = '#000';
    game.ctx.beginPath();
    game.ctx.arc(x - 3 * scale, baseY + headRadius, 1.5 * scale, 0, Math.PI * 2);
    game.ctx.fill();
    
    game.ctx.beginPath();
    game.ctx.arc(x + 3 * scale, baseY + headRadius, 1.5 * scale, 0, Math.PI * 2);
    game.ctx.fill();
    
    // Draw backpack
    game.ctx.fillStyle = '#FF6B6B';
    game.ctx.fillRect(x - 10 * scale, baseY + headRadius * 2 + 3 * scale, 20 * scale, 15 * scale);
    
    // Backpack straps
    game.ctx.strokeStyle = '#CC5555';
    game.ctx.lineWidth = 2 * scale;
    game.ctx.beginPath();
    game.ctx.moveTo(x - 5 * scale, baseY + headRadius * 2);
    game.ctx.lineTo(x - 5 * scale, baseY + headRadius * 2 + 10 * scale);
    game.ctx.stroke();
    
    game.ctx.beginPath();
    game.ctx.moveTo(x + 5 * scale, baseY + headRadius * 2);
    game.ctx.lineTo(x + 5 * scale, baseY + headRadius * 2 + 10 * scale);
    game.ctx.stroke();
}

// Helper function for linear interpolation
function lerp(a, b, t) {
    return a + (b - a) * t;
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
