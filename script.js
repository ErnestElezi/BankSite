function showPage(pageId, navItem) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageId).classList.add('active');

    // Add active state to corresponding nav item
    if (navItem) {
        navItem.classList.add('active');
    }
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('pointerup', function() {
        showPage(this.dataset.page, this);
    });
});

document.querySelectorAll('.quest-panel').forEach(panel => {
    panel.addEventListener('click', function(event) {
        if (event.target.classList.contains('step-checkbox')) {
            event.stopPropagation();
            return;
        }

        const questSteps = this.querySelector('.quest-steps');
        const isExpanded = this.classList.contains('expanded');

        if (isExpanded) {
            questSteps.style.display = 'none';
            this.classList.remove('expanded');
        } else {
            questSteps.style.display = 'flex';
            this.classList.add('expanded');
        }
    });
});

// Simple Game Canvas
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const backgroundGradient = c.createLinearGradient(0, 0, 0, canvas.height);
backgroundGradient.addColorStop(0, '#1d4ed8');
backgroundGradient.addColorStop(1, '#93c5fd');

c.ImageSmoothingEnabled = false;

const playerSpriteSheet = new Image();
playerSpriteSheet.src = 'player_spritesheet.png';

const spikeSpriteSheet = new Image();
spikeSpriteSheet.src = 'Spike.png';

const platformSpriteSheet = new Image();
platformSpriteSheet.src = 'Platform.png';

const enemySpriteSheet = new Image();
enemySpriteSheet.src = 'Enemy.png';

const input = {
    pointer: {
        x: 0,
        y: 0,
    },
    pointer_down: false,
    pointer_change: false,
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
let spikeList = [];
let enemy;


let platforms = [
    { x: canvas.width / 2 - 50, y: canvas.height - 20, w: 128, h: 32 },
    { x: 40, y: canvas.height - 120, w: 128, h: 32 },
    { x: 220, y: canvas.height - 190, w: 128, h: 32 },
    { x: 90, y: canvas.height - 280, w: 128, h: 32 },
    { x: 240, y: canvas.height - 380, w: 128, h: 32 },
    { x: 60, y: canvas.height - 470, w: 128, h: 32 },
];

const initialPlatformState = platforms.map(platform => ({ ...platform }));

let cameraOffsetY = 0;
let difficulty = 0;

function handlePointerEvent(event) {
    event.preventDefault();

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (event.type !== 'pointerup' && event.type !== 'pointercancel' && (x < 0 || x > canvas.width || y < 0 || y > canvas.height)) {
        return;
    }

    switch (event.type) {
        case 'pointerdown':
            input.pointer_down = true;
            input.pointer_change = true;
            canvas.setPointerCapture(event.pointerId);
            break;
        case 'pointerup':
            input.pointer_down = false;
            input.pointer_change = true;
            canvas.releasePointerCapture(event.pointerId);
            break;
        case 'pointercancel':
            input.pointer_down = false;
            input.pointer_change = true;
            canvas.releasePointerCapture(event.pointerId);
            break;
        case 'pointermove':
            break;
    }

    input.pointer = { x, y };
}

canvas.style.touchAction = 'none';
canvas.addEventListener('pointerdown', handlePointerEvent, { passive: false });
canvas.addEventListener('pointermove', handlePointerEvent, { passive: false });
canvas.addEventListener('pointerup', handlePointerEvent, { passive: false });
canvas.addEventListener('pointercancel', handlePointerEvent, { passive: false });

function resetPlatforms() {
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].x = Math.random() * (canvas.width - platforms[i].w);
        platforms[i].y = canvas.height - 20 - i * (canvas.height / platforms.length);
    }
    platforms[0].x = canvas.width / 2 - platforms[0].w / 2;
}

function distance(pos0, pos1) {
    const dx = pos1.x - pos0.x;
    const dy = pos1.y - pos0.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function initGame() {
    cameraOffsetY = 0;

    input.pointer.x = 0;
    input.pointer.y = 0;
    input.pointer_down = false;
    input.pointer_change = false;

    platforms = initialPlatformState.map(platform => ({ ...platform }));
    resetPlatforms();

    spikeList = [];
    spikeList.push({
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 100),
        w: 30,
        h: 30,
    });

    enemy = {
        x: platforms[5].x + platforms[5].w / 2 - 30,
        y: platforms[5].y - 60,
        w: 60,
        h: 60,
    };


    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 80;
    player.vx = 0;
    player.vy = 0;
    player.on_ground = false;
    player.charge = 0;
}

function updateCamera(player) {
    const bottomQuarterLine = canvas.height * 0.40;
    cameraOffsetY = Math.min(cameraOffsetY, player.y - bottomQuarterLine);
}

function getFuturePos(player, time, gravity, pointer) {
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const pointerWorldY = pointer.y + cameraOffsetY;
    const aimAngle = Math.atan2(pointerWorldY - centerY, pointer.x - centerX);
    const launchSpeed = player.charge * player.launch_power;
    const vx = Math.cos(aimAngle) * launchSpeed;
    const vy = Math.sin(aimAngle) * launchSpeed;

    return {
        x: player.x + vx * time,
        y: player.y + vy * time + 0.5 * gravity * time * time,
    };
}

function drawFuturePositions(player, steps) {
    if (player.charge <= 0) return;

    c.save();
    c.translate(0, -cameraOffsetY);

    for (let i = 0; i < steps; i++) {
        const futurePos = getFuturePos(player, i, player.g, input.pointer);
        c.beginPath();
        c.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        c.arc(futurePos.x + player.w / 2, futurePos.y + player.h / 2, 5, 0, Math.PI * 2, false);
        c.stroke();
        c.closePath();
    }

    c.restore();
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 50;
        this.h = 50;
        this.g = 0.5;
        this.vx = 0;
        this.vy = 0;
        this.on_ground = false;
        this.friction = 0.5;
        this.charge = 0;
        this.max_charge = 1;
        this.charge_rate = 1 / 60;
        this.launch_power = 20;
        this.frame = 0;
    }

    draw() {
        let offsetX = (Math.floor(this.frame/20) % 2) * 32;
        c.save();
        c.translate(this.x, this.y - cameraOffsetY);
        if (this.vx < 0) {
            c.scale(-1, 1);
            c.translate(-this.w, 0);
        }
        if (this.on_ground) {
        c.drawImage(playerSpriteSheet, offsetX, 0, 32, 32, 0, 0, this.w, this.h);
        } else {
            if (this.vy > 0) {
                c.drawImage(playerSpriteSheet, 96, 0, 32, 32, 0, 0, this.w, this.h);
            } else {
                c.drawImage(playerSpriteSheet, 64, 0, 32, 32, 0, 0, this.w, this.h);
            }
        }
        c.restore();
    }

    update() {
        this.frame++;
        const wasOnGround = this.on_ground;
        const previousY = this.y;
        const groundSnapDistance = 3;

        let nextOnGround = false;

        if (!wasOnGround) {
            this.vy += this.g;
        } else {
            this.vy = 0;
        }

        let nextX = this.x + this.vx;
        let nextY = this.y + this.vy;

        for (const platform of platforms) {
            const movingDown = this.vy >= 0;
            const horizontallyOverlapping = nextX + this.w > platform.x && nextX < platform.x + platform.w;
            const crossedTop = previousY + this.h <= platform.y + groundSnapDistance && nextY + this.h >= platform.y - groundSnapDistance;

            if (movingDown && horizontallyOverlapping && crossedTop) {
                nextY = platform.y - this.h;
                this.vy = 0;
                nextOnGround = true;
                break;
            }

            if (platform.y - cameraOffsetY > canvas.height + 30) {
                platform.y = cameraOffsetY - platform.h - 30 + (Math.random() * 10 - 5);
                platform.x = Math.random() * (canvas.width - platform.w);
            }
        }

        if (!nextOnGround && nextY > previousY && nextY + this.h > canvas.height + 1) {
            nextY = canvas.height - this.h;
            this.vy = 0;
            nextOnGround = true;
        }

        if (nextOnGround && input.pointer_down) {
            this.charge = clamp(this.charge + this.charge_rate, 0, this.max_charge);
        }

        if (nextOnGround && !input.pointer_down && input.pointer_change && this.charge > 0) {
            const centerX = this.x + this.w / 2;
            const centerY = this.y + this.h / 2;
            const aimX = input.pointer.x - centerX;
            const aimY = input.pointer.y + cameraOffsetY - centerY;
            const aimAngle = Math.atan2(aimY, aimX);
            const launchSpeed = this.charge * this.launch_power;

            this.vx = Math.cos(aimAngle) * launchSpeed * 0.6;
            this.vy = Math.sin(aimAngle) * launchSpeed;
            this.charge = 0;

            nextX = this.x + this.vx;
            nextY = this.y + this.vy;
            nextOnGround = false;
        }

        this.x = nextX;
        this.y = nextY;
        this.on_ground = nextOnGround;

        this.vx *= this.on_ground ? this.friction : 1;
        this.vy *= 0.99;

        this.x = clamp(this.x, 0, canvas.width - this.w);
    }
}

const player = new Player(canvas.width / 2 - 15, canvas.height - 80);

initGame();

function drawGame() {
    requestAnimationFrame(drawGame);

    if (!document.getElementById('game').classList.contains('active')) {
        return;
    }

    c.fillStyle = backgroundGradient;
    c.fillRect(0, 0, canvas.width, canvas.height);

    updateCamera(player);

    for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];
        c.drawImage(platformSpriteSheet, 0, 0, 128, 32, platform.x, platform.y - cameraOffsetY, platform.w, platform.h);
    }

    for (let spike of spikeList) {

        c.drawImage(spikeSpriteSheet, 0, 0, 22, 22, spike.x-2, spike.y - cameraOffsetY-2, spike.w+4, spike.h+4);

        if (spike.y - cameraOffsetY > canvas.height + 30) {
            spike.y = cameraOffsetY - spike.h - 30 + (Math.random() * 10 - 5);
            spike.x = Math.random() * (canvas.width - spike.w);
        }

    if (player.x + player.w > spike.x && player.x < spike.x + spike.w &&
        player.y + player.h > spike.y && player.y < spike.y + spike.h) {
        initGame();
    }
    }

    let spikeDifficoultyThreshold = -Math.floor((player.y - canvas.height) / (canvas.height*2))/5;
    // c.fillStyle = 'rgba(0,0,0,0.5)';
    // c.fillText(`Difficulty: ${spikeDifficoultyThreshold}`, 20, 60);

    if (spikeDifficoultyThreshold > spikeList.length) {
        spikeList.push({
            x: Math.random() * (canvas.width - 30),
            y: cameraOffsetY - canvas.height - 30 + (Math.random() * 20 - 10),
            w: 30,
            h: 30,
        });
    }


    c.drawImage(enemySpriteSheet, 0, 0, 32, 32, enemy.x, enemy.y - cameraOffsetY, enemy.w, enemy.h);

    let playerDistance = distance({x: player.x + player.w/2, y: player.y + player.h/2}, {x: enemy.x + enemy.w/2, y: enemy.y + enemy.h/2});

    if (playerDistance > 40 && playerDistance < 80) {
        c.strokeStyle = playerDistance < 60 ? 'red' : 'yellow';
        c.beginPath();
        c.lineWidth = 2;
        c.arc(enemy.x + enemy.w/2, enemy.y - cameraOffsetY + enemy.h/2, playerDistance, 0, Math.PI * 2);
        c.stroke();
        c.closePath();
        if (playerDistance < 60 && !player.on_ground && input.pointer_down && input.pointer_change) {
            enemy.x = platforms[Math.floor(platforms.length * Math.random())].x + platforms[Math.floor(platforms.length * Math.random())].w / 2 - 30;
            enemy.y = platforms[Math.floor(platforms.length * Math.random())].y - 60;
        }
    }

    if(playerDistance < 40) {
        initGame();
    }

    if (enemy.y - cameraOffsetY > canvas.height + 30) {
        enemy.y = cameraOffsetY - enemy.h - 30 + (Math.random() * 10 - 5);
        enemy.x = Math.random() * (canvas.width - enemy.w);
    }



    c.beginPath();
    c.strokeStyle = input.pointer_down ? 'red' : 'blue';
    c.arc(input.pointer.x, input.pointer.y, 20, 0, Math.PI * 2, false);
    c.stroke();
    c.closePath();

    const meterX = 20;
    const meterY = 20;
    const meterWidth = 150;
    const meterHeight = 10;
    const meterFill = player.charge / player.max_charge;

    c.fillStyle = 'rgba(0, 0, 0, 0.15)';
    c.fillRect(meterX, meterY, meterWidth, meterHeight);
    c.fillStyle = input.pointer_down ? '#ff6b6b' : '#FFD700';
    c.fillRect(meterX, meterY, meterWidth * meterFill, meterHeight);
    c.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    c.strokeRect(meterX, meterY, meterWidth, meterHeight);

    player.draw();
    player.update();

    drawFuturePositions(player, 20);

    c.strokeStyle = '#ddd';
    c.lineWidth = 2;
    c.strokeRect(0, 0, canvas.width, canvas.height);

    input.pointer_change = false;

    if (player.y - cameraOffsetY > canvas.height) {
        initGame();
    }

    difficulty = -(player.y - canvas.height)/canvas.height;
    c.save();
    c.font = '16px Arial';

    cameraOffsetY -= difficulty * 0.1;
    
}

drawGame();
