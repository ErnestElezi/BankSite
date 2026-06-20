function showPage(pageId) {
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
    event.target.closest('.nav-item').classList.add('active');
}

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
    let x , y;

    switch (event.type) {
        case "touchstart":
            input.touch_down = true;
    input.touch_change = true;
            break;
        case "touchend":
            input.touch_down = false;
    input.touch_change = true;
            break;
    }

      let touch = event.changedTouches[0];
      x = touch.clientX + offsets.x;
      y = touch.clientY - offsets.y

    input.touch = {x:x,y:y}
    
}

addEventListener("touchstart", handdleTouchEvent)

addEventListener("touchmove", handdleTouchEvent)

addEventListener("touchend",handdleTouchEvent)

const input = {
    touch:{
        x:0,
        y:0,
    },
    touch_down:false,
    touch_change : false,

}

// Simple drawing function to show the canvas is ready

class Player{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.w = 50;
        this.h = 80;
        this.g = 0.5;
        this.vx = 0;
        this.vy = 0;
        this.on_ground = false;
    }


    draw(){
        c.save();
        c.fillStyle = this.on_ground ? "red" : "green";
        c.fillRect(this.x,this.y,this.w,this.h);
        c.restore();
    }

    update(){


        if (this.y + this.vy + this.h >= canvas.height){
            this.on_ground = true;
            this.y = canvas.height - this.h;
        }else{
            this.on_ground = false
        }

        if (!this.on_ground) {
            this.vy += this.g;
        }else{
            this.vy = 0;
        }

        if (this.on_ground && input.touch_down && input.touch_change) {
            this.vy = -20;
            console.log(player);
            
        }


        this.x += this.vx;
        this.y += this.vy;

    }

}

const player = new Player(100,100);

function drawGame() {
    requestAnimationFrame(drawGame)
    
    if (!document.getElementById("game").classList.contains('active')) {
        return;
    }

    c.fillStyle = '#f9f9f9';
    c.fillRect(0, 0, canvas.width, canvas.height);


    c.beginPath()
    c.strokeStyle = input.touch_down ? "red" : "blue";
    c.arc(input.touch.x, input.touch.y,20,0,Math.PI*2,false);
    c.stroke()
    c.closePath();
        
    
    player.draw();
    player.update();



    // Draw border
    c.strokeStyle = '#ddd';
    c.lineWidth = 2;
    c.strokeRect(0, 0, canvas.width, canvas.height);

    input.touch_change = false;
}

drawGame();
