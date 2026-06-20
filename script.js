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

// Simple Game Canvas
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

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

let platforms = [
    { x: canvas.width / 2 - 50, y: canvas.height - 20, w: 100, h: 14 },
    { x: 40, y: canvas.height - 120, w: 120, h: 14 },
    { x: 220, y: canvas.height - 190, w: 130, h: 14 },
    { x: 90, y: canvas.height - 280, w: 120, h: 14 },
    { x: 240, y: canvas.height - 380, w: 140, h: 14 },
    { x: 60, y: canvas.height - 470, w: 110, h: 14 },
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

function initGame() {
    cameraOffsetY = 0;

    input.pointer.x = 0;
    input.pointer.y = 0;
    input.pointer_down = false;
    input.pointer_change = false;

    platforms = initialPlatformState.map(platform => ({ ...platform }));
    resetPlatforms();

    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 80;
    player.vx = 0;
    player.vy = 0;
    player.on_ground = false;
    player.charge = 0;
}

function updateCamera(player) {
    const bottomQuarterLine = canvas.height * 0.60;
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
        this.w = 30;
        this.h = 60;
        this.g = 0.5;
        this.vx = 0;
        this.vy = 0;
        this.on_ground = false;
        this.friction = 0.5;
        this.charge = 0;
        this.max_charge = 1;
        this.charge_rate = 1 / 60;
        this.launch_power = 20;
    }

    draw() {
        c.save();
        c.fillStyle = this.on_ground ? 'red' : 'green';
        c.fillRect(this.x, this.y - cameraOffsetY, this.w, this.h);
        c.restore();
    }

    update() {
        const wasOnGround = this.on_ground;
        const previousY = this.y;

        this.on_ground = false;

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
            const crossedTop = previousY + this.h <= platform.y && nextY + this.h >= platform.y;

            if (movingDown && horizontallyOverlapping && crossedTop) {
                nextY = platform.y - this.h;
                this.vy = 0;
                this.on_ground = true;
                break;
            }

            if (platform.y - cameraOffsetY > canvas.height + 30) {
                platform.y = cameraOffsetY - platform.h - 30 + (Math.random() * 100 - 50);
                platform.x = Math.random() * (canvas.width - platform.w);
            }
        }

        if (!this.on_ground && nextY > previousY && nextY + this.h > canvas.height + 1) {
            nextY = canvas.height - this.h;
            this.vy = 0;
            this.on_ground = true;
        }

        if (this.on_ground && input.pointer_down) {
            this.charge = clamp(this.charge + this.charge_rate, 0, this.max_charge);
        }

        if (this.on_ground && !input.pointer_down && input.pointer_change && this.charge > 0) {
            const centerX = this.x + this.w / 2;
            const centerY = this.y + this.h / 2;
            const aimX = input.pointer.x - centerX;
            const aimY = input.pointer.y + cameraOffsetY - centerY;
            const aimAngle = Math.atan2(aimY, aimX);
            const launchSpeed = this.charge * this.launch_power;

            this.vx = Math.cos(aimAngle) * launchSpeed;
            this.vy = Math.sin(aimAngle) * launchSpeed;
            this.charge = 0;

            nextX = this.x + this.vx;
            nextY = this.y + this.vy;
            this.on_ground = false;
        }

        this.x = nextX;
        this.y = nextY;

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

    c.fillStyle = '#f9f9f9';
    c.fillRect(0, 0, canvas.width, canvas.height);

    updateCamera(player);

    for (const platform of platforms) {
        c.fillStyle = '#c9a86a';
        c.fillRect(platform.x, platform.y - cameraOffsetY, platform.w, platform.h);
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
    console.log(platforms.length);
    
}

drawGame();
