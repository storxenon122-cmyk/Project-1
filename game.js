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
    money: 1000,
    currentWeapon: 'pistol',
    weapons: {
        pistol: { name: 'Pistol', damage: 3, fireRate: 500, bulletSpeed: 5, cost: 0, owned: true },
        shotgun: { name: 'Shotgun', damage: 8, fireRate: 800, bulletSpeed: 4, cost: 200, owned: false, spread: 5 },
        rifle: { name: 'Rifle', damage: 5, fireRate: 300, bulletSpeed: 6, cost: 400, owned: false },
        rayGun: { name: 'Ray Gun', damage: 12, fireRate: 600, bulletSpeed: 7, cost: 800, owned: false },
        minigun: { name: 'Minigun', damage: 4, fireRate: 150, bulletSpeed: 5, cost: 1200, owned: false },
        sniper: { name: 'Sniper', damage: 15, fireRate: 1000, bulletSpeed: 8, cost: 600, owned: false }
    }
};

// Game State Variables
const bots = [];
const botCount = 5;
const powerUps = [];
let powerUpSpawnInterval;
let botsKilled = 0;
let bossSpawned = false;

// Performance optimization variables
let lastTime = 0;
const FPS = 60;
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
for (let i = 0; i < botCount; i++) {
    spawnBot();
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
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
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
    
    if (weapon.name === 'Shotgun') {
        // Shotgun fires multiple bullets in a spread
        for (let i = -weapon.spread; i <= weapon.spread; i += weapon.spread) {
            const spreadAngle = angle + (i * Math.PI / 180);
            player.bullets.push({
                x: player.x,
                y: player.y,
                speed: weapon.bulletSpeed,
                angle: spreadAngle,
                damage: weapon.damage,
                explosive: player.explosiveBullets || false,
                chainLightning: player.chainLightning || false,
                golden: player.goldenBullet || false
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
            explosive: player.explosiveBullets || false,
            chainLightning: player.chainLightning || false,
            golden: player.goldenBullet || false
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
            explosive: player.explosiveBullets || false,
            chainLightning: player.chainLightning || false,
            golden: player.goldenBullet || false
        });
        player.bullets.push({
            x: player.x,
            y: player.y,
            speed: weapon.bulletSpeed,
            angle: angle - spread,
            damage: weapon.damage,
            explosive: player.explosiveBullets || false,
            chainLightning: player.chainLightning || false,
            golden: player.goldenBullet || false
        });
    }
    
    // Rapid fire effect
    if (player.rapidFire) {
        setTimeout(() => {
            if (weapon.name === 'Shotgun') {
                for (let i = -weapon.spread; i <= weapon.spread; i += weapon.spread) {
                    const spreadAngle = angle + (i * Math.PI / 180);
                    player.bullets.push({
                        x: player.x,
                        y: player.y,
                        speed: weapon.bulletSpeed,
                        angle: spreadAngle,
                        damage: weapon.damage,
                        explosive: player.explosiveBullets || false,
                        chainLightning: player.chainLightning || false,
                        golden: player.goldenBullet || false
                    });
                }
            } else {
                player.bullets.push({
                    x: player.x,
                    y: player.y,
                    speed: weapon.bulletSpeed,
                    angle: angle,
                    damage: weapon.damage,
                    explosive: player.explosiveBullets || false,
                    chainLightning: player.chainLightning || false,
                    golden: player.goldenBullet || false
                });
            }
        }, 100);
        setTimeout(() => {
            if (weapon.name === 'Shotgun') {
                for (let i = -weapon.spread; i <= weapon.spread; i += weapon.spread) {
                    const spreadAngle = angle + (i * Math.PI / 180);
                    player.bullets.push({
                        x: player.x,
                        y: player.y,
                        speed: weapon.bulletSpeed,
                        angle: spreadAngle,
                        damage: weapon.damage,
                        explosive: player.explosiveBullets || false,
                        chainLightning: player.chainLightning || false,
                        golden: player.goldenBullet || false
                    });
                }
            } else {
                player.bullets.push({
                    x: player.x,
                    y: player.y,
                    speed: weapon.bulletSpeed,
                    angle: angle,
                    damage: weapon.damage,
                    explosive: player.explosiveBullets || false,
                    chainLightning: player.chainLightning || false,
                    golden: player.goldenBullet || false
                });
            }
        }, 200);
    }
}

// Game Update Function with performance optimization
function update(deltaTime) {
    // Player movement
    if (keys.w) player.y -= player.speed;
    if (keys.a) player.x -= player.speed;
    if (keys.s) player.y += player.speed;
    if (keys.d) player.x += player.speed;

    // Continuous shooting when mouse is held down
    if (isMouseDown) {
        const currentTime = Date.now();
        const weapon = player.weapons[player.currentWeapon];
        const fireRate = player.rapidFire ? weapon.fireRate * 0.5 : weapon.fireRate;
        
        if (currentTime - lastShotTime > fireRate) {
            shoot();
            lastShotTime = currentTime;
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
        if (bot.x < player.x) bot.x += bot.speed;
        if (bot.x > player.x) bot.x -= bot.speed;
        if (bot.y < player.y) bot.y += bot.speed;
        if (bot.y > player.y) bot.y -= bot.speed;

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
                        alert('You died!');
                        window.location.reload();
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
                // Heal over time for 10 seconds
                const healInterval = setInterval(() => {
                    if (player.health < 100) {
                        player.health = Math.min(player.health + 5, 100);
                        updateHealthBar();
                    }
                }, 1000);
                setTimeout(() => {
                    clearInterval(healInterval);
                }, 10000);
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
                // Slow down all bots
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
                // Push all nearby bots away
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
                // Temporarily reverse time for bots
                bots.forEach(bot => {
                    bot.timeWarped = true;
                    bot.originalSpeed = bot.speed;
                    bot.speed = -bot.speed;
                });
                setTimeout(() => {
                    bots.forEach(bot => {
                        if (bot.timeWarped) {
                            bot.timeWarped = false;
                            bot.speed = Math.abs(bot.originalSpeed);
                        }
                    });
                }, 3000);
            } else if (powerUp.type === 'blackHole') {
                // Create a black hole effect
                const blackHoleX = player.x;
                const blackHoleY = player.y;
                bots.forEach(bot => {
                    const distance = Math.sqrt((bot.x - blackHoleX) ** 2 + (bot.y - blackHoleY) ** 2);
                    if (distance < 200) {
                        const angle = Math.atan2(blackHoleY - bot.y, blackHoleX - bot.x);
                        bot.x += Math.cos(angle) * 2;
                        bot.y += Math.sin(angle) * 2;
                    }
                });
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
    ctx.fillStyle = player.invincible ? '#ffff00' : player.color;
    ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
    drawGun(player.x, player.y, mouseX, mouseY, player.color);

    // Draw player bullets
    player.bullets.forEach(bullet => {
        if (bullet.golden) {
            ctx.fillStyle = '#ffd700';
        } else if (bullet.explosive) {
            ctx.fillStyle = '#ff4500';
        } else if (bullet.chainLightning) {
            ctx.fillStyle = '#00ffff';
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

    // Draw power-ups with new colors
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'health' ? 'green' : 
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
                        powerUp.type === 'blackHole' ? '#000000' :
                        'gold';
        ctx.fillRect(powerUp.x - 10, powerUp.y - 10, 20, 20);
    });
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

// Performance optimized game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= frameTime) {
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
    updateWeaponDisplay();
    updateKillCounter();
    gameLoop(0);
    powerUpSpawnInterval = setInterval(spawnPowerUp, 5000);
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

function populateShop() {
    const weaponList = document.getElementById('weaponList');
    const moneyDisplay = document.getElementById('shopMoneyDisplay');
    weaponList.innerHTML = '';
    moneyDisplay.textContent = player.money;

    Object.keys(player.weapons).forEach(weaponKey => {
        const weapon = player.weapons[weaponKey];
        const weaponDiv = document.createElement('div');
        weaponDiv.style.cssText = 'border: 2px solid #444; padding: 10px; text-align: center; background-color: #333;';
        
        const isOwned = weapon.owned;
        const isEquipped = player.currentWeapon === weaponKey;
        const canAfford = player.money >= weapon.cost;
        
        weaponDiv.innerHTML = `
            <h3 style="color: white; margin: 0 0 10px 0;">${weapon.name}</h3>
            <p style="color: #ccc; margin: 5px 0;">Damage: ${weapon.damage}</p>
            <p style="color: #ccc; margin: 5px 0;">Fire Rate: ${weapon.fireRate}ms</p>
            <p style="color: #ccc; margin: 5px 0;">Bullet Speed: ${weapon.bulletSpeed}</p>
            ${weapon.spread ? `<p style="color: #ccc; margin: 5px 0;">Spread: ${weapon.spread}°</p>` : ''}
            <p style="color: ${isOwned ? '#32cd32' : '#ff6b6b'}; margin: 5px 0;">
                ${isOwned ? 'OWNED' : `Cost: $${weapon.cost}`}
            </p>
            <button id="weapon-${weaponKey}" style="margin: 5px; padding: 5px 10px; background-color: ${isEquipped ? '#32cd32' : isOwned ? '#444' : canAfford ? '#666' : '#333'}; color: white; border: none; cursor: ${isOwned || canAfford ? 'pointer' : 'not-allowed'};">
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
    });
}

// Event Listeners
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
    populateShop();
});

document.getElementById('settingsButton').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'block';
});

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

// Tooltip System with new power-ups
const tooltip = document.getElementById('tooltip');

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let showTooltip = false;
    powerUps.forEach(powerUp => {
        if (x > powerUp.x - 10 && x < powerUp.x + 10 && y > powerUp.y - 10 && y < powerUp.y + 10) {
            tooltip.style.left = `${e.clientX + 10}px`;
            tooltip.style.top = `${e.clientY + 10}px`;
            tooltip.style.display = 'block';
            tooltip.textContent = powerUp.type === 'health' ? 'Health: Restores 20 health' :
                                  powerUp.type === 'speed' ? 'Speed: Increases speed for 5 seconds' :
                                  powerUp.type === 'bulletSpeed' ? 'Bullet Speed: Increases bullet speed for 5 seconds' :
                                  powerUp.type === 'invincibility' ? 'Invincibility: Makes you invincible for 5 seconds' :
                                  powerUp.type === 'shield' ? 'Shield: Makes you invincible for 10 seconds' :
                                  powerUp.type === 'doubleDamage' ? 'Double Damage: Doubles your damage for 5 seconds' :
                                  powerUp.type === 'rapidFire' ? 'Rapid Fire: Shoots 3 bullets per click for 8 seconds' :
                                  powerUp.type === 'freezeTime' ? 'Freeze Time: Freezes all bots for 3 seconds' :
                                  powerUp.type === 'teleport' ? 'Teleport: Instantly moves you to a random location' :
                                  powerUp.type === 'bomb' ? 'Bomb: Destroys all bots within 150 pixels' :
                                  powerUp.type === 'healOverTime' ? 'Heal Over Time: Gradually heals you for 10 seconds' :
                                  powerUp.type === 'tripleShot' ? 'Triple Shot: Fires 3 bullets at once for 6 seconds' :
                                  powerUp.type === 'explosiveBullets' ? 'Explosive Bullets: Bullets explode on impact for 7 seconds' :
                                  powerUp.type === 'lifeSteal' ? 'Life Steal: Heal 30% of damage dealt for 8 seconds' :
                                  powerUp.type === 'timeSlow' ? 'Time Slow: Slows all bots for 4 seconds' :
                                  powerUp.type === 'chainLightning' ? 'Chain Lightning: Bullets chain between enemies for 5 seconds' :
                                  powerUp.type === 'shieldBash' ? 'Shield Bash: Push all nearby enemies away' :
                                  powerUp.type === 'vampireMode' ? 'Vampire Mode: Increased damage and life steal for 10 seconds' :
                                  powerUp.type === 'goldenBullet' ? 'Golden Bullet: Next bullets deal 3x damage for 3 seconds' :
                                  powerUp.type === 'timeWarp' ? 'Time Warp: Reverse bot movement for 3 seconds' :
                                  powerUp.type === 'blackHole' ? 'Black Hole: Pull all bots toward you' :
                                  'Extra Life: Grants an extra life';
            showTooltip = true;
        }
    });

    if (!showTooltip) {
        tooltip.style.display = 'none';
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
