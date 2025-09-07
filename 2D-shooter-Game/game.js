// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speed: 2,
    bulletSpeed: 5,
    bullets: [],
    color: '#ffffff',
    health: 100,
    invincible: false,
    extraLife: false,
    money: 2000,
    currentWeapon: 'plasmaRifle',
    weapons: {
        plasmaRifle: { name: 'Plasma Rifle', damage: 18, fireRate: 400, bulletSpeed: 9, cost: 0, owned: true },
        rocketLauncher: { name: 'Rocket Launcher', damage: 25, fireRate: 1200, bulletSpeed: 6, cost: 2000, owned: false, explosive: true },
        laserCannon: { name: 'Laser Cannon', damage: 20, fireRate: 200, bulletSpeed: 10, cost: 1800, owned: false },
        flamethrower: { name: 'Flamethrower', damage: 6, fireRate: 100, bulletSpeed: 4, cost: 1600, owned: false, spread: 3 },
        railgun: { name: 'Railgun', damage: 30, fireRate: 1500, bulletSpeed: 12, cost: 2500, owned: false },
        grenadeLauncher: { name: 'Grenade Launcher', damage: 22, fireRate: 1000, bulletSpeed: 5, cost: 1700, owned: false, explosive: true },
        teslaGun: { name: 'Tesla Gun', damage: 16, fireRate: 350, bulletSpeed: 8, cost: 1400, owned: false, chain: true },
        cryoGun: { name: 'Cryo Gun', damage: 14, fireRate: 300, bulletSpeed: 7, cost: 1300, owned: false, freeze: true },
        acidGun: { name: 'Acid Gun', damage: 12, fireRate: 250, bulletSpeed: 6, cost: 1200, owned: false, poison: true },
        gravityGun: { name: 'Gravity Gun', damage: 10, fireRate: 500, bulletSpeed: 5, cost: 1100, owned: false, pull: true }
    }
};

// Shop pagination variables
let currentPage = 1;
const weaponsPerPage = 6;
const totalWeapons = Object.keys(player.weapons).length;

// Game State Variables
let bots = [];
const botCount = 5;
const powerUps = [];
let powerUpSpawnInterval;
let botsKilled = 0;
let bossSpawned = false;
let gameRunning = false;

// Powerup descriptions for tooltips
const powerUpDescriptions = {
    health: 'Restores 20 health points',
    speed: 'Increases movement speed for 5 seconds',
    bulletSpeed: 'Increases bullet speed for 5 seconds',
    invincibility: 'Makes you invincible for 5 seconds',
    shield: 'Makes you invincible for 10 seconds',
    doubleDamage: 'Doubles weapon damage for 5 seconds',
    extraLife: 'Grants an extra life when you die',
    rapidFire: 'Increases fire rate for 8 seconds',
    freezeTime: 'Freezes all bots for 3 seconds',
    teleport: 'Teleports you to a random location',
    bomb: 'Kills all bots within 150 units',
    healOverTime: 'Heals 5 health per second for 10 seconds',
    tripleShot: 'Fires 3 bullets at once for 6 seconds',
    explosiveBullets: 'Bullets explode on impact for 7 seconds',
    lifeSteal: 'Steals health from damaged bots for 8 seconds',
    timeSlow: 'Slows down all bots for 4 seconds',
    chainLightning: 'Bullets chain to nearby bots for 5 seconds',
    shieldBash: 'Pushes nearby bots away',
    vampireMode: 'Steals health from all damaged enemies for 10 seconds',
    goldenBullet: 'Bullets deal 3x damage for 3 seconds',
    timeWarp: 'Reverses bot movement for 3 seconds',
    blackHole: 'Pulls nearby bots toward you'
};

// Performance optimization variables
let lastTime = 0;
const FPS = 120;
const frameTime = 1000 / FPS;

// Input Variables
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let mouseX = 0;
let mouseY = 0;
let mouseXCanvas = null;
let mouseYCanvas = null;
let isMouseDown = false;
let lastShotTime = 0;

// Bot Spawning Functions
function spawnBot() {
    bots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.8,
        bullets: [],
        health: 50,
        maxHealth: 50,
        isBoss: false
    });
}

function spawnBoss() {
    bots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5,
        bullets: [],
        health: 500,
        maxHealth: 500,
        isBoss: true,
        size: 30
    });
}

// Power-up Spawning with more variety
function spawnPowerUp() {
    const types = [
        'health', 'speed', 'bulletSpeed', 'invincibility', 'shield', 'doubleDamage',
        'extraLife', 'rapidFire', 'freezeTime', 'teleport', 'bomb', 'healOverTime',
        'tripleShot', 'explosiveBullets', 'lifeSteal', 'timeSlow', 'chainLightning',
        'shieldBash', 'vampireMode', 'goldenBullet', 'timeWarp', 'blackHole'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        type: type
    });
}

// Initialize bots
function initializeBots() {
    bots = [];
    for (let i = 0; i < botCount; i++) {
        spawnBot();
    }
}

// Input Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'd') keys.d = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'd') keys.d = false;
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // If we're in the game, also set canvas coordinates
    if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        mouseXCanvas = e.clientX - rect.left;
        mouseYCanvas = e.clientY - rect.top;
    }
});

// Power-up hover detection for tooltips
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseXCanvas = e.clientX - rect.left;
    mouseYCanvas = e.clientY - rect.top;
    
    // Check if hovering over any power-up
    let hoveredPowerUp = null;
    
    if (mouseXCanvas !== null && mouseYCanvas !== null) {
        for (let i = 0; i < powerUps.length; i++) {
            const powerUp = powerUps[i];
            if (mouseXCanvas > powerUp.x - 25 && mouseXCanvas < powerUp.x + 25 &&
                mouseYCanvas > powerUp.y - 25 && mouseYCanvas < powerUp.y + 25) {
                hoveredPowerUp = powerUp;
                break;
            }
        }
    }
    
    // Update tooltip
    const tooltip = document.getElementById('tooltip');
    if (hoveredPowerUp) {
        const description = powerUpDescriptions[hoveredPowerUp.type] || hoveredPowerUp.type;
        const powerUpName = hoveredPowerUp.type.charAt(0).toUpperCase() + hoveredPowerUp.type.slice(1);

        tooltip.innerHTML = `<strong>${powerUpName}</strong><br>${description}`;
        tooltip.style.display = 'block';

        // Smart positioning to avoid going off screen
        const tooltipWidth = 250;
        const tooltipHeight = 80;
        let left = e.clientX + 15;
        let top = e.clientY + 15;

        if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - 15;
        }
        if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - 15;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    } else {
        tooltip.style.display = 'none';
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && gameRunning) {
        isMouseDown = true;
        shoot();
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isMouseDown = false;
    }
});

// Shooting Function with performance optimization
function shoot() {
    const currentTime = Date.now();
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    const weapon = player.weapons[player.currentWeapon];
    
    if (weapon.name === 'Flamethrower') {
        // Flamethrower fires multiple bullets in a spread
        for (let i = -weapon.spread; i <= weapon.spread; i += weapon.spread) {
            const spreadAngle = angle + (i * Math.PI / 180);
            player.bullets.push({
                x: player.x,
                y: player.y,
                speed: weapon.bulletSpeed,
                angle: spreadAngle,
                damage: weapon.damage,
                explosive: player.explosiveBullets || weapon.explosive || false,
                chainLightning: player.chainLightning || weapon.chain || false,
                golden: player.goldenBullet || false,
                poison: player.poisonBullets || weapon.poison || false,
                freeze: weapon.freeze || false,
                pull: weapon.pull || false
            });
        }
    } else {
        // Regular weapon fires single bullet
        player.bullets.push({
            x: player.x,
            y: player.y,
            speed: weapon.bulletSpeed,
            angle: angle,
            damage: weapon.damage,
            explosive: player.explosiveBullets || weapon.explosive || false,
            chainLightning: player.chainLightning || weapon.chain || false,
            golden: player.goldenBullet || false,
            poison: player.poisonBullets || weapon.poison || false,
            freeze: weapon.freeze || false,
            pull: weapon.pull || false
        });
    }
    
    // Triple shot effect
    if (player.tripleShot) {
        const spread = 15 * Math.PI / 180;
        player.bullets.push({
            x: player.x,
            y: player.y,
            speed: weapon.bulletSpeed,
            angle: angle + spread,
            damage: weapon.damage,
            explosive: player.explosiveBullets || weapon.explosive || false,
            chainLightning: player.chainLightning || weapon.chain || false,
            golden: player.goldenBullet || false,
            poison: player.poisonBullets || weapon.poison || false,
            freeze: weapon.freeze || false,
            pull: weapon.pull || false
        });
        player.bullets.push({
            x: player.x,
            y: player.y,
            speed: weapon.bulletSpeed,
            angle: angle - spread,
            damage: weapon.damage,
            explosive: player.explosiveBullets || weapon.explosive || false,
            chainLightning: player.chainLightning || weapon.chain || false,
            golden: player.goldenBullet || false,
            poison: player.poisonBullets || weapon.poison || false,
            freeze: weapon.freeze || false,
            pull: weapon.pull || false
        });
    }
    
    lastShotTime = currentTime;
}

// Game Update Function with performance optimization
function update(deltaTime) {
    // Player movement
    if (keys.w) player.y -= player.speed;
    if (keys.a) player.x -= player.speed;
    if (keys.s) player.y += player.speed;
    if (keys.d) player.x += player.speed;

    // Continuous shooting when mouse is held down
    if (isMouseDown && gameRunning) {
        const currentTime = Date.now();
        const weapon = player.weapons[player.currentWeapon];
        const fireRate = player.rapidFire ? weapon.fireRate * 0.5 : weapon.fireRate;
        
        if (currentTime - lastShotTime > fireRate) {
            shoot();
        }
    }

    // Keep player within canvas bounds
    player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
    player.y = Math.max(10, Math.min(canvas.height - 10, player.y));

    // Update player bullets with performance optimization
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.speed * Math.cos(bullet.angle);
        bullet.y += bullet.speed * Math.sin(bullet.angle);
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            player.bullets.splice(i, 1);
        }
    }

    // Update bots with performance optimization
    for (let i = bots.length - 1; i >= 0; i--) {
        const bot = bots[i];
        
        // Skip frozen bots
        if (bot.frozen) continue;
        
        // Bot movement
        if (bot.timeWarped) {
            // Reverse movement for time warp effect
            if (bot.x < player.x) bot.x -= bot.speed;
            if (bot.x > player.x) bot.x += bot.speed;
            if (bot.y < player.y) bot.y -= bot.speed;
            if (bot.y > player.y) bot.y += bot.speed;
        } else {
            // Normal movement
            if (bot.x < player.x) bot.x += bot.speed;
            if (bot.x > player.x) bot.x -= bot.speed;
            if (bot.y < player.y) bot.y += bot.speed;
            if (bot.y > player.y) bot.y -= bot.speed;
        }

        // Bot shooting logic
        const shootChance = bot.isBoss ? 0.02 : 0.005;
        if (Math.random() < shootChance) {
            const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
            bot.bullets.push({
                x: bot.x,
                y: bot.y,
                speed: bot.isBoss ? 4 : 3,
                angle: angle,
                damage: bot.isBoss ? 20 : 10
            });
        }

        // Update bot bullets
        for (let j = bot.bullets.length - 1; j >= 0; j--) {
            const bullet = bot.bullets[j];
            bullet.x += bullet.speed * Math.cos(bullet.angle);
            bullet.y += bullet.speed * Math.sin(bullet.angle);
            
            if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
                bot.bullets.splice(j, 1);
                continue;
            }

            // Check if bot bullets hit player
            if (!player.invincible && bullet.x > player.x - 10 && bullet.x < player.x + 10 &&
                bullet.y > player.y - 10 && bullet.y < player.y + 10) {
                const damage = bullet.damage || 10;
                player.health -= damage;
                bot.bullets.splice(j, 1);
                updateHealthBar();
                if (player.health <= 0) {
                    if (player.extraLife) {
                        respawnPlayer();
                    } else {
                        gameOver();
                    }
                }
            }
        }

        // Check if player bullets hit bots
        for (let j = player.bullets.length - 1; j >= 0; j--) {
            const playerBullet = player.bullets[j];
            const botSize = bot.isBoss ? bot.size : 10;
            
            if (playerBullet.x > bot.x - botSize && playerBullet.x < bot.x + botSize &&
                playerBullet.y > bot.y - botSize && playerBullet.y < bot.y + botSize) {
                
                // Apply weapon damage
                let damage = playerBullet.damage || 1;
                if (player.doubleDamage) {
                    damage *= 2;
                }
                
                // Golden bullet effect
                if (playerBullet.golden) {
                    damage *= 3;
                }
                
                // Reduce bot health
                bot.health -= damage;
                player.bullets.splice(j, 1);
                
                // Life steal effect
                if (player.lifeSteal && player.health < 100) {
                    player.health = Math.min(player.health + Math.floor(damage * 0.3), 100);
                    updateHealthBar();
                }
                
                // Vampire mode effect (steals health from all damaged enemies)
                if (player.vampireMode && player.health < 100) {
                    player.health = Math.min(player.health + Math.floor(damage * 0.5), 100);
                    updateHealthBar();
                }
                
                // Check if bot is dead
                if (bot.health <= 0) {
                    bots.splice(i, 1);
                    
                    if (bot.isBoss) {
                        player.money += 100;
                        bossSpawned = false;
                    } else {
                        player.money += 50;
                        botsKilled++;
                        
                        // Check if boss should spawn (every 20 kills)
                        if (botsKilled % 20 === 0 && !bossSpawned) {
                            setTimeout(() => {
                                spawnBoss();
                                bossSpawned = true;
                                
                                // Show boss notification
                                const bossNotification = document.getElementById('bossNotification');
                                bossNotification.style.display = 'block';
                                setTimeout(() => {
                                    bossNotification.style.display = 'none';
                                }, 3000);
                            }, 2000);
                        }
                    }
                    
                    updateWeaponDisplay();
                    updateKillCounter();
                    setTimeout(spawnBot, 3000);
                    break;
                }
            }
        }
    }

    // Check if player collects power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (player.x > powerUp.x - 10 && player.x < powerUp.x + 10 &&
            player.y > powerUp.y - 10 && player.y < powerUp.y + 10) {
            
            if (powerUp.type === 'health') {
                player.health = Math.min(player.health + 20, 100);
            } else if (powerUp.type === 'speed') {
                player.speed += 1;
                setTimeout(() => {
                    player.speed -= 1;
                }, 5000);
            } else if (powerUp.type === 'bulletSpeed') {
                player.bulletSpeed = 10;
                setTimeout(() => {
                    player.bulletSpeed = 5;
                }, 5000);
            } else if (powerUp.type === 'invincibility') {
                player.invincible = true;
                setTimeout(() => {
                    player.invincible = false;
                }, 5000);
            } else if (powerUp.type === 'shield') {
                player.invincible = true;
                setTimeout(() => {
                    player.invincible = false;
                }, 10000);
            } else if (powerUp.type === 'doubleDamage') {
                player.doubleDamage = true;
                setTimeout(() => {
                    player.doubleDamage = false;
                }, 5000);
            } else if (powerUp.type === 'extraLife') {
                player.extraLife = true;
            } else if (powerUp.type === 'rapidFire') {
                player.rapidFire = true;
                setTimeout(() => {
                    player.rapidFire = false;
                }, 8000);
            } else if (powerUp.type === 'freezeTime') {
                // Freeze all bots for 3 seconds
                bots.forEach(bot => {
                    bot.frozen = true;
                    bot.originalSpeed = bot.speed;
                    bot.speed = 0;
                });
                setTimeout(() => {
                    bots.forEach(bot => {
                        if (bot.frozen) {
                            bot.frozen = false;
                            bot.speed = bot.originalSpeed;
                        }
                    });
                }, 3000);
            } else if (powerUp.type === 'teleport') {
                // Teleport to a random location
                player.x = Math.random() * (canvas.width - 20) + 10;
                player.y = Math.random() * (canvas.height - 20) + 10;
            } else if (powerUp.type === 'bomb') {
                // Kill all bots within a certain radius
                for (let i = bots.length - 1; i >= 0; i--) {
                    const bot = bots[i];
                    const distance = Math.sqrt((bot.x - player.x) ** 2 + (bot.y - player.y) ** 2);
                    if (distance < 150) {
                        bots.splice(i, 1);
                        setTimeout(spawnBot, 3000);
                    }
                }
            } else if (powerUp.type === 'healOverTime') {
                // Heal 5 health per second for 10 seconds
                const healInterval = setInterval(() => {
                    if (player.health < 100) {
                        player.health = Math.min(player.health + 5, 100);
                        updateHealthBar();
                    }
                }, 1000);
                setTimeout(() => clearInterval(healInterval), 10000);
            } else if (powerUp.type === 'tripleShot') {
                player.tripleShot = true;
                setTimeout(() => {
                    player.tripleShot = false;
                }, 6000);
            } else if (powerUp.type === 'explosiveBullets') {
                player.explosiveBullets = true;
                setTimeout(() => {
                    player.explosiveBullets = false;
                }, 7000);
            } else if (powerUp.type === 'lifeSteal') {
                player.lifeSteal = true;
                setTimeout(() => {
                    player.lifeSteal = false;
                }, 8000);
            } else if (powerUp.type === 'timeSlow') {
                // Slow down all bots for 4 seconds
                bots.forEach(bot => {
                    bot.originalSpeed = bot.speed;
                    bot.speed *= 0.3;
                });
                setTimeout(() => {
                    bots.forEach(bot => {
                        if (bot.originalSpeed) {
                            bot.speed = bot.originalSpeed;
                        }
                    });
                }, 4000);
            } else if (powerUp.type === 'chainLightning') {
                player.chainLightning = true;
                setTimeout(() => {
                    player.chainLightning = false;
                }, 5000);
            } else if (powerUp.type === 'shieldBash') {
                // Push nearby bots away
                bots.forEach(bot => {
                    const distance = Math.sqrt((bot.x - player.x) ** 2 + (bot.y - player.y) ** 2);
                    if (distance < 100) {
                        const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
                        bot.x += Math.cos(angle) * 50;
                        bot.y += Math.sin(angle) * 50;
                    }
                });
            } else if (powerUp.type === 'vampireMode') {
                player.vampireMode = true;
                setTimeout(() => {
                    player.vampireMode = false;
                }, 10000);
            } else if (powerUp.type === 'goldenBullet') {
                player.goldenBullet = true;
                setTimeout(() => {
                    player.goldenBullet = false;
                }, 3000);
            } else if (powerUp.type === 'timeWarp') {
                // Reverse bot movement for 3 seconds
                bots.forEach(bot => {
                    bot.timeWarped = true;
                    bot.originalSpeed = bot.speed;
                    bot.speed *= -1;
                });
                setTimeout(() => {
                    bots.forEach(bot => {
                        if (bot.timeWarped) {
                            bot.speed = bot.originalSpeed;
                            bot.timeWarped = false;
                        }
                    });
                }, 3000);
            } else if (powerUp.type === 'blackHole') {
                // Pull nearby bots toward player
                const pullInterval = setInterval(() => {
                    bots.forEach(bot => {
                        const distance = Math.sqrt((bot.x - player.x) ** 2 + (bot.y - player.y) ** 2);
                        if (distance < 200 && distance > 20) {
                            const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
                            bot.x += Math.cos(angle) * 2;
                            bot.y += Math.sin(angle) * 2;
                        }
                    });
                }, 50);
                setTimeout(() => clearInterval(pullInterval), 5000);
            }
            
            powerUps.splice(i, 1);
            updateHealthBar();
        }
    }
}

// Drawing Functions with performance optimization
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    if (player.ghostMode) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#c0c0c0';
    } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = player.invincible ? '#ffff00' : player.color;
    }
    ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
    ctx.globalAlpha = 1.0;
    drawGun(player.x, player.y, mouseX, mouseY, player.color);

    // Draw player bullets
    player.bullets.forEach(bullet => {
        if (bullet.golden) {
            ctx.fillStyle = '#ffd700';
        } else if (bullet.explosive) {
            ctx.fillStyle = '#ff4500';
        } else if (bullet.chainLightning) {
            ctx.fillStyle = '#00ffff';
        } else if (bullet.poison) {
            ctx.fillStyle = '#00ff80';
        } else if (bullet.freeze) {
            ctx.fillStyle = '#80ffff';
        } else if (bullet.pull) {
            ctx.fillStyle = '#4000ff';
        } else {
            ctx.fillStyle = 'red';
        }
        ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
    });

    // Draw bots
    bots.forEach(bot => {
        const botSize = bot.isBoss ? bot.size : 10;
        const botColor = bot.isBoss ? '#ff0000' : 'blue';
        
        // Draw bot body
        ctx.fillStyle = botColor;
        ctx.fillRect(bot.x - botSize, bot.y - botSize, botSize * 2, botSize * 2);
        
        // Draw bot gun
        drawGun(bot.x, bot.y, player.x, player.y, botColor);

        // Draw health bar
        const healthBarWidth = botSize * 2;
        const healthBarHeight = 4;
        const healthBarY = bot.y - botSize - 10;
        
        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(bot.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar fill
        const healthPercentage = bot.health / bot.maxHealth;
        ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(bot.x - healthBarWidth/2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Health bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(bot.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);

        // Draw bot bullets
        bot.bullets.forEach(bullet => {
            ctx.fillStyle = bot.isBoss ? '#ff6666' : 'yellow';
            ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
        });
    });

    // Draw power-ups with new colors and enhanced visibility
    let hoveredPowerUp = null;
    
    // First pass: check for hover
    powerUps.forEach(powerUp => {
        if (mouseXCanvas !== null && mouseYCanvas !== null &&
            mouseXCanvas > powerUp.x - 25 && mouseXCanvas < powerUp.x + 25 &&
            mouseYCanvas > powerUp.y - 25 && mouseYCanvas < powerUp.y + 25) {
            hoveredPowerUp = powerUp;
        }
    });
    
    // Second pass: draw powerups
    powerUps.forEach(powerUp => {
        const powerUpColor = powerUp.type === 'health' ? 'green' :
                        powerUp.type === 'speed' ? 'purple' :
                        powerUp.type === 'bulletSpeed' ? 'orange' :
                        powerUp.type === 'invincibility' ? 'cyan' :
                        powerUp.type === 'shield' ? 'blue' :
                        powerUp.type === 'doubleDamage' ? 'red' :
                        powerUp.type === 'rapidFire' ? '#ff69b4' :
                        powerUp.type === 'freezeTime' ? '#87ceeb' :
                        powerUp.type === 'teleport' ? '#9370db' :
                        powerUp.type === 'bomb' ? '#8b0000' :
                        powerUp.type === 'healOverTime' ? '#32cd32' :
                        powerUp.type === 'tripleShot' ? '#ff1493' :
                        powerUp.type === 'explosiveBullets' ? '#ff4500' :
                        powerUp.type === 'lifeSteal' ? '#ff6347' :
                        powerUp.type === 'timeSlow' ? '#4169e1' :
                        powerUp.type === 'chainLightning' ? '#00ffff' :
                        powerUp.type === 'shieldBash' ? '#ffd700' :
                        powerUp.type === 'vampireMode' ? '#8b0000' :
                        powerUp.type === 'goldenBullet' ? '#ffd700' :
                        powerUp.type === 'timeWarp' ? '#9932cc' :
                        powerUp.type === 'blackHole' ? '#000000' : 'gold';
        
        // Draw power-up with a glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = powerUpColor;
        ctx.fillStyle = powerUpColor;
        ctx.fillRect(powerUp.x - 10, powerUp.y - 10, 20, 20);
        ctx.shadowBlur = 0;
        
        // Draw outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(powerUp.x - 10, powerUp.y - 10, 20, 20);

        // Draw highlight for hovered powerup
        if (hoveredPowerUp === powerUp) {
            // Draw highlight circle around hovered power-up
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Add a pulsing effect
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, 30, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // Update tooltip
    const tooltip = document.getElementById('tooltip');
    if (hoveredPowerUp) {
        const description = powerUpDescriptions[hoveredPowerUp.type] || hoveredPowerUp.type;
        const powerUpName = hoveredPowerUp.type.charAt(0).toUpperCase() + hoveredPowerUp.type.slice(1);

        tooltip.innerHTML = `<strong>${powerUpName}</strong><br>${description}`;
        tooltip.style.display = 'block';

        // Smart positioning to avoid going off screen
        const tooltipWidth = 250;
        const tooltipHeight = 80;
        let left = mouseX + 15;
        let top = mouseY + 15;

        if (left + tooltipWidth > window.innerWidth) {
            left = mouseX - tooltipWidth - 15;
        }
        if (top + tooltipHeight > window.innerHeight) {
            top = mouseY - tooltipHeight - 15;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    } else {
        tooltip.style.display = 'none';
    }
}

function drawGun(x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const gunLength = 20;
    const gunWidth = 4;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.fillRect(0, -gunWidth / 2, gunLength, gunWidth);
    ctx.restore();
}

// UI Update Functions
function updateHealthBar() {
    const healthBar = document.getElementById('healthBar');
    healthBar.style.width = `${player.health * 2}px`;
}

function updateWeaponDisplay() {
    const weaponDisplay = document.getElementById('weaponDisplay');
    const moneyDisplay = document.getElementById('moneyDisplay');
    const weapon = player.weapons[player.currentWeapon];
    
    weaponDisplay.textContent = `Weapon: ${weapon.name}`;
    moneyDisplay.textContent = `Money: $${player.money}`;
}

function updateKillCounter() {
    const killCounter = document.getElementById('killCounter');
    killCounter.textContent = `Kills: ${botsKilled}`;
}

// Game Functions
function respawnPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    player.extraLife = false;
    updateHealthBar();
}

function gameOver() {
    gameRunning = false;
    clearInterval(powerUpSpawnInterval);
    
    // Create game over overlay
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'gameOver';
    gameOverDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        z-index: 1000;
    `;
    
    gameOverDiv.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 20px;">GAME OVER</h1>
        <p style="font-size: 1.5rem; margin-bottom: 30px;">Kills: ${botsKilled}</p>
        <p style="font-size: 1.5rem; margin-bottom: 30px;">Money: $${player.money}</p>
        <div>
            <button id="restartButton" style="background-color: #444; color: white; padding: 15px 30px; font-size: 1.2rem; border: none; cursor: pointer; margin-right: 20px;">Restart</button>
            <button id="menuButton" style="background-color: #444; color: white; padding: 15px 30px; font-size: 1.2rem; border: none; cursor: pointer;">Back to Menu</button>
        </div>
    `;
    
    document.body.appendChild(gameOverDiv);
    
    // Add event listeners to buttons
    document.getElementById('restartButton').addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        restartGame();
    });
    
    document.getElementById('menuButton').addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        backToMenu();
    });
}

function restartGame() {
    // Reset game state but keep money and weapons
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    player.bullets = [];
    player.invincible = false;
    player.extraLife = false;
    
    // Reset other game state
    bots = [];
    powerUps.length = 0;
    botsKilled = 0;
    bossSpawned = false;
    
    // Initialize bots
    initializeBots();
    
    // Start game
    gameRunning = true;
    powerUpSpawnInterval = setInterval(spawnPowerUp, 5000);
    updateHealthBar();
    updateKillCounter();
}

function backToMenu() {
    // Hide game elements
    canvas.style.display = 'none';
    document.getElementById('healthBar').style.display = 'none';
    document.getElementById('weaponDisplay').style.display = 'none';
    document.getElementById('moneyDisplay').style.display = 'none';
    document.getElementById('killCounter').style.display = 'none';
    
    // Show menu
    document.getElementById('menu').style.display = 'block';
}

// Performance optimized game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= frameTime && gameRunning) {
        update(deltaTime);
        draw();
        lastTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    canvas.style.display = 'block';
    document.getElementById('healthBar').style.display = 'block';
    document.getElementById('weaponDisplay').style.display = 'block';
    document.getElementById('moneyDisplay').style.display = 'block';
    document.getElementById('killCounter').style.display = 'block';
    
    // Reset game state
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    player.bullets = [];
    player.invincible = false;
    player.extraLife = false;
    
    // Reset other game state
    bots = [];
    powerUps.length = 0;
    botsKilled = 0;
    bossSpawned = false;
    
    // Initialize bots
    initializeBots();
    
    // Start game
    gameRunning = true;
    updateWeaponDisplay();
    updateKillCounter();
    powerUpSpawnInterval = setInterval(spawnPowerUp, 5000);
}

// Shop Functions with Pagination
function populateShop() {
    const weaponList = document.getElementById('weaponList');
    const moneyDisplay = document.getElementById('shopMoneyDisplay');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    weaponList.innerHTML = '';
    moneyDisplay.textContent = player.money;

    // Get all weapon keys
    const weaponKeys = Object.keys(player.weapons);
    
    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * weaponsPerPage;
    const endIndex = Math.min(startIndex + weaponsPerPage, weaponKeys.length);
    
    // Update page info
    const totalPages = Math.ceil(weaponKeys.length / weaponsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Show/hide navigation buttons
    prevButton.style.display = currentPage > 1 ? 'block' : 'none';
    nextButton.style.display = currentPage < totalPages ? 'block' : 'none';
    
    // Add weapons for current page
    for (let i = startIndex; i < endIndex; i++) {
        const weaponKey = weaponKeys[i];
        const weapon = player.weapons[weaponKey];
            
        const isOwned = weapon.owned;
        const isEquipped = player.currentWeapon === weaponKey;
        const canAfford = player.money >= weapon.cost;
        
        // Add special weapon effects to description
        let specialEffects = '';
        if (weapon.explosive) specialEffects += '<p style="color: #ff6b6b; margin: 2px 0; font-size: 12px;">💥 Explosive</p>';
        if (weapon.chain) specialEffects += '<p style="color: #00ffff; margin: 2px 0; font-size: 12px;">⚡ Chain Lightning</p>';
        if (weapon.freeze) specialEffects += '<p style="color: #80ffff; margin: 2px 0; font-size: 12px;">❄️ Freeze</p>';
        if (weapon.poison) specialEffects += '<p style="color: #00ff80; margin: 2px 0; font-size: 12px;">☠️ Poison</p>';
        if (weapon.pull) specialEffects += '<p style="color: #4000ff; margin: 2px 0; font-size: 12px;">🌀 Gravity Pull</p>';
        if (weapon.spread) specialEffects += `<p style="color: #ffa500; margin: 2px 0; font-size: 12px;">🔊 Spread: ${weapon.spread}°</p>`;
        
        const weaponDiv = document.createElement('div');
        weaponDiv.className = 'weapon-item';
        weaponDiv.innerHTML = `
            <h3>${weapon.name}</h3>
            <p>Damage: ${weapon.damage}</p>
            <p>Fire Rate: ${weapon.fireRate}ms</p>
            <p>Bullet Speed: ${weapon.bulletSpeed}</p>
            ${specialEffects}
            <p style="color: ${isOwned ? '#32cd32' : '#ff6b6b'};">
                ${isOwned ? 'OWNED' : `Cost: $${weapon.cost}`}
            </p>
            <button id="weapon-${weaponKey}" style="background-color: ${isEquipped ? '#32cd32' : isOwned ? '#444' : canAfford ? '#666' : '#333'};">
                ${isEquipped ? 'EQUIPPED' : isOwned ? 'EQUIP' : canAfford ? 'BUY' : 'CAN\'T AFFORD'}
            </button>
        `;
        
        const button = weaponDiv.querySelector(`#weapon-${weaponKey}`);
        button.addEventListener('click', () => {
            if (isOwned) {
                // Equip weapon
                player.currentWeapon = weaponKey;
                populateShop();
            } else if (canAfford) {
                // Buy weapon
                player.money -= weapon.cost;
                weapon.owned = true;
                player.currentWeapon = weaponKey;
                populateShop();
            }
        });
        
        weaponList.appendChild(weaponDiv);
    }
    
    // Add event listeners for pagination
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            populateShop();
        }
    };
    
    nextButton.onclick = () => {
        const totalPages = Math.ceil(weaponKeys.length / weaponsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            populateShop();
        }
    };
}

// Menu Functions
function populateLobbyList() {
    const lobbyList = document.getElementById('lobbyList');
    lobbyList.innerHTML = '';
    for (let i = 0; i < botCount; i++) {
        const botLobby = document.createElement('button');
        botLobby.textContent = `Lobby ${i + 1}`;
        botLobby.addEventListener('click', () => {
            document.getElementById('lobby').style.display = 'none';
            startGame();
        });
        lobbyList.appendChild(botLobby);
    }
}

// Event Listeners - Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('playButton').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        startGame();
    });

    document.getElementById('multiplayerButton').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('lobby').style.display = 'block';
        populateLobbyList();
    });

    document.getElementById('shopButton').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('shop').style.display = 'block';
        currentPage = 1; // Reset to first page
        populateShop();
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('settings').style.display = 'block';
    });

    // Fixed back button event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        document.getElementById('settings').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    });

    document.getElementById('backToMenuButton').addEventListener('click', () => {
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    });

    document.getElementById('backToMenuFromShopButton').addEventListener('click', () => {
        document.getElementById('shop').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    });

    document.getElementById('playerColor').addEventListener('input', (e) => {
        player.color = e.target.value;
    });
});

// Initialize the game
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

updateHealthBar();
updateWeaponDisplay();
updateKillCounter();

// Start the game loop
requestAnimationFrame(gameLoop);