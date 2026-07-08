class GameCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Base logical dimensions (900x500)
        this.width = 900;
        this.height = 500;
        
        this.clouds = [
            { x: 100, y: 50, speed: 0.1, size: 40 },
            { x: 400, y: 80, speed: 0.15, size: 50 },
            { x: 700, y: 40, speed: 0.08, size: 35 }
        ];
        
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height - 200),
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random()
            });
        }
        
        this.particles = [];
        this.seagulls = [
            { x: 200, y: 100, targetY: 100, speedX: 0.5, wingPhase: 0 }
        ];

        this.waveOffset = 0;
        this.lightningActive = false;
        this.lightningTimer = 0;
    }

    resize(container) {
        const rect = container.getBoundingClientRect();
        // Maintain aspect ratio 900:500
        let targetW = rect.width;
        let targetH = targetW * (500 / 900);
        
        if (targetH > rect.height) {
            targetH = rect.height;
            targetW = targetH * (900 / 500);
        }
        
        this.canvas.style.width = `${targetW}px`;
        this.canvas.style.height = `${targetH}px`;
    }

    update(state, stateData, dt, gameTime, weather) {
        // Update wave offset
        this.waveOffset += 0.02;
        
        // Update clouds
        this.clouds.forEach(c => {
            c.x += c.speed * dt * 0.05;
            if (c.x > this.width + 100) {
                c.x = -100;
                c.y = Math.random() * 120 + 20;
            }
        });

        // Update seagulls
        if (Math.random() < 0.005 && this.seagulls.length < 4) {
            this.seagulls.push({
                x: -50,
                y: Math.random() * 100 + 40,
                targetY: Math.random() * 100 + 40,
                speedX: Math.random() * 0.8 + 0.4,
                wingPhase: Math.random() * Math.PI
            });
        }
        
        this.seagulls.forEach((g, idx) => {
            g.x += g.speedX * dt * 0.05;
            g.wingPhase += 0.1 * dt * 0.05;
            g.y += Math.sin(g.x * 0.02) * 0.2;
            
            if (g.x > this.width + 50) {
                this.seagulls.splice(idx, 1);
            }
        });

        // Twinkle stars
        this.stars.forEach(s => {
            s.alpha += (Math.random() - 0.5) * 0.05;
            if (s.alpha < 0) s.alpha = 0;
            if (s.alpha > 1) s.alpha = 1;
        });

        // Weather particles
        this.updateWeatherParticles(weather, dt);
        
        // Update normal particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx * dt * 0.05;
            p.y += p.vy * dt * 0.05;
            p.vy += p.gravity * dt * 0.05;
            p.alpha -= p.decay * dt * 0.05;
            
            if (p.alpha <= 0 || p.y > this.height) {
                this.particles.splice(idx, 1);
            }
        });

        // Handle lightning for storms
        if (weather === 'storm') {
            if (!this.lightningActive && Math.random() < 0.002) {
                this.lightningActive = true;
                this.lightningTimer = 5 + Math.random() * 10;
            }
            if (this.lightningActive) {
                this.lightningTimer -= dt * 0.05;
                if (this.lightningTimer <= 0) {
                    this.lightningActive = false;
                }
            }
        } else {
            this.lightningActive = false;
        }
    }

    spawnSplash(x, y, count = 10, speed = 3) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI - Math.PI; // Upwards hemisphere
            const spd = Math.random() * speed + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                gravity: 0.12,
                size: Math.random() * 3 + 1,
                color: 'rgba(255, 255, 255, 0.85)',
                alpha: 1.0,
                decay: 0.03
            });
        }
    }

    spawnBubbles(x, y, count = 2) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 15,
                y: y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.8 - 0.4,
                gravity: 0.0,
                size: Math.random() * 2 + 1,
                color: 'rgba(255, 255, 255, 0.5)',
                alpha: 0.8,
                decay: 0.015
            });
        }
    }

    spawnSparkles(x, y, count = 15, color = 'rgba(255, 223, 0, 0.9)') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2 + 0.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                gravity: 0.01,
                size: Math.random() * 4 + 1.5,
                color: color,
                alpha: 1.0,
                decay: 0.02
            });
        }
    }

    updateWeatherParticles(weather, dt) {
        if (weather === 'rain' || weather === 'storm') {
            // Spawn raindrops
            const rate = weather === 'storm' ? 8 : 3;
            for (let i = 0; i < rate; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: -10,
                    vx: -2 - Math.random() * 1.5,
                    vy: 8 + Math.random() * 5,
                    gravity: 0.05,
                    size: Math.random() * 1.5 + 0.5,
                    color: 'rgba(174, 219, 255, 0.4)',
                    alpha: 0.7,
                    decay: 0.005
                });
            }
        } else if (weather === 'snow' || weather === 'frozen') {
            // If location theme is frozen and we have snowfall
            if (Math.random() < 0.2) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: -10,
                    vx: (Math.random() - 0.5) * 1.0,
                    vy: 1.0 + Math.random() * 1.5,
                    gravity: 0.01,
                    size: Math.random() * 3 + 1,
                    color: 'rgba(255, 255, 255, 0.9)',
                    alpha: 0.9,
                    decay: 0.003
                });
            }
        }
    }

    draw(state, stateData, timeOfDay, weather, tensionInfo = { tension: 0, maxTension: 100 }) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 1. Draw Sky (depending on time of day and location)
        this.drawSky(timeOfDay, weather, stateData.locationColors);
        
        // 2. Draw Sun / Moon
        this.drawAstroBody(timeOfDay);
        
        // 3. Draw Stars (if sunset or night)
        if (timeOfDay === 'sunset' || timeOfDay === 'night') {
            this.drawStars();
        }
        
        // 4. Draw Clouds
        this.drawClouds();
        
        // 5. Draw Seagulls
        this.drawSeagulls();
        
        // 6. Draw Sea waves
        this.drawSea(stateData.locationColors.sea);

        // 7. Draw Beach shore
        this.drawBeach(stateData.locationColors.beach);

        // 8. Draw Fisherman & Rod
        this.drawFisherman(state, stateData);

        // 9. Draw Bobber and Line
        this.drawFishingLineAndBobber(state, stateData, tensionInfo);

        // 10. Draw Fish battle visualizer shadow under water
        if (state === 'fighting') {
            this.drawFishShadow(stateData);
        }

        // 11. Draw Particles
        this.drawParticles();

        // 12. Draw Lightning Flash Overlay
        if (this.lightningActive) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            // Draw a lightning bolt
            this.drawLightningBolt();
        }
    }

    drawSky(timeOfDay, weather, colors) {
        const grad = this.ctx.createLinearGradient(0, 0, 0, 300);
        let c1, c2, c3;
        
        if (weather === 'storm' || weather === 'cloudy') {
            c1 = '#3e4a52';
            c2 = '#5a6d7a';
            c3 = '#2a3138';
        } else if (weather === 'rain') {
            c1 = '#4b5563';
            c2 = '#6b7280';
            c3 = '#374151';
        } else {
            // Normal location colors based on day time
            const skyColors = colors.sky; // [color1, color2]
            c1 = skyColors[0];
            c2 = skyColors[1];
            
            if (timeOfDay === 'morning') {
                c1 = '#ff7e5f'; c2 = '#feb47b';
            } else if (timeOfDay === 'sunset') {
                c1 = '#e65c00'; c2 = '#f9d423';
            } else if (timeOfDay === 'night') {
                c1 = '#0f2027'; c2 = '#203a43';
            }
        }

        grad.addColorStop(0, c1);
        grad.addColorStop(0.7, c2);
        grad.addColorStop(1, '#a8e6cf'); // Horizon transition line
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawAstroBody(timeOfDay) {
        this.ctx.save();
        if (timeOfDay === 'night') {
            // Moon
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ffffd0';
            this.ctx.fillStyle = '#ffffe0';
            this.ctx.beginPath();
            this.ctx.arc(750, 60, 20, 0, Math.PI * 2);
            this.ctx.fill();
            // Subtract for crescent
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#0f2027'; // rough matching sky background
            this.ctx.beginPath();
            this.ctx.arc(742, 60, 20, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (timeOfDay === 'sunset') {
            // Low setting sun
            this.ctx.shadowBlur = 40;
            this.ctx.shadowColor = '#ff3300';
            const grad = this.ctx.createRadialGradient(700, 240, 5, 700, 240, 50);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#ffaa00');
            grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(700, 240, 50, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (timeOfDay === 'morning') {
            // Low morning sun
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = '#ffe066';
            this.ctx.fillStyle = '#ffeb99';
            this.ctx.beginPath();
            this.ctx.arc(720, 120, 25, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Day Sun
            this.ctx.shadowBlur = 45;
            this.ctx.shadowColor = '#ffffff';
            const grad = this.ctx.createRadialGradient(720, 70, 5, 720, 70, 40);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.2, '#ffea88');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(720, 70, 40, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(s => {
            this.ctx.globalAlpha = s.alpha;
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.clouds.forEach(c => {
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            this.ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.1, c.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(c.x + c.size * 1.2, c.y, c.size * 0.6, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    drawSeagulls() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';
        this.seagulls.forEach(g => {
            this.ctx.beginPath();
            const wingY = Math.sin(g.wingPhase) * 6;
            // Left wing
            this.ctx.moveTo(g.x - 12, g.y - wingY);
            this.ctx.quadraticCurveTo(g.x - 6, g.y - 8, g.x, g.y);
            // Right wing
            this.ctx.quadraticCurveTo(g.x + 6, g.y - 8, g.x + 12, g.y - wingY);
            this.ctx.stroke();
        });
    }

    drawSea(seaColors) {
        const waveCount = 3;
        const waveFrequencies = [0.008, 0.012, 0.015];
        const waveAmplitudes = [10, 8, 5];
        const waveSpeeds = [this.waveOffset * 0.8, -this.waveOffset * 1.2, this.waveOffset];
        const baseHeights = [280, 290, 300];
        
        // Custom shades based on theme
        const colors = [
            seaColors[0] + '88', // Semi transparent top layer
            seaColors[1] + 'cc',
            seaColors[2] || seaColors[1] // Dark bottom layer
        ];

        for (let w = 0; w < waveCount; w++) {
            this.ctx.fillStyle = colors[w];
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            this.ctx.lineTo(0, baseHeights[w]);
            
            for (let x = 0; x <= this.width; x += 10) {
                const y = baseHeights[w] + Math.sin(x * waveFrequencies[w] + waveSpeeds[w]) * waveAmplitudes[w];
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawBeach(beachColor) {
        this.ctx.fillStyle = beachColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 270);
        // Soft curve coming down towards center-right
        this.ctx.quadraticCurveTo(150, 280, 240, 340);
        this.ctx.quadraticCurveTo(300, 380, 320, 500);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw some details on beach: grass, pebbles
        this.ctx.fillStyle = '#8c7b60';
        this.ctx.beginPath();
        this.ctx.arc(60, 320, 4, 0, Math.PI*2);
        this.ctx.arc(120, 370, 3, 0, Math.PI*2);
        this.ctx.arc(80, 420, 6, 0, Math.PI*2);
        this.ctx.fill();

        // Rocks
        this.ctx.fillStyle = '#6e6e6e';
        this.ctx.beginPath();
        this.ctx.moveTo(250, 400);
        this.ctx.lineTo(270, 385);
        this.ctx.lineTo(290, 410);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawFisherman(state, stateData) {
        this.ctx.save();
        
        // Fisherman Base coordinates
        let base_x = 180;
        let base_y = 350;

        // Animate idle breathing
        let breathing = 0;
        if (state === 'idle' || state === 'waiting') {
            breathing = Math.sin(Date.now() * 0.002) * 2;
        }
        
        let headY = base_y - 40 + breathing;
        let armPhase = 0;
        let bodyRotation = 0;
        let holdingRod = true;
        
        if (state === 'casting') {
            const castTime = stateData.castPhase || 0; // 0 to 1
            if (castTime < 0.4) {
                // Pulling back
                bodyRotation = -0.15;
                headY = base_y - 38;
            } else {
                // Swinging forward
                bodyRotation = 0.2;
                headY = base_y - 42;
            }
        } else if (state === 'fighting' || state === 'reeling') {
            bodyRotation = Math.sin(Date.now() * 0.08) * 0.02 - 0.05; // Shaking/pulling back
        } else if (state === 'celebrating' || state === 'victory') {
            // Happy jumping
            const jump = Math.abs(Math.sin(Date.now() * 0.015)) * 15;
            base_y -= jump;
            headY -= jump;
            bodyRotation = 0;
            holdingRod = false;
        }

        // Draw shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(base_x, base_y + 12, 18, 5, 0, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.translate(base_x, base_y);
        this.ctx.rotate(bodyRotation);

        // Legs/Pants (Green waders)
        this.ctx.fillStyle = '#425446';
        this.ctx.fillRect(-8, -10, 6, 20); // Left leg
        this.ctx.fillRect(2, -10, 6, 20); // Right leg
        this.ctx.fillStyle = '#2b382d';
        this.ctx.fillRect(-10, 8, 9, 4); // Left boot
        this.ctx.fillRect(1, 8, 9, 4); // Right boot

        // Torso/Jacket (Yellow raincoat)
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(-10, -28 + breathing, 20, 20);
        this.ctx.fillStyle = '#e5b800'; // shading
        this.ctx.fillRect(4, -28 + breathing, 6, 20);

        // Arm holding rod / reeling
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        if (state === 'celebrating' || state === 'victory') {
            // Hand raised high!
            this.ctx.moveTo(8, -20);
            this.ctx.lineTo(16, -35);
        } else {
            // Holding rod forward
            this.ctx.moveTo(-6, -22 + breathing);
            this.ctx.lineTo(8, -14 + breathing);
        }
        this.ctx.stroke();

        // Head
        this.ctx.fillStyle = '#ffd1b3'; // Skin color
        this.ctx.beginPath();
        this.ctx.arc(0, headY - base_y + 14, 8, 0, Math.PI*2);
        this.ctx.fill();

        // Fisherman Hat (Brown bucket hat)
        this.ctx.fillStyle = '#855e42';
        this.ctx.beginPath();
        this.ctx.ellipse(0, headY - base_y + 7, 12, 3, 0, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillRect(-6, headY - base_y + 1, 12, 6);

        // Face details (eye looking at sea)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(4, headY - base_y + 13, 1, 0, Math.PI*2);
        this.ctx.fill();

        // Draw Fishing Rod
        if (holdingRod) {
            this.ctx.strokeStyle = '#3e2723'; // Wooden/Carbon rod
            this.ctx.lineWidth = 3.5;
            
            this.ctx.beginPath();
            if (state === 'casting') {
                const castTime = stateData.castPhase || 0;
                if (castTime < 0.4) {
                    // Pull back: angle 120deg left
                    this.ctx.moveTo(4, -16 + breathing);
                    this.ctx.lineTo(-30, -50);
                } else {
                    // Swing forward: angle 45deg right
                    this.ctx.moveTo(4, -16 + breathing);
                    this.ctx.lineTo(40, -35);
                }
            } else if (state === 'fighting' || state === 'reeling') {
                // Heavily bent rod
                this.ctx.moveTo(4, -16 + breathing);
                // Draw bezier curve for rod flex
                this.ctx.bezierCurveTo(25, -28, 45, -28, 50, -10);
            } else {
                // Standard waiting angle (60 degrees up right)
                this.ctx.moveTo(4, -16 + breathing);
                this.ctx.lineTo(45, -45);
            }
            this.ctx.stroke();
        } else if (state === 'celebrating' || state === 'victory') {
            // Holding fish in left hand, rod in right hand vertical
            this.ctx.strokeStyle = '#3e2723';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-8, -20);
            this.ctx.lineTo(-20, -50);
            this.ctx.stroke();

            // Draw caught fish hanging in raised hand
            const fishName = stateData.caughtFish ? stateData.caughtFish.name : 'Fish';
            const fishColors = stateData.caughtFish ? stateData.caughtFish.colors : ['#a8c0ff', '#3f2b96'];
            
            const grad = this.ctx.createLinearGradient(16, -35, 16, -15);
            grad.addColorStop(0, fishColors[0]);
            grad.addColorStop(1, fishColors[1]);
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.ellipse(16, -25, 6, 12, 0, 0, Math.PI*2);
            this.ctx.fill();

            // Fish tail
            this.ctx.beginPath();
            this.ctx.moveTo(16, -13);
            this.ctx.lineTo(12, -7);
            this.ctx.lineTo(20, -7);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawFishingLineAndBobber(state, stateData, tensionInfo) {
        if (state === 'idle' || state === 'celebrating' || state === 'victory') return;
        
        let startX = 180;
        let startY = 350;
        
        // Find rod tip coordinate relative to fisherman base at (180, 350)
        let tipX = startX + 45;
        let tipY = startY - 45;
        
        let breathing = Math.sin(Date.now() * 0.002) * 2;
        
        if (state === 'casting') {
            const castTime = stateData.castPhase || 0;
            if (castTime < 0.4) {
                // Backwards
                tipX = startX - 30;
                tipY = startY - 50;
            } else {
                // Forwards
                tipX = startX + 40;
                tipY = startY - 35;
            }
        } else if (state === 'fighting' || state === 'reeling') {
            tipX = startX + 50;
            tipY = startY - 10; // Bent down
        } else {
            // Idle/Waiting
            tipY += breathing;
        }

        // Bobber coordinate
        let bobberX = stateData.bobberX || 600;
        let bobberY = stateData.bobberY || 300;

        // If line is snapped, draw a flying line tail
        if (stateData.isLineSnapped) {
            this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(tipX, tipY);
            this.ctx.quadraticCurveTo(tipX + 80, tipY + 20, tipX + 100, tipY + 80);
            this.ctx.stroke();
            return;
        }

        // Draw Fishing Line (vibrates if high tension)
        let tensionRatio = tensionInfo.tension / tensionInfo.maxTension;
        let vibrateOffset = 0;
        if (tensionRatio > 0.6) {
            vibrateOffset = (Math.random() - 0.5) * 5 * (tensionRatio - 0.6) * 2.5;
        }

        // Draw tension line color (grows red as line snaps)
        let r = Math.floor(tensionRatio * 255);
        let g = Math.floor((1 - tensionRatio) * 200) + 55;
        let b = Math.floor((1 - tensionRatio) * 200) + 55;
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        this.ctx.lineWidth = 1 + tensionRatio * 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(tipX, tipY);
        if (state === 'waiting') {
            // Hanging loose line
            const midX = (tipX + bobberX) / 2;
            const midY = (tipY + bobberY) / 2 + 30;
            this.ctx.quadraticCurveTo(midX, midY, bobberX + vibrateOffset, bobberY);
        } else {
            // Tight fighting line
            this.ctx.lineTo(bobberX + vibrateOffset, bobberY);
        }
        this.ctx.stroke();

        // Draw Bobber (only if bobber is in water)
        if (state !== 'casting') {
            this.ctx.save();
            
            // Draw red/white bobber
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            
            this.ctx.fillStyle = '#ff3333'; // Red top
            this.ctx.beginPath();
            this.ctx.arc(bobberX, bobberY - 2, 5, Math.PI, 0);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffffff'; // White bottom
            this.ctx.beginPath();
            this.ctx.arc(bobberX, bobberY - 2, 5, 0, Math.PI);
            this.ctx.fill();

            // Bobber center rod
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(bobberX, bobberY - 8);
            this.ctx.lineTo(bobberX, bobberY + 2);
            this.ctx.stroke();
            
            this.ctx.restore();
            
            // Exclamation mark on fish bite
            if (state === 'biting') {
                this.ctx.fillStyle = '#ff0033';
                this.ctx.font = 'bold 20px "Outfit", Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#ff0033';
                // Bobbing indicator
                const indicatorOffset = Math.sin(Date.now() * 0.01) * 4;
                this.ctx.fillText('!', bobberX, bobberY - 18 + indicatorOffset);
            }
        }
    }

    drawFishShadow(stateData) {
        // Draw a dark blue shadow under the water moving
        let shadowX = stateData.fishShadowX || 600;
        let shadowY = stateData.fishShadowY || 310;
        let shadowW = 20 * (stateData.fishDifficulty || 0.5) + 10;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(12, 45, 75, 0.35)';
        this.ctx.beginPath();
        // Sinuosid swimming movement
        let angle = Date.now() * 0.01;
        this.ctx.ellipse(shadowX, shadowY, shadowW, 6, 0.2 * Math.sin(angle), 0, Math.PI*2);
        this.ctx.fill();
        
        // Tail wave
        this.ctx.beginPath();
        this.ctx.moveTo(shadowX - shadowW, shadowY);
        this.ctx.lineTo(shadowX - shadowW - 8, shadowY - 4 + Math.sin(angle)*2);
        this.ctx.lineTo(shadowX - shadowW - 8, shadowY + 4 + Math.sin(angle)*2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Draw fish jumping out of water during fighting
        if (stateData.isFishJumping) {
            this.drawJumpingFish(stateData);
        }
    }

    drawJumpingFish(stateData) {
        const x = stateData.jumpX;
        const y = stateData.jumpY;
        const size = 15 + (stateData.fishDifficulty * 15);
        const fishColors = stateData.fishColors || ['#a8c0ff', '#3f2b96'];
        
        this.ctx.save();
        
        // Splash effects at base of jump
        this.spawnBubbles(x, 290, 1);
        
        // Gradient for jumping fish body
        const grad = this.ctx.createLinearGradient(x - size, y - size/2, x + size, y + size/2);
        grad.addColorStop(0, fishColors[0]);
        grad.addColorStop(1, fishColors[1]);
        
        this.ctx.fillStyle = grad;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = fishColors[0];
        
        this.ctx.translate(x, y);
        // Rotate fish along its jump trajectory
        this.ctx.rotate(stateData.jumpRotation || 0);
        
        // Oval body
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tail fin
        this.ctx.beginPath();
        this.ctx.moveTo(-size, 0);
        this.ctx.lineTo(-size - (size * 0.5), -size * 0.4);
        this.ctx.lineTo(-size - (size * 0.5), size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.1, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.1, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawLightningBolt() {
        this.ctx.strokeStyle = '#e0f7ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        let startX = 400 + Math.random() * 200;
        let startY = 0;
        this.ctx.moveTo(startX, startY);
        
        for (let i = 0; i < 5; i++) {
            startX += (Math.random() - 0.5) * 60;
            startY += 40 + Math.random() * 40;
            this.ctx.lineTo(startX, startY);
        }
        
        this.ctx.stroke();
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            
            if (p.vx && p.vy) {
                // Dynamic drawing of splash drops as lines
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else {
                // Circles for bubbles / snow
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
            this.ctx.fill();
            this.ctx.restore();
        });
        this.ctx.globalAlpha = 1.0;
    }
}
