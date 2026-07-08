class FishingGameController {
    constructor() {
        this.canvasEngine = null;
        
        // Game states
        this.states = {
            IDLE: 'idle',
            CASTING: 'casting',
            WAITING: 'waiting',
            BITING: 'biting',
            FIGHTING: 'fighting',
            CELEBRATION: 'celebrating'
        };
        this.currentState = this.states.IDLE;
        
        // Settings & stats
        this.player = {
            level: 1,
            xp: 0,
            xpNeeded: 100,
            coins: 100,
            upgrades: {
                rod: 'wooden',
                reel: 'basic',
                hook: 'small',
                line: 'nylon',
                bait: 'worm'
            },
            caught: {},
            achievements: [],
            locations: ['beach_shore'],
            currentLocation: 'beach_shore',
            lifetimeCoins: 0,
            dailyLoginDay: 0,
            lastLoginDate: null,
            questsProgress: {}
        };
        
        // Time & environment
        this.gameTime = 800; // 0 to 2400 (noon is 1200, night is 2000+)
        this.weather = 'sunny'; // sunny, cloudy, rain, storm
        this.timeOfDay = 'day'; // morning, day, sunset, night
        
        // Cast power control
        this.castPower = 0;
        this.powerCharging = false;
        this.powerDirection = 1; // 1 for charging up, -1 for charging down
        
        // Active bobber physics coordinates
        this.bobberX = 0;
        this.bobberY = 0;
        this.castPhase = 0; // 0 to 1 projectile flight
        this.castTargetX = 0;
        this.castTargetY = 290;
        
        // Waiting stage variables
        this.waitTimer = 0;
        this.biteTimer = 0;
        this.reactionTimer = 0;
        
        // Fighting stage variables
        this.activeFish = null;
        this.catchProgress = 30; // 0 to 100
        this.tension = 10; // 0 to 100
        this.fishShadowX = 600;
        this.fishShadowY = 310;
        this.fishDir = 1;
        this.fishBehaviorTimer = 0;
        this.fishBehavior = 'calm'; // calm, pulling, jumping
        
        // Jump animation variables
        this.isFishJumping = false;
        this.jumpX = 0;
        this.jumpY = 0;
        this.jumpRotation = 0;
        this.jumpTime = 0;
        
        // Line snapped state
        this.isLineSnapped = false;
        this.lineSnapTimer = 0;
        
        // Active minigames
        this.activeMinigame = null; // null, 'treasure', 'shark', 'bottle'
        this.goldRushTimer = 0; // if > 0, golden fish rush active
        
        // UI link callbacks
        this.uiCallback = null;
    }

    init(canvasEngine, uiCallback) {
        this.canvasEngine = canvasEngine;
        this.uiCallback = uiCallback;
        
        // Generate random weather initially
        this.randomizeWeather();
    }

    update(dt) {
        // Increment game time
        this.gameTime = (this.gameTime + dt * 0.1) % 2400;
        this.updateTimeOfDay();
        
        // Decay gold rush
        if (this.goldRushTimer > 0) {
            this.goldRushTimer -= dt * 0.05;
            if (this.goldRushTimer <= 0) {
                this.goldRushTimer = 0;
                this.triggerUIUpdate();
            }
        }

        // Random weather changes
        if (Math.random() < 0.0002) {
            this.randomizeWeather();
        }

        // Update canvas elements
        this.canvasEngine.update(this.currentState, this.getStateData(), dt, this.gameTime, this.weather);

        // Core state machine updates
        switch(this.currentState) {
            case this.states.IDLE:
                if (this.powerCharging) {
                    this.castPower += 2 * this.powerDirection * dt * 0.05;
                    if (this.castPower >= 100) {
                        this.castPower = 100;
                        this.powerDirection = -1;
                    } else if (this.castPower <= 0) {
                        this.castPower = 0;
                        this.powerDirection = 1;
                    }
                    this.triggerUIUpdate();
                }
                break;
                
            case this.states.CASTING:
                this.castPhase += 0.03 * dt * 0.05;
                if (this.castPhase >= 1.0) {
                    this.castPhase = 1.0;
                    this.currentState = this.states.WAITING;
                    this.bobberX = this.castTargetX;
                    this.bobberY = this.castTargetY;
                    this.canvasEngine.spawnSplash(this.bobberX, this.bobberY, 15, 3.5);
                    Sounds.playSplash();
                    
                    // Start wait timer: 2 to 8 seconds
                    this.waitTimer = 2000 + Math.random() * 6000;
                } else {
                    // Quadratic arc projectile formula
                    const startX = 225; // approximate rod tip location
                    const startY = 315;
                    const controlX = (startX + this.castTargetX) / 2;
                    const controlY = startY - 120; // peak height of throw
                    
                    const t = this.castPhase;
                    this.bobberX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * this.castTargetX;
                    this.bobberY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * this.castTargetY;
                    
                    // Spawn ripples behind flying bobber
                    if (Math.random() < 0.1) {
                        this.canvasEngine.spawnBubbles(this.bobberX, this.bobberY + 2, 1);
                    }
                }
                break;
                
            case this.states.WAITING:
                this.waitTimer -= dt * 16.67; // approx ms per frame
                this.bobberY = this.castTargetY + Math.sin(Date.now() * 0.003) * 2.5; // gentle bobbing
                
                if (Math.random() < 0.015) {
                    this.canvasEngine.spawnBubbles(this.bobberX, this.bobberY + 3, 2);
                }

                if (this.waitTimer <= 0) {
                    this.triggerBite();
                }
                break;
                
            case this.states.BITING:
                this.reactionTimer -= dt * 16.67;
                // Bobber oscillates rapidly downwards
                this.bobberY = this.castTargetY + 5 + Math.sin(Date.now() * 0.03) * 6;
                
                if (Math.random() < 0.2) {
                    this.canvasEngine.spawnSplash(this.bobberX, this.bobberY, 2, 1);
                }

                if (this.reactionTimer <= 0) {
                    // Fish got away!
                    this.canvasEngine.spawnSplash(this.bobberX, this.bobberY, 8, 2);
                    this.currentState = this.states.IDLE;
                    this.triggerUIUpdate();
                    this.notifyUser("The fish got away... too slow!");
                }
                break;
                
            case this.states.FIGHTING:
                this.updateFight(dt);
                break;

            case this.states.CELEBRATION:
                // Celebratory loop handled visually
                break;
        }

        // Draw the canvas elements
        const tensionInfo = { tension: this.tension, maxTension: 100 };
        this.canvasEngine.draw(this.currentState, this.getStateData(), this.timeOfDay, this.weather, tensionInfo);
    }

    startCastingPower() {
        if (this.currentState !== this.states.IDLE) return;
        this.powerCharging = true;
        this.castPower = 0;
        this.powerDirection = 1;
        this.isLineSnapped = false;
        Sounds.init(); // Initialize synthetic audio context on action
    }

    releaseCast() {
        if (!this.powerCharging) return;
        this.powerCharging = false;
        this.currentState = this.states.CASTING;
        this.castPhase = 0.0;
        
        // Target distance based on cast power
        const minDistance = 420;
        const maxDistance = 830;
        this.castTargetX = minDistance + (this.castPower / 100) * (maxDistance - minDistance);
        
        // Add tiny variance to landing point
        this.castTargetX += (Math.random() - 0.5) * 30;
        this.castTargetY = 290 + (Math.random() - 0.5) * 12; // wave baseline
        
        Sounds.playCast();
        this.triggerUIUpdate();
    }

    cancelCast() {
        // Reel back early
        if (this.currentState === this.states.WAITING || this.currentState === this.states.BITING) {
            Sounds.playCast();
            this.currentState = this.states.IDLE;
            this.triggerUIUpdate();
        }
    }

    triggerBite() {
        this.currentState = this.states.BITING;
        
        // Reaction window based on upgrades. Hooks increases time window.
        let reactionWindow = 1800; // base 1.8 seconds
        if (this.player.upgrades.hook === 'sharp') reactionWindow += 300;
        if (this.player.upgrades.hook === 'premium') reactionWindow += 600;
        
        // Randomly pick if this is a minigame encounter (15% chance total)
        const encounterRoll = Math.random();
        if (encounterRoll < 0.05) {
            this.activeMinigame = 'treasure';
            reactionWindow += 500; // easy bite
        } else if (encounterRoll < 0.08) {
            this.activeMinigame = 'bottle';
            reactionWindow += 500;
        } else if (encounterRoll < 0.12 && ['deep_dock', 'pirate_bay', 'legendary_cove'].includes(this.player.currentLocation)) {
            this.activeMinigame = 'shark';
            reactionWindow -= 300; // very fast bite alert
        } else {
            this.activeMinigame = null;
        }
        
        this.reactionTimer = reactionWindow;
        Sounds.playBite();
        this.triggerUIUpdate();
    }

    hookFish() {
        if (this.currentState !== this.states.BITING) return;
        
        if (this.activeMinigame === 'treasure') {
            this.activeFish = {
                name: "Rusty Treasure Chest",
                rarity: "epic",
                difficulty: 0.65,
                colors: ["#8b5a2b", "#3d2314"],
                minW: 10, maxW: 40,
                minL: 30, maxL: 70
            };
        } else if (this.activeMinigame === 'bottle') {
            this.activeFish = {
                name: "Message in a Bottle",
                rarity: "uncommon",
                difficulty: 0.3,
                colors: ["#cce6ff", "#0059b3"],
                minW: 0.5, maxW: 1.2,
                minL: 20, maxL: 30
            };
        } else if (this.activeMinigame === 'shark') {
            this.activeFish = {
                name: "Furious Great White Shark",
                rarity: "legendary",
                difficulty: 0.95,
                colors: ["#708090", "#2f4f4f"],
                minW: 120, maxW: 500,
                minL: 180, maxL: 450
            };
        } else {
            // Pick a regular fish
            this.activeFish = this.rollForFish();
        }

        this.currentState = this.states.FIGHTING;
        this.catchProgress = 30; // start at 30%
        this.tension = 15;
        this.fishShadowX = this.bobberX;
        this.fishShadowY = 310;
        
        // Initial setup for fish AI
        this.fishBehaviorTimer = 1000;
        this.fishBehavior = 'calm';
        this.isFishJumping = false;
        
        this.triggerUIUpdate();
        this.notifyUser(`Hooked a ${this.activeFish.name}! Reeling starting!`);
    }

    rollForFish() {
        const loc = this.player.currentLocation;
        
        // Filters available fish species for this location and required level
        let available = GAME_DATA.fish.filter(f => f.locations.includes(loc));
        if (available.length === 0) {
            // fallback if anything goes wrong
            available = GAME_DATA.fish.filter(f => f.locations.includes('beach_shore'));
        }

        // Apply bait modifiers
        // bait attraction rates: worm (attracts common), shrimp (uncommon/rare), squid (epic), special (legendary)
        let bait = this.player.upgrades.bait;
        
        // Weight probabilities based on bait, weather, and gold rush
        let commonWeight = 70;
        let uncommonWeight = 20;
        let rareWeight = 8;
        let epicWeight = 2;
        let legendaryWeight = 0;

        if (bait === 'shrimp') {
            commonWeight = 40; uncommonWeight = 40; rareWeight = 15; epicWeight = 5;
        } else if (bait === 'squid') {
            commonWeight = 20; uncommonWeight = 30; rareWeight = 30; epicWeight = 18; legendaryWeight = 2;
        } else if (bait === 'special') {
            commonWeight = 10; uncommonWeight = 20; rareWeight = 35; epicWeight = 25; legendaryWeight = 10;
        }

        // Weather modifiers
        if (this.weather === 'storm') {
            legendaryWeight += 10;
            epicWeight += 10;
        } else if (this.weather === 'rain') {
            rareWeight += 10;
        }

        // Gold Rush multiplier
        if (this.goldRushTimer > 0) {
            legendaryWeight *= 3.0;
            epicWeight *= 2.5;
            rareWeight *= 2.0;
        }

        // Select by rarity based on rolling weights
        const roll = Math.random() * (commonWeight + uncommonWeight + rareWeight + epicWeight + legendaryWeight);
        let selectedRarity = 'common';
        
        let sum = commonWeight;
        if (roll < sum) selectedRarity = 'common';
        else {
            sum += uncommonWeight;
            if (roll < sum) selectedRarity = 'uncommon';
            else {
                sum += rareWeight;
                if (roll < sum) selectedRarity = 'rare';
                else {
                    sum += epicWeight;
                    if (roll < sum) selectedRarity = 'epic';
                    else selectedRarity = 'legendary';
                }
            }
        }

        // Filter by the rolled rarity
        let rarityPool = available.filter(f => f.rarity === selectedRarity);
        if (rarityPool.length === 0) {
            // fallback
            rarityPool = available;
        }
        
        // Return a random fish from the matching pool
        const fish = rarityPool[Math.floor(Math.random() * rarityPool.length)];
        return fish;
    }

    updateFight(dt) {
        if (!this.activeFish) return;

        // Reel and Rod modifiers
        let reelMultiplier = 1.0;
        if (this.player.upgrades.reel === 'pro') reelMultiplier = 1.4;
        if (this.player.upgrades.reel === 'turbo') reelMultiplier = 2.0;

        let rodMultiplier = 1.0;
        if (this.player.upgrades.rod === 'fiberglass') rodMultiplier = 0.85; // dampens pull by 15%
        if (this.player.upgrades.rod === 'carbon') rodMultiplier = 0.70; // restores tension faster
        if (this.player.upgrades.rod === 'titanium') rodMultiplier = 0.50; // cuts thrashes by 50%

        let lineMultiplier = 1.0;
        if (this.player.upgrades.line === 'braided') lineMultiplier = 0.67; // tension builds slower
        if (this.player.upgrades.line === 'ultra_strong') lineMultiplier = 0.45;

        // Fish AI Behavior schedule
        this.fishBehaviorTimer -= dt * 16.67;
        if (this.fishBehaviorTimer <= 0) {
            // Decide next behavior state
            const r = Math.random();
            const diff = this.activeFish.difficulty; // 0 to 1
            
            if (r < 0.45 - diff * 0.2) {
                this.fishBehavior = 'calm';
                this.fishBehaviorTimer = 1000 + Math.random() * 2000;
            } else if (r < 0.85 - diff * 0.1) {
                this.fishBehavior = 'pulling';
                this.fishBehaviorTimer = 800 + Math.random() * 1500;
            } else {
                this.fishBehavior = 'jumping';
                this.fishBehaviorTimer = 1000 + Math.random() * 1000;
                
                // Initialize jump physics
                this.isFishJumping = true;
                this.jumpX = this.fishShadowX;
                this.jumpY = 290;
                this.jumpTime = 0.0;
                this.jumpRotation = -0.4;
                Sounds.playSplash();
                this.canvasEngine.spawnSplash(this.jumpX, 290, 10, 4);
            }
        }

        // Apply automatic fish pulling strength
        let fishPullStrength = (0.05 + this.activeFish.difficulty * 0.15) * dt * 0.05;
        let tensionIncrease = 0.0;

        if (this.fishBehavior === 'pulling') {
            fishPullStrength *= 1.8;
            tensionIncrease = (0.2 + this.activeFish.difficulty * 0.5) * rodMultiplier * lineMultiplier * dt * 0.05;
            this.bobberY = this.castTargetY + 10 + Math.sin(Date.now() * 0.05) * 5;
            
            if (Math.random() < 0.15) {
                this.canvasEngine.spawnBubbles(this.fishShadowX, this.fishShadowY, 1);
            }
        } else if (this.fishBehavior === 'jumping') {
            // Handle active jumping physics
            this.jumpTime += 0.04 * dt * 0.05;
            
            // Parabolic jump path
            const peakHeight = 80 + this.activeFish.difficulty * 60;
            this.jumpY = 290 - Math.sin(this.jumpTime * Math.PI) * peakHeight;
            this.jumpRotation = (this.jumpTime - 0.5) * Math.PI;
            
            // Follow jump horizontal drift
            this.jumpX += this.fishDir * 1.5 * dt * 0.05;
            this.fishShadowX = this.jumpX;

            if (this.jumpTime >= 1.0) {
                this.isFishJumping = false;
                this.fishBehavior = 'calm';
                this.fishBehaviorTimer = 1000;
                Sounds.playSplash();
                this.canvasEngine.spawnSplash(this.jumpX, 290, 12, 3);
            }

            // Spike tension if reeling during jump
            if (this.isReelingActive) {
                tensionIncrease = (0.4 + this.activeFish.difficulty * 0.7) * rodMultiplier * lineMultiplier * dt * 0.05;
            }
            this.bobberY = this.jumpY;
        } else {
            // Calm state
            this.bobberY = this.castTargetY + Math.sin(Date.now() * 0.01) * 3;
            // Decay tension naturally
            const decayRate = (this.player.upgrades.rod === 'carbon' ? 0.3 : 0.15);
            this.tension = Math.max(10, this.tension - decayRate * dt * 0.05);
        }

        // Pull catch progress back based on fish resistance
        this.catchProgress = Math.max(0, this.catchProgress - fishPullStrength * 6);

        // Update visual fish shadow swimming
        const swimSpeed = (2.0 + this.activeFish.difficulty * 3.0) * dt * 0.05;
        this.fishShadowX += this.fishDir * swimSpeed;
        
        // Boundary bounce inside sea visual area (400 to 850)
        if (this.fishShadowX > 830) {
            this.fishShadowX = 830;
            this.fishDir = -1;
        } else if (this.fishShadowX < 400) {
            this.fishShadowX = 400;
            this.fishDir = 1;
        }
        
        if (!this.isFishJumping) {
            this.bobberX = this.fishShadowX;
        }

        // Process Reeling Active (input is held)
        if (this.isReelingActive) {
            // Reel speeds fills progress
            const reelRate = 0.25 * reelMultiplier * dt * 0.05;
            this.catchProgress = Math.min(100, this.catchProgress + reelRate * 12);
            
            // Reeling increases tension
            const buildRate = (0.12 + this.activeFish.difficulty * 0.15) * lineMultiplier * dt * 0.05;
            this.tension = Math.min(100, this.tension + buildRate * 8 + tensionIncrease);

            if (Math.random() < 0.2) {
                Sounds.playReel();
            }
        } else {
            // Natural tension decay if user releases reel
            const releaseDecay = 0.35 * dt * 0.05;
            this.tension = Math.max(10, this.tension - releaseDecay * 8);
        }

        // Check fail state: tension breaks line
        if (this.tension >= 100) {
            this.snapLine();
        }

        // Check fail state: progress hits 0 (fish escapes)
        if (this.catchProgress <= 0) {
            this.currentState = this.states.IDLE;
            this.isReelingActive = false;
            Sounds.playCast(); // swoosh out
            this.triggerUIUpdate();
            this.notifyUser(`${this.activeFish.name} swam away!`);
        }

        // Check victory state: catch progress reaches 100
        if (this.catchProgress >= 100) {
            this.catchFishSuccess();
        }
    }

    snapLine() {
        Sounds.playSnap();
        this.isLineSnapped = true;
        this.currentState = this.states.IDLE;
        this.isReelingActive = false;
        this.tension = 10;
        this.triggerUIUpdate();
        this.notifyUser("Snap! The line broke!");
    }

    catchFishSuccess() {
        this.currentState = this.states.CELEBRATION;
        this.isReelingActive = false;
        Sounds.playVictory();
        
        const fish = this.activeFish;
        
        // Generate actual specs
        const weight = (Math.random() * (fish.maxW - fish.minW) + fish.minW).toFixed(2);
        const length = (Math.random() * (fish.maxL - fish.minL) + fish.minL).toFixed(1);
        
        // Coins and XP rewards
        let rarityMult = 1;
        if (fish.rarity === 'uncommon') rarityMult = 2;
        if (fish.rarity === 'rare') rarityMult = 4;
        if (fish.rarity === 'epic') rarityMult = 8;
        if (fish.rarity === 'legendary') rarityMult = 20;

        let coinReward = Math.round(fish.price * (weight / fish.minW) * 0.8);
        let xpReward = Math.round(15 * rarityMult + (fish.difficulty * 20));

        // Award
        this.player.coins += coinReward;
        this.player.lifetimeCoins += coinReward;
        this.player.xp += xpReward;

        // Record caught fish in encyclopedia database
        if (!this.player.caught[fish.name]) {
            this.player.caught[fish.name] = { count: 0, max_weight: 0, max_length: 0 };
        }
        
        const stat = this.player.caught[fish.name];
        stat.count++;
        stat.max_weight = Math.max(stat.max_weight, parseFloat(weight));
        stat.max_length = Math.max(stat.max_length, parseFloat(length));

        // Sparkle particles at fisherman
        this.canvasEngine.spawnSparkles(180, 310, 20);

        // Process Quests progress
        this.updateQuestsProgress('catch_count', 1);
        this.updateQuestsProgress('earn_coins', coinReward);
        if (fish.rarity === 'rare' || fish.rarity === 'epic' || fish.rarity === 'legendary') {
            this.updateQuestsProgress('catch_rare', 1);
        }
        this.updateQuestsProgress('safe_catches', 1);

        // Process achievements
        this.checkAchievements();
        
        // Check levels
        let leveledUp = false;
        while (this.player.xp >= this.player.xpNeeded && this.player.level < 100) {
            this.player.xp -= this.player.xpNeeded;
            this.player.level++;
            this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
            leveledUp = true;
        }

        // Store catch result details temporarily for modal display
        this.lastCatchData = {
            name: fish.name,
            rarity: fish.rarity,
            weight: weight,
            length: length,
            coins: coinReward,
            xp: xpReward,
            leveledUp: leveledUp,
            isMinigame: this.activeMinigame !== null,
            colors: fish.colors
        };

        // Auto save state
        this.saveProgress();

        this.triggerUIUpdate();
        
        // Open caught modal in UI
        if (this.uiCallback) {
            this.uiCallback('show_catch_modal', this.lastCatchData);
        }
    }

    closeCelebration() {
        if (this.currentState === this.states.CELEBRATION) {
            this.currentState = this.states.IDLE;
            this.activeFish = null;
            this.activeMinigame = null;
            this.triggerUIUpdate();
        }
    }

    setReeling(active) {
        if (this.currentState === this.states.FIGHTING) {
            this.isReelingActive = active;
        }
    }

    triggerUIUpdate() {
        if (this.uiCallback) {
            this.uiCallback('update_hud', this.player);
        }
    }

    notifyUser(msg) {
        if (this.uiCallback) {
            this.uiCallback('notify', msg);
        }
    }

    updateTimeOfDay() {
        if (this.gameTime >= 400 && this.gameTime < 800) {
            this.timeOfDay = 'morning';
        } else if (this.gameTime >= 800 && this.gameTime < 1600) {
            this.timeOfDay = 'day';
        } else if (this.gameTime >= 1600 && this.gameTime < 2000) {
            this.timeOfDay = 'sunset';
        } else {
            this.timeOfDay = 'night';
        }
    }

    randomizeWeather() {
        const weathers = ['sunny', 'cloudy', 'rain', 'storm'];
        // Sunny is most likely
        const rolls = [0.5, 0.25, 0.15, 0.1];
        const r = Math.random();
        
        let sum = 0;
        for (let i = 0; i < weathers.length; i++) {
            sum += rolls[i];
            if (r < sum) {
                this.weather = weathers[i];
                break;
            }
        }
        this.notifyUser(`The weather is now: ${this.weather.toUpperCase()}`);
        this.triggerUIUpdate();
    }

    triggerLuckySpin() {
        if (this.player.coins < 50) {
            this.notifyUser("Need 50 coins to spin the wheel!");
            return null;
        }
        
        this.player.coins -= 50;
        
        // Spin results: coins, items, powerups
        const outcomes = [
            { type: 'coins', amount: 20, weight: 30, desc: '20 Coins' },
            { type: 'coins', amount: 100, weight: 20, desc: '100 Coins (Super!)' },
            { type: 'coins', amount: 500, weight: 5, desc: '500 Coins (Jackpot!)' },
            { type: 'xp', amount: 50, weight: 25, desc: '50 XP' },
            { type: 'gold_rush', amount: 60, weight: 15, desc: '60s Gold Rush!' }, // double rare chance
            { type: 'bait', amount: 3, weight: 5, desc: '3x Special Lure' }
        ];

        // Weighted random select
        const totalW = outcomes.reduce((sum, o) => sum + o.weight, 0);
        let roll = Math.random() * totalW;
        let chosen = outcomes[0];
        
        let s = 0;
        for (let i = 0; i < outcomes.length; i++) {
            s += outcomes[i].weight;
            if (roll < s) {
                chosen = outcomes[i];
                break;
            }
        }

        // Apply reward
        if (chosen.type === 'coins') {
            this.player.coins += chosen.amount;
            this.player.lifetimeCoins += chosen.amount;
        } else if (chosen.type === 'xp') {
            this.player.xp += chosen.amount;
            // check level up
            while (this.player.xp >= this.player.xpNeeded && this.player.level < 100) {
                this.player.xp -= this.player.xpNeeded;
                this.player.level++;
                this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
            }
        } else if (chosen.type === 'gold_rush') {
            this.goldRushTimer = chosen.amount; // 60 seconds
        } else if (chosen.type === 'bait') {
            // Instantly gives player squid or special lure bait levels
            this.player.coins += 150; // Cash refund equivalent
        }

        this.saveProgress();
        this.triggerUIUpdate();
        
        return chosen;
    }

    claimDailyReward() {
        const today = new Date().toDateString();
        if (this.player.lastLoginDate === today) {
            this.notifyUser("Daily reward already claimed today!");
            return false;
        }

        this.player.dailyLoginDay = (this.player.dailyLoginDay % 7) + 1;
        this.player.lastLoginDate = today;

        const dailyRewards = [50, 100, 150, 200, 300, 400, 1000]; // Day 7 is jackpot 1000 coins
        const amt = dailyRewards[this.player.dailyLoginDay - 1];
        
        this.player.coins += amt;
        this.player.lifetimeCoins += amt;
        this.notifyUser(`Claimed Daily Login Day ${this.player.dailyLoginDay}: +${amt} Coins!`);
        
        this.saveProgress();
        this.triggerUIUpdate();
        return true;
    }

    buyUpgrade(type, upgradeId, cost) {
        if (this.player.coins < cost) {
            this.notifyUser("Not enough coins for this upgrade!");
            return false;
        }
        
        this.player.coins -= cost;
        this.player.upgrades[type] = upgradeId;
        
        this.notifyUser(`Purchased upgrade: ${upgradeId.toUpperCase()}`);
        this.checkAchievements();
        this.saveProgress();
        this.triggerUIUpdate();
        return true;
    }

    unlockLocation(locId, levelReq, cost) {
        if (this.player.level < levelReq) {
            this.notifyUser(`Need Level ${levelReq} to unlock this area!`);
            return false;
        }

        if (this.player.coins < cost) {
            this.notifyUser("Not enough coins to unlock this location!");
            return false;
        }

        this.player.coins -= cost;
        this.player.locations.push(locId);
        this.notifyUser(`Unlocked location: ${locId.toUpperCase()}`);
        this.checkAchievements();
        this.saveProgress();
        this.triggerUIUpdate();
        return true;
    }

    setLocation(locId) {
        if (!this.player.locations.includes(locId)) {
            this.notifyUser("Location is locked!");
            return false;
        }
        this.player.currentLocation = locId;
        this.notifyUser(`Traveled to: ${locId.toUpperCase()}`);
        
        // Randomize weather on location change
        this.randomizeWeather();
        
        this.triggerUIUpdate();
        return true;
    }

    updateQuestsProgress(type, amount) {
        GAME_DATA.quests.forEach(q => {
            if (q.type === type) {
                if (!this.player.questsProgress[q.id]) {
                    this.player.questsProgress[q.id] = 0;
                }
                if (this.player.questsProgress[q.id] < q.target) {
                    this.player.questsProgress[q.id] = Math.min(q.target, this.player.questsProgress[q.id] + amount);
                    if (this.player.questsProgress[q.id] === q.target) {
                        // Quest completed!
                        this.player.coins += q.reward;
                        this.player.lifetimeCoins += q.reward;
                        this.notifyUser(`Quest Completed: ${q.desc}! Reward: +${q.reward} Coins.`);
                    }
                }
            }
        });
    }

    checkAchievements() {
        const addAch = (id) => {
            if (!this.player.achievements.includes(id)) {
                this.player.achievements.push(id);
                const definition = GAME_DATA.achievements.find(a => a.id === id);
                if (definition) {
                    this.player.coins += definition.reward;
                    this.player.lifetimeCoins += definition.reward;
                    this.notifyUser(`Achievement Unlocked: ${definition.name}! Reward: +${definition.reward} Coins.`);
                }
            }
        };

        // Achievement: first_fish
        const totalCaught = Object.values(this.player.caught).reduce((sum, stat) => sum + stat.count, 0);
        if (totalCaught >= 1) addAch('first_fish');
        if (totalCaught >= 50) addAch('fifty_fish');
        if (totalCaught >= 100) addAch('hundred_fish');

        // Check rarities
        let maxRarity = 'common';
        for (let name in this.player.caught) {
            const definition = GAME_DATA.fish.find(f => f.name === name);
            if (definition) {
                const r = definition.rarity;
                if (r === 'rare') addAch('rare_hunter');
                if (r === 'epic') addAch('epic_conqueror');
                if (r === 'legendary') addAch('legendary_master');
            }
        }

        // Upgrade maxed
        if (this.player.upgrades.rod === 'titanium' || this.player.upgrades.reel === 'turbo' || this.player.upgrades.line === 'ultra_strong') {
            addAch('upgrade_maxed');
        }

        // Lifetime coins
        if (this.player.lifetimeCoins >= 10000) {
            addAch('millionaire');
        }

        // All locations unlocked (8 locations)
        if (this.player.locations.length === GAME_DATA.locations.length) {
            addAch('all_locations');
        }
    }

    async saveProgress() {
        const payload = {
            coins: this.player.coins,
            xp: this.player.xp,
            level: this.player.level,
            upgrades: this.player.upgrades,
            caught: this.player.caught,
            achievements: this.player.achievements,
            locations: this.player.locations,
            lifetimeCoins: this.player.lifetimeCoins,
            dailyLoginDay: this.player.dailyLoginDay,
            lastLoginDate: this.player.lastLoginDate,
            questsProgress: this.player.questsProgress
        };
        await API.save(payload);
    }

    async loadProgress() {
        const saved = await API.load();
        if (saved) {
            this.player.coins = saved.coins ?? 100;
            this.player.xp = saved.xp ?? 0;
            this.player.level = saved.level ?? 1;
            this.player.upgrades = Object.assign({}, this.player.upgrades, saved.upgrades);
            this.player.caught = saved.caught ?? {};
            this.player.achievements = saved.achievements ?? [];
            this.player.locations = saved.locations ?? ['beach_shore'];
            this.player.lifetimeCoins = saved.lifetimeCoins ?? 100;
            this.player.dailyLoginDay = saved.dailyLoginDay ?? 0;
            this.player.lastLoginDate = saved.lastLoginDate ?? null;
            this.player.questsProgress = saved.questsProgress ?? {};
            
            // Check levels scaling
            this.player.xpNeeded = 100;
            for (let i = 1; i < this.player.level; i++) {
                this.player.xpNeeded = Math.round(this.player.xpNeeded * 1.35);
            }
            
            this.triggerUIUpdate();
            this.notifyUser("Welcome back! Progress loaded.");
            return true;
        }
        return false;
    }

    getStateData() {
        const locColors = GAME_DATA.locations.find(l => l.id === this.player.currentLocation)?.colors || {
            sky: ['#ff7e5f', '#feb47b'], sea: ['#00c6ff', '#0072ff'], beach: '#f1e4c3'
        };

        return {
            castPhase: this.castPhase,
            bobberX: this.bobberX,
            bobberY: this.bobberY,
            isLineSnapped: this.isLineSnapped,
            caughtFish: this.activeFish,
            fishShadowX: this.fishShadowX,
            fishShadowY: this.fishShadowY,
            fishDifficulty: this.activeFish ? this.activeFish.difficulty : 0.5,
            fishColors: this.activeFish ? this.activeFish.colors : ['#a8c0ff', '#3f2b96'],
            isFishJumping: this.isFishJumping,
            jumpX: this.jumpX,
            jumpY: this.jumpY,
            jumpRotation: this.jumpRotation,
            locationColors: locColors
        };
    }
}
