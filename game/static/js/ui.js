class GameUIManager {
    constructor(gameController) {
        this.game = gameController;
        this.activeTab = null;
        
        // Spin wheel control
        this.isSpinning = false;
        this.spinAngle = 0;
        
        // Drag-Reel tracking
        this.isReelDragging = false;
        this.reelStartAngle = 0;
        this.reelCurrentRotation = 0;
    }

    init() {
        this.bindEvents();
        this.renderLocationsList();
        this.renderShopList();
        this.renderCollectionBook();
        this.renderAchievements();
        this.renderQuests();
        this.updateAuthHUD();
        this.loadLeaderboard();
        this.loadTournament();
        
        // Check session initially
        this.syncSession();
    }

    bindEvents() {
        // Main Cast / Reel input triggers
        const castReelBtn = document.getElementById('cast-reel-btn');
        
        const startAction = (e) => {
            e.preventDefault();
            if (this.game.currentState === this.game.states.IDLE) {
                this.game.startCastingPower();
            } else if (this.game.currentState === this.game.states.BITING) {
                this.game.hookFish();
            } else if (this.game.currentState === this.game.states.FIGHTING) {
                this.game.setReeling(true);
                this.isReelDragging = true;
            }
        };

        const stopAction = (e) => {
            e.preventDefault();
            if (this.game.powerCharging) {
                this.game.releaseCast();
            } else if (this.game.currentState === this.game.states.FIGHTING) {
                this.game.setReeling(false);
                this.isReelDragging = false;
            }
        };

        castReelBtn.addEventListener('mousedown', startAction);
        castReelBtn.addEventListener('mouseup', stopAction);
        castReelBtn.addEventListener('touchstart', startAction);
        castReelBtn.addEventListener('touchend', stopAction);
        castReelBtn.addEventListener('mouseleave', stopAction);

        // Keyboard triggers: Space Bar
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (e.repeat) return;
                
                if (this.game.currentState === this.game.states.IDLE) {
                    this.game.startCastingPower();
                } else if (this.game.currentState === this.game.states.BITING) {
                    this.game.hookFish();
                } else if (this.game.currentState === this.game.states.FIGHTING) {
                    this.game.setReeling(true);
                    // Rotate the virtual wheel visually
                    this.rotateVirtualReel(10);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.game.powerCharging) {
                    this.game.releaseCast();
                } else if (this.game.currentState === this.game.states.FIGHTING) {
                    this.game.setReeling(false);
                }
            }
        });

        // Early cancel cast
        document.getElementById('cancel-cast-btn').addEventListener('click', () => {
            this.game.cancelCast();
        });

        // Tabs switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.toggleTab(tabId);
            });
        });

        // Close sidebar panels
        document.querySelectorAll('.close-panel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeActiveTab();
            });
        });

        // Caught Fish Modal close
        document.getElementById('claim-catch-btn').addEventListener('click', () => {
            document.getElementById('catch-modal').classList.remove('active');
            this.game.closeCelebration();
        });

        // Lucky Spin Wheel button
        document.getElementById('spin-btn').addEventListener('click', () => {
            this.spinLuckyWheel();
        });

        // Daily Login claim card
        document.getElementById('claim-daily-btn').addEventListener('click', () => {
            const success = this.game.claimDailyReward();
            if (success) {
                this.updateDailyLoginCard();
            }
        });

        // Drag/Swipe Virtual Reel Wheel interface
        const reelWheel = document.getElementById('reel-wheel-element');
        
        const getAngle = (clientX, clientY) => {
            const rect = reelWheel.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            return Math.atan2(clientY - cy, clientX - cx);
        };

        const handleReelStart = (e) => {
            if (this.game.currentState !== this.game.states.FIGHTING) return;
            const pos = e.touches ? e.touches[0] : e;
            this.isReelDragging = true;
            this.reelStartAngle = getAngle(pos.clientX, pos.clientY);
            this.game.setReeling(true);
        };

        const handleReelMove = (e) => {
            if (!this.isReelDragging) return;
            const pos = e.touches ? e.touches[0] : e;
            const currentAngle = getAngle(pos.clientX, pos.clientY);
            let diff = currentAngle - this.reelStartAngle;
            
            // Normalize angle diff
            if (diff < -Math.PI) diff += Math.PI * 2;
            if (diff > Math.PI) diff -= Math.PI * 2;

            if (Math.abs(diff) > 0.05) {
                // User rotating the reel wheel
                this.reelCurrentRotation += diff;
                reelWheel.style.transform = `rotate(${this.reelCurrentRotation * 57.29}deg)`; // rad to deg
                this.reelStartAngle = currentAngle;
                
                // Add positive reeling effort on motion
                this.game.setReeling(true);
            }
        };

        const handleReelEnd = () => {
            this.isReelDragging = false;
            this.game.setReeling(false);
        };

        reelWheel.addEventListener('mousedown', handleReelStart);
        window.addEventListener('mousemove', handleReelMove);
        window.addEventListener('mouseup', handleReelEnd);
        
        reelWheel.addEventListener('touchstart', handleReelStart, { passive: true });
        window.addEventListener('touchmove', handleReelMove, { passive: true });
        window.addEventListener('touchend', handleReelEnd);

        // Account management overlays
        document.getElementById('profile-btn').addEventListener('click', () => {
            document.getElementById('auth-modal').classList.add('active');
        });
        document.getElementById('close-auth-btn').addEventListener('click', () => {
            document.getElementById('auth-modal').classList.remove('remove');
            document.getElementById('auth-modal').classList.remove('active');
        });
        
        // Registration / Login Submit handlers
        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('auth-user').value.trim();
            const pass = document.getElementById('auth-pass').value;
            const submitType = e.submitter.getAttribute('value'); // 'login' or 'register'
            
            let res;
            if (submitType === 'register') {
                res = await API.register(user, pass);
            } else {
                res = await API.login(user, pass);
            }
            
            if (res.error) {
                this.showNotification(res.error);
            } else {
                this.showNotification(`Successfully logged in as ${res.username}!`);
                document.getElementById('auth-modal').classList.remove('active');
                
                // Sync progress
                await this.syncSession();
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await API.logout();
            this.showNotification("Logged out successfully.");
            this.updateAuthHUD();
            this.game.player = {
                level: 1, xp: 0, xpNeeded: 100, coins: 100,
                upgrades: { rod: 'wooden', reel: 'basic', hook: 'small', line: 'nylon', bait: 'worm' },
                caught: {}, achievements: [], locations: ['beach_shore'], currentLocation: 'beach_shore',
                lifetimeCoins: 0, dailyLoginDay: 0, lastLoginDate: null, questsProgress: {}
            };
            this.game.triggerUIUpdate();
            this.renderCollectionBook();
            this.renderAchievements();
        });
    }

    async syncSession() {
        const session = await API.checkSession();
        this.updateAuthHUD();
        if (session.logged_in) {
            await this.game.loadProgress();
            this.renderCollectionBook();
            this.renderAchievements();
            this.renderQuests();
        } else {
            // Check for LocalSave
            const hasLocal = await this.game.loadProgress();
            if (hasLocal) {
                this.renderCollectionBook();
                this.renderAchievements();
                this.renderQuests();
            }
        }
    }

    updateAuthHUD() {
        const usernameEl = document.getElementById('username-display');
        usernameEl.textContent = API.currentUser || 'Guest';
        
        const logoutBtn = document.getElementById('logout-btn');
        if (API.isGuest) {
            logoutBtn.style.display = 'none';
        } else {
            logoutBtn.style.display = 'inline-block';
        }
    }

    toggleTab(tabId) {
        const activeTabEl = document.getElementById(`${tabId}-panel`);
        if (this.activeTab === tabId) {
            this.closeActiveTab();
        } else {
            this.closeActiveTab();
            this.activeTab = tabId;
            activeTabEl.classList.add('active');
            
            // Highlight active button
            const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
    }

    closeActiveTab() {
        if (this.activeTab) {
            const panel = document.getElementById(`${this.activeTab}-panel`);
            if (panel) panel.classList.remove('active');
            
            const btn = document.querySelector(`.tab-btn[data-tab="${this.activeTab}"]`);
            if (btn) btn.classList.remove('active');
            
            this.activeTab = null;
        }
    }

    rotateVirtualReel(amt) {
        const reelWheel = document.getElementById('reel-wheel-element');
        this.reelCurrentRotation += amt * 0.05;
        reelWheel.style.transform = `rotate(${this.reelCurrentRotation * 57.29}deg)`;
    }

    updateHUD(player) {
        // Level, coins, xp
        document.getElementById('hud-level').textContent = player.level;
        document.getElementById('hud-coins').textContent = player.coins;
        
        const xpPercent = (player.xp / player.xpNeeded) * 100;
        document.getElementById('hud-xp-fill').style.width = `${xpPercent}%`;
        document.getElementById('hud-xp-text').textContent = `${player.xp}/${player.xpNeeded} XP`;
        
        // Location & Weather display
        document.getElementById('hud-location').textContent = GAME_DATA.locations.find(l => l.id === player.currentLocation)?.name || 'Unknown';
        document.getElementById('hud-weather').textContent = this.game.weather.toUpperCase();
        
        // Reeling UI state changes
        const castReelBtn = document.getElementById('cast-reel-btn');
        const powerBar = document.getElementById('power-bar');
        const powerFill = document.getElementById('power-fill');
        const tensionBar = document.getElementById('tension-bar-container');
        const tensionFill = document.getElementById('tension-fill');
        const catchBar = document.getElementById('catch-bar-container');
        const catchFill = document.getElementById('catch-fill');
        const cancelBtn = document.getElementById('cancel-cast-btn');
        const promptEl = document.getElementById('action-prompt');

        // Gold rush status overlay
        const goldRushPanel = document.getElementById('gold-rush-overlay');
        if (this.game.goldRushTimer > 0) {
            goldRushPanel.classList.add('active');
            document.getElementById('gold-rush-timer-txt').textContent = `${Math.ceil(this.game.goldRushTimer)}s left`;
        } else {
            goldRushPanel.classList.remove('active');
        }

        switch (this.game.currentState) {
            case this.game.states.IDLE:
                castReelBtn.textContent = "Hold to Cast";
                castReelBtn.className = "game-btn cast-mode";
                
                powerBar.style.display = 'block';
                powerFill.style.width = `${this.game.castPower}%`;
                
                tensionBar.style.display = 'none';
                catchBar.style.display = 'none';
                cancelBtn.style.display = 'none';
                promptEl.textContent = "Hold button or SPACEBAR to charge cast power.";
                break;
                
            case this.game.states.CASTING:
                castReelBtn.textContent = "Casting...";
                castReelBtn.className = "game-btn disabled";
                
                powerBar.style.display = 'none';
                tensionBar.style.display = 'none';
                catchBar.style.display = 'none';
                cancelBtn.style.display = 'none';
                promptEl.textContent = "Throwing lines into the ocean waves.";
                break;
                
            case this.game.states.WAITING:
                castReelBtn.textContent = "Reel In Early";
                castReelBtn.className = "game-btn wait-mode";
                
                powerBar.style.display = 'none';
                tensionBar.style.display = 'none';
                catchBar.style.display = 'none';
                cancelBtn.style.display = 'block';
                promptEl.textContent = "Waiting for a bite... watch the red bobber closely.";
                break;
                
            case this.game.states.BITING:
                castReelBtn.textContent = "PULL HOOK!";
                castReelBtn.className = "game-btn bite-mode alert-pulse";
                
                powerBar.style.display = 'none';
                tensionBar.style.display = 'none';
                catchBar.style.display = 'none';
                cancelBtn.style.display = 'none';
                promptEl.textContent = "A FISH BIT THE HOOK! TAP SPACE OR PULL NOW!";
                break;
                
            case this.game.states.FIGHTING:
                castReelBtn.textContent = "Hold to Reel";
                castReelBtn.className = "game-btn reel-mode";
                
                powerBar.style.display = 'none';
                
                tensionBar.style.display = 'block';
                tensionFill.style.width = `${this.game.tension}%`;
                
                // Color change warning
                if (this.game.tension > 75) {
                    tensionFill.className = "bar-fill danger-pulse";
                } else if (this.game.tension > 45) {
                    tensionFill.className = "bar-fill warning";
                } else {
                    tensionFill.className = "bar-fill";
                }
                
                catchBar.style.display = 'block';
                catchFill.style.width = `${this.game.catchProgress}%`;
                
                cancelBtn.style.display = 'none';
                
                let advice = "Reel in! Avoid maximum tension.";
                if (this.game.fishBehavior === 'pulling') advice = "Stop reeling! Fish is pulling hard!";
                if (this.game.fishBehavior === 'jumping') advice = "Watch out! Fish jumps!";
                promptEl.textContent = `${this.game.activeFish?.name} (${this.game.activeFish?.rarity.toUpperCase()}) - ${advice}`;
                break;

            case this.game.states.CELEBRATION:
                castReelBtn.textContent = "Great Catch!";
                castReelBtn.className = "game-btn disabled";
                powerBar.style.display = 'none';
                tensionBar.style.display = 'none';
                catchBar.style.display = 'none';
                cancelBtn.style.display = 'none';
                break;
        }

        // Live refresh views if tabs open
        if (this.activeTab === 'shop') this.renderShopList();
        if (this.activeTab === 'collection') this.renderCollectionBook();
        if (this.activeTab === 'quests') this.renderQuests();
    }

    renderLocationsList() {
        const container = document.getElementById('locations-container');
        container.innerHTML = '';
        
        GAME_DATA.locations.forEach(loc => {
            const unlocked = this.game.player.locations.includes(loc.id);
            const active = this.game.player.currentLocation === loc.id;
            
            const card = document.createElement('div');
            card.className = `location-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`;
            
            let btnHtml = '';
            if (active) {
                btnHtml = `<button class="loc-btn active-loc" disabled>Current</button>`;
            } else if (unlocked) {
                btnHtml = `<button class="loc-btn go-loc" data-id="${loc.id}">Travel</button>`;
            } else {
                btnHtml = `<button class="loc-btn unlock-loc" data-id="${loc.id}" data-cost="${loc.cost}" data-level="${loc.level}">Unlock (Lvl ${loc.level}, ${loc.cost}g)</button>`;
            }

            card.innerHTML = `
                <div class="loc-header">
                    <h4>${loc.name}</h4>
                    <span class="badge ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
                <p class="loc-desc">${loc.desc}</p>
                <div class="loc-footer">
                    ${btnHtml}
                </div>
            `;
            
            container.appendChild(card);
        });

        // Travel binds
        container.querySelectorAll('.go-loc').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.game.setLocation(id);
                this.renderLocationsList();
            });
        });

        // Unlock binds
        container.querySelectorAll('.unlock-loc').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const cost = parseInt(btn.getAttribute('data-cost'));
                const lvl = parseInt(btn.getAttribute('data-level'));
                
                const success = this.game.unlockLocation(id, lvl, cost);
                if (success) {
                    this.renderLocationsList();
                    this.renderCollectionBook(); // unlocks map species in book
                }
            });
        });
    }

    renderShopList() {
        const container = document.getElementById('upgrades-container');
        container.innerHTML = '';
        
        // Group shop items by category
        const categories = ['rod', 'reel', 'hook', 'line', 'bait'];
        
        categories.forEach(cat => {
            const items = GAME_DATA.upgrades[cat];
            const activeId = this.game.player.upgrades[cat];
            
            // Get next upgrade in list
            const activeIndex = items.findIndex(i => i.id === activeId);
            const currentItem = items[activeIndex];
            const nextItem = items[activeIndex + 1];

            const section = document.createElement('div');
            section.className = 'shop-section';
            
            let itemDetailsHtml = '';
            if (nextItem) {
                itemDetailsHtml = `
                    <div class="shop-item-card">
                        <div class="shop-item-hdr">
                            <h5>Next Tier: ${nextItem.name}</h5>
                            <span class="cost-tag">${nextItem.cost} Coins</span>
                        </div>
                        <p class="shop-item-desc">${nextItem.desc}</p>
                        <button class="buy-upgrade-btn" data-cat="${cat}" data-id="${nextItem.id}" data-cost="${nextItem.cost}" data-level="${nextItem.level}">Buy (Req. Lvl ${nextItem.level})</button>
                    </div>
                `;
            } else {
                itemDetailsHtml = `
                    <div class="shop-item-card maxed">
                        <h5>${currentItem.name}</h5>
                        <p class="shop-item-desc">Equipped. Maximum Tier reached!</p>
                    </div>
                `;
            }

            section.innerHTML = `
                <h4>Category: ${cat.toUpperCase()}</h4>
                <div class="current-item-banner">
                    <span>Equipped: <strong>${currentItem.name}</strong></span>
                </div>
                ${itemDetailsHtml}
            `;
            
            container.appendChild(section);
        });

        // Bind purchase triggers
        container.querySelectorAll('.buy-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat');
                const id = btn.getAttribute('data-id');
                const cost = parseInt(btn.getAttribute('data-cost'));
                const levelReq = parseInt(btn.getAttribute('data-level'));
                
                if (this.game.player.level < levelReq) {
                    this.showNotification(`Requires Level ${levelReq} to buy!`);
                    return;
                }
                
                const success = this.game.buyUpgrade(cat, id, cost);
                if (success) {
                    this.renderShopList();
                }
            });
        });
    }

    renderCollectionBook() {
        const container = document.getElementById('collection-container');
        container.innerHTML = '';
        
        // Sum caught types
        let totalCount = GAME_DATA.fish.length;
        let caughtCount = Object.keys(this.game.player.caught).length;
        
        document.getElementById('collection-progress-text').textContent = `Unlocked: ${caughtCount} / ${totalCount} Species`;

        GAME_DATA.fish.forEach(fish => {
            const caught = this.game.player.caught[fish.name];
            const card = document.createElement('div');
            card.className = `fish-book-card ${caught ? 'unlocked' : 'locked'}`;

            if (caught) {
                // Gradient for visual
                const styleBg = `linear-gradient(135deg, ${fish.colors[0]}80, ${fish.colors[1]}a0)`;
                card.style.background = styleBg;
                
                card.innerHTML = `
                    <div class="fish-graphic-circle" style="background: linear-gradient(to right, ${fish.colors[0]}, ${fish.colors[1]})">
                        <div class="fish-eye"></div>
                    </div>
                    <div class="fish-details">
                        <h4>${fish.name}</h4>
                        <span class="rarity-badge ${fish.rarity}">${fish.rarity.toUpperCase()}</span>
                        <div class="fish-stats">
                            <div>Count: ${caught.count}</div>
                            <div>Max Wt: ${caught.max_weight} kg</div>
                            <div>Max Lg: ${caught.max_length} cm</div>
                        </div>
                    </div>
                `;
            } else {
                // Secret placeholder
                card.innerHTML = `
                    <div class="fish-graphic-circle locked">
                        <span class="question">?</span>
                    </div>
                    <div class="fish-details">
                        <h4>???</h4>
                        <span class="rarity-badge hidden-rarity">LOCKED</span>
                        <p class="hints">Discovered in: ${fish.locations.map(l => GAME_DATA.locations.find(loc => loc.id === l)?.name).join(', ')}</p>
                    </div>
                `;
            }
            
            container.appendChild(card);
        });
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';
        
        GAME_DATA.achievements.forEach(ach => {
            const unlocked = this.game.player.achievements.includes(ach.id);
            const card = document.createElement('div');
            card.className = `ach-card ${unlocked ? 'unlocked' : 'locked'}`;

            card.innerHTML = `
                <div class="ach-icon ${unlocked ? 'glow' : ''}">🏆</div>
                <div class="ach-info">
                    <h5>${ach.name}</h5>
                    <p>${ach.desc}</p>
                    <span class="ach-reward">+${ach.reward} Coins Reward</span>
                </div>
                <div class="ach-status">
                    ${unlocked ? '<span class="status-yes">Completed</span>' : '<span class="status-no">Locked</span>'}
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderQuests() {
        const container = document.getElementById('quests-container');
        container.innerHTML = '';
        
        GAME_DATA.quests.forEach(q => {
            const current = this.game.player.questsProgress[q.id] || 0;
            const completed = current >= q.target;
            
            const card = document.createElement('div');
            card.className = `quest-card ${completed ? 'completed' : ''}`;
            
            const percent = (current / q.target) * 100;

            card.innerHTML = `
                <div class="quest-info">
                    <h5>${q.desc}</h5>
                    <span class="quest-reward">Reward: +${q.reward} Coins</span>
                </div>
                <div class="quest-progress">
                    <div class="bar">
                        <div class="fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="count">${current}/${q.target}</span>
                </div>
            `;
            container.appendChild(card);
        });
        
        this.updateDailyLoginCard();
    }

    updateDailyLoginCard() {
        const loginDay = this.game.player.dailyLoginDay || 0;
        const streakEl = document.getElementById('daily-streak-days');
        streakEl.innerHTML = '';

        for (let i = 1; i <= 7; i++) {
            const dayBox = document.createElement('div');
            dayBox.className = `day-box ${i <= loginDay ? 'claimed' : ''} ${i === loginDay + 1 ? 'current' : ''}`;
            
            const amt = [50, 100, 150, 200, 300, 400, 1000][i - 1];
            dayBox.innerHTML = `
                <div class="day-num">Day ${i}</div>
                <div class="reward-amt">${amt}g</div>
            `;
            streakEl.appendChild(dayBox);
        }
    }

    spinLuckyWheel() {
        if (this.isSpinning) return;
        
        const outcome = this.game.triggerLuckySpin();
        if (!outcome) return;

        this.isSpinning = true;
        const wheel = document.getElementById('wheel-spinner-graphic');
        
        // Spin animation: 4 full turns + random offset
        const targetRotations = 4;
        const randomAngle = Math.random() * 360;
        this.spinAngle += (targetRotations * 360) + randomAngle;
        
        wheel.style.transform = `rotate(${this.spinAngle}deg)`;

        setTimeout(() => {
            this.isSpinning = false;
            
            // Show outcome popup alert
            this.showNotification(`Spin Wheel reward: ${outcome.desc}!`);
        }, 3000); // matching css transition duration
    }

    async loadLeaderboard() {
        const lb = await API.getLeaderboard();
        const container = document.getElementById('leaderboard-tbody');
        if (!container) return;
        container.innerHTML = '';
        
        lb.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${user.username}</strong></td>
                <td>Level ${user.level}</td>
                <td>${user.coins}g</td>
            `;
            container.appendChild(row);
        });
    }

    async loadTournament() {
        const tourney = await API.getTournament();
        
        const nameEl = document.getElementById('tourney-name');
        const timerEl = document.getElementById('tourney-timer');
        const container = document.getElementById('tourney-tbody');
        
        if (nameEl) nameEl.textContent = tourney.tournament_name;
        if (timerEl) timerEl.textContent = tourney.time_left;
        if (!container) return;
        
        container.innerHTML = '';
        tourney.leaderboard.forEach(comp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${comp.rank}</td>
                <td><strong>${comp.username}</strong></td>
                <td>Score: ${comp.score}</td>
            `;
            container.appendChild(row);
        });
    }

    showCatchModal(data) {
        document.getElementById('catch-modal-title').textContent = data.isMinigame ? "Special Treasure Pulled!" : "Fish Caught!";
        document.getElementById('catch-name').textContent = data.name;
        document.getElementById('catch-rarity').textContent = data.rarity.toUpperCase();
        document.getElementById('catch-rarity').className = `rarity-badge ${data.rarity}`;
        
        document.getElementById('catch-weight').textContent = data.weight;
        document.getElementById('catch-length').textContent = data.length;
        
        document.getElementById('reward-coins').textContent = data.coins;
        document.getElementById('reward-xp').textContent = data.xp;

        // Custom circle display
        const displayCircle = document.getElementById('catch-display-circle');
        displayCircle.style.background = `linear-gradient(135deg, ${data.colors[0]}, ${data.colors[1]})`;

        const levelUpBanner = document.getElementById('levelup-banner');
        if (data.leveledUp) {
            levelUpBanner.style.display = 'block';
            this.showNotification(`LEVEL UP! You reached Level ${this.game.player.level}!`);
            this.renderLocationsList(); // rechecks unlock requirements
        } else {
            levelUpBanner.style.display = 'none';
        }

        document.getElementById('catch-modal').classList.add('active');
        
        // Refresh stats
        this.renderCollectionBook();
        this.renderAchievements();
        this.loadLeaderboard();
        this.loadTournament();
    }

    showNotification(msg) {
        const container = document.getElementById('notification-overlay');
        const alert = document.createElement('div');
        alert.className = 'notif-bubble';
        alert.textContent = msg;
        
        container.appendChild(alert);
        
        // trigger slides
        setTimeout(() => alert.classList.add('show'), 10);
        
        // remove after 3s
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 400);
        }, 3000);
    }
}
