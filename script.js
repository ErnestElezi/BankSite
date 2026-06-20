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
const ctx = canvas.getContext('2d');

// Simple drawing function to show the canvas is ready
function drawGame() {
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw welcome message
    ctx.fillStyle = '#FFA500';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 Game Area', canvas.width / 2, 50);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText('Canvas ready for game implementation', canvas.width / 2, canvas.height / 2);
}

drawGame();
