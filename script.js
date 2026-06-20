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

// Toggle functionality for settings
document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
    });
});

// Handle setting items click
document.querySelectorAll('.setting-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.querySelector('.toggle')) {
            this.querySelector('.toggle').click();
        }
    });
});

// Quest panel expansion
document.querySelectorAll('.quest-panel').forEach(panel => {
    panel.addEventListener('click', function(e) {
        // Don't toggle if clicking on checkbox
        if (e.target.classList.contains('step-checkbox')) {
            e.stopPropagation();
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

// Handle checkbox changes
document.querySelectorAll('.step-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function(e) {
        e.stopPropagation();
        const stepItem = this.parentElement;
        if (this.checked) {
            stepItem.style.opacity = '0.6';
        } else {
            stepItem.style.opacity = '1';
        }
    });
});

// Simple Game Canvas
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

console.log(canvas.offsetTop);

let offsets = canvas.getClientRects()[0]
console.log(offsets);


function handdleTouchEvent(event) {
    event.preventDefault();

    let x , y;

    let touch = event.changedTouches[0];
    const bounds = canvas.getBoundingClientRect();
    x = touch.clientX - bounds.left;
    y = touch.clientY - bounds.top;

    if (event.type !== "touchend" && (x < 0 || x > canvas.width || y < 0 || y > canvas.height)) {
        return;
    }

    switch (event.type) {
        case "touchstart":
            input.touch_down = true;
            input.touch_change = true;
            break;
        case "touchend":
            input.touch_down = false;
            input.touch_change = true;
            break;
        case "touchmove":
            break;
    }


    input.touch = {x:x,y:y}
    
}

addEventListener("touchstart", handdleTouchEvent, { passive: false })

addEventListener("touchmove", handdleTouchEvent, { passive: false })

addEventListener("touchend",handdleTouchEvent, { passive: false })

const input = {
    touch:{
        x:0,
        y:0,
    },
    touch_down:false,
    touch_change : false,

}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

const platforms = [
    { x: 0, y: canvas.height - 20, w: canvas.width, h: 20 },
    { x: 40, y: canvas.height - 120, w: 120, h: 14 },
    { x: 220, y: canvas.height - 190, w: 130, h: 14 },
    { x: 90, y: canvas.height - 280, w: 120, h: 14 },
    { x: 240, y: canvas.height - 380, w: 140, h: 14 },
    { x: 60, y: canvas.height - 470, w: 110, h: 14 },
];

const initialPlatformState = platforms.map(platform => ({ ...platform }));

let cameraOffsetY = 0;

function initGame() {
    cameraOffsetY = 0;

    input.touch.x = 0;
    input.touch.y = 0;
    input.touch_down = false;
    input.touch_change = false;

    for (let i = 0; i < platforms.length; i++) {
        Object.assign(platforms[i], initialPlatformState[i]);
    }

    player.x = 100;
    player.y = canvas.height - 80;
    player.vx = 0;
    player.vy = 0;
    player.on_ground = false;
    player.charge = 0;
}

function updateCamera(player) {
    const bottomQuarterLine = canvas.height * 0.75;
    cameraOffsetY = Math.min(cameraOffsetY, player.y - bottomQuarterLine);
}

function getFuturePos(player, time, gravity, touch) {
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const touchWorldY = touch.y + cameraOffsetY;
    const aimAngle = Math.atan2(touchWorldY - centerY, touch.x - centerX);
    const launchSpeed = player.charge * player.launch_power;
    const vx = Math.cos(aimAngle) * launchSpeed;
    const vy = Math.sin(aimAngle) * launchSpeed;


    return {
        x: player.x + vx * time,
        y: player.y + vy * time  + 0.5 * gravity * (time) * (time)
    };
    
}

function drawFuturePositions(player,steps){
    if (player.charge <= 0) return;
    for (let i = 0; i < steps; i++) {
        
        let futurePos = getFuturePos(player, i, player.g, input.touch);
        c.beginPath()
    c.save();
    c.translate(0, -cameraOffsetY);
        c.strokeStyle = "rgba(0,0,0,0.5)";
        c.arc(futurePos.x + player.w/2, futurePos.y + player.h/2,5,0,Math.PI*2,false);
        c.stroke()
    c.restore();
        c.closePath();
    }


}

class Player{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 60;
        this.g = 0.5;
        this.vx = 0;
        this.vy = 0;
        this.on_ground = false;
        this.friction = 0.9;
        this.charge = 0;
        this.max_charge = 1;
        this.charge_rate = 1/ 90;
        this.launch_power = 20;
    }


    draw(){
        c.save();
        c.fillStyle = this.on_ground ? "red" : "green";
        c.fillRect(this.x, this.y - cameraOffsetY, this.w, this.h);
        c.restore();

    for (const platform of platforms) {
        c.fillStyle = "#c9a86a";
        c.fillRect(platform.x, platform.y - cameraOffsetY, platform.w, platform.h);
    }
    }

    update(){

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

            if( platform.y + cameraOffsetY > canvas.height){
                console.log("repositioning platform")
                platform.y = canvas.height - cameraOffsetY + 20;
                plafrom.x = Math.random() * (canvas.width - platform.w);
            }

                console.log(platform.y + cameraOffsetY)
        }

        if (!this.on_ground && nextY > previousY && nextY + this.h >= canvas.height) {
            nextY = canvas.height - this.h;
            this.vy = 0;
            this.on_ground = true;
        }

        if (this.on_ground && input.touch_down) {
            this.charge = clamp(this.charge + this.charge_rate, 0, this.max_charge);
        }

        if (this.on_ground && !input.touch_down && input.touch_change && this.charge > 0) {
            const centerX = this.x + this.w / 2;
            const centerY = this.y + this.h / 2;
            const aimX = input.touch.x - centerX;
            const aimY = (input.touch.y + cameraOffsetY) - centerY;
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

        this.vx *= this.on_ground ? this.friction: 1
        this.vy *= 0.99

    }

}

const player = new Player(100, canvas.height - 80);

initGame();

function drawGame() {
    requestAnimationFrame(drawGame)
    
    if (!document.getElementById("game").classList.contains('active')) {
        return;
    }

    c.fillStyle = '#f9f9f9';
    c.fillRect(0, 0, canvas.width, canvas.height);

    updateCamera(player);



    c.beginPath()
    c.strokeStyle = input.touch_down ? "red" : "blue";
    c.arc(input.touch.x, input.touch.y,20,0,Math.PI*2,false);
    c.stroke()
    c.closePath();

    const meterX = 20;
    const meterY = 20;
    const meterWidth = 150;
    const meterHeight = 10;
    const meterFill = player.charge / player.max_charge;

    c.fillStyle = "rgba(0, 0, 0, 0.15)";
    c.fillRect(meterX, meterY, meterWidth, meterHeight);
    c.fillStyle = input.touch_down ? "#ff6b6b" : "#FFD700";
    c.fillRect(meterX, meterY, meterWidth * meterFill, meterHeight);
    c.strokeStyle = "rgba(0, 0, 0, 0.2)";
    c.strokeRect(meterX, meterY, meterWidth, meterHeight);


        
    
    player.draw();
    player.update();

    drawFuturePositions(player,20);


    // Draw border
    c.strokeStyle = '#ddd';
    c.lineWidth = 2;
    c.strokeRect(0, 0, canvas.width, canvas.height);

    input.touch_change = false;
}

drawGame();
