const GAME_DATA = {
    // 8 Locations
    locations: [
        { id: 'beach_shore', name: 'Beach Shore', level: 1, cost: 0, desc: 'A serene sandy beach with gentle waves. Home to common coastal fish.', colors: { sky: ['#ff7e5f', '#feb47b'], sea: ['#00c6ff', '#0072ff'], beach: '#f1e4c3' } },
        { id: 'rocky_coast', name: 'Rocky Coast', level: 5, cost: 200, desc: 'Sharp cliffs and rough tide pools. Craggy shelters hide larger, agile species.', colors: { sky: ['#3a7bd5', '#3a6073'], sea: ['#1e3c72', '#2a5298'], beach: '#787878' } },
        { id: 'deep_dock', name: 'Deep Ocean Dock', level: 12, cost: 800, desc: 'A long industrial pier extending into deep blue currents where heavy fish lurk.', colors: { sky: ['#4b6cb7', '#182848'], sea: ['#0f2027', '#203a43', '#2c5364'], beach: '#4e4e4e' } },
        { id: 'tropical_island', name: 'Tropical Island', level: 20, cost: 2000, desc: 'Coral reefs teeming with vibrant, exotic, and extremely fast marine life.', colors: { sky: ['#00b4db', '#0083b0'], sea: ['#43c6ac', '#191654'], beach: '#fffdf6' } },
        { id: 'pirate_bay', name: 'Pirate Bay', level: 30, cost: 5000, desc: 'A mysterious shipwreck graveyard containing treasure and aggressive predators.', colors: { sky: ['#833ab4', '#fd1d1d', '#fcb045'], sea: ['#141e30', '#243b55'], beach: '#d0c3aa' } },
        { id: 'frozen_lake', name: 'Frozen Lake', level: 40, cost: 10000, desc: 'An icy, snow-covered landscape harboring rare glacial and deep-freeze monsters.', colors: { sky: ['#e6dada', '#274046'], sea: ['#7decff', '#1c4a5e'], beach: '#ffffff' } },
        { id: 'volcano_coast', name: 'Volcano Coast', level: 55, cost: 25000, desc: 'Fiery vents heat the deep channels. Home to heat-resistant mutated sea beasts.', colors: { sky: ['#f857a6', '#ff5858'], sea: ['#4a0e17', '#0f0204'], beach: '#333333' } },
        { id: 'legendary_cove', name: 'Secret Legendary Cove', level: 75, cost: 60000, desc: 'A hidden, glowing cavern where ancient water dragons and mythical species sleep.', colors: { sky: ['#0f2027', '#203a43', '#2c5364'], sea: ['#000428', '#004e92'], beach: '#112233' } }
    ],

    // Upgrades
    upgrades: {
        rod: [
            { id: 'wooden', name: 'Wooden Rod', cost: 0, level: 1, multiplier: 1.0, desc: 'A basic branch with standard string. Flexible but fragile.' },
            { id: 'fiberglass', name: 'Fiberglass Rod', cost: 150, level: 3, multiplier: 1.3, desc: 'Stronger flexible core, dampens fish pull resistance by 15%.' },
            { id: 'carbon', name: 'Carbon Rod', cost: 600, level: 10, multiplier: 1.8, desc: 'Ultra-lightweight aerospace material. Restores tension 30% faster.' },
            { id: 'titanium', name: 'Titanium Rod', cost: 2500, level: 25, multiplier: 2.5, desc: 'Indestructible frame. Cuts heavy thrashing tension increases in half.' }
        ],
        reel: [
            { id: 'basic', name: 'Basic Reel', cost: 0, level: 1, speed: 1.0, desc: 'Standard rusty crank. Gets the job done slowly.' },
            { id: 'pro', name: 'Pro Reel', cost: 250, level: 5, speed: 1.4, desc: 'Precision ball-bearings. Speeds up reeling progress by 40%.' },
            { id: 'turbo', name: 'Turbo Reel', cost: 1000, level: 15, speed: 2.0, desc: 'High gear ratio system. Reeling fills the catch bar twice as fast.' }
        ],
        hook: [
            { id: 'small', name: 'Small Hook', cost: 0, level: 1, catchChance: 1.0, desc: 'Tiny copper hook. Good for tiny mouths.' },
            { id: 'sharp', name: 'Sharp Hook', cost: 100, level: 2, catchChance: 1.25, desc: 'Barbed steel hooks. Reduces chance of fish shaking loose.' },
            { id: 'premium', name: 'Premium Hook', cost: 800, level: 14, catchChance: 1.6, desc: 'Chemically sharpened titanium. Increases catch window significantly.' }
        ],
        line: [
            { id: 'nylon', name: 'Nylon Line', cost: 0, level: 1, strength: 1.0, desc: 'Standard line, breaks under heavy loads.' },
            { id: 'braided', name: 'Braided Line', cost: 300, level: 8, strength: 1.5, desc: 'Tightly woven fibers. Tension bar builds up 33% slower.' },
            { id: 'ultra_strong', name: 'Ultra Strong Line', cost: 1200, level: 18, strength: 2.2, desc: 'Military grade fluorocarbon. Almost impossible for small fish to snap.' }
        ],
        bait: [
            { id: 'worm', name: 'Earthworm', cost: 0, level: 1, attraction: 1.0, desc: 'Juicy local worms. Attracts common shore fish.' },
            { id: 'shrimp', name: 'Fresh Shrimp', cost: 50, level: 4, attraction: 1.3, desc: 'Vibrant smelling. Higher chance for uncommon and rare fish.' },
            { id: 'squid', name: 'Squid Chunks', cost: 200, level: 12, attraction: 1.7, desc: 'Oily and delicious. Attracts giant deep-water predators.' },
            { id: 'special', name: 'Glowing Synthetic Lure', cost: 500, level: 22, attraction: 2.5, desc: 'Emits pulses. Highly increases chance of Epic & Legendary encounters.' }
        ]
    },

    // 52 Fish Species
    // Rarity values: common, uncommon, rare, epic, legendary
    fish: [
        // --- Beach Shore (1-8) ---
        { name: 'Sardine', rarity: 'common', difficulty: 0.15, minW: 0.1, maxW: 0.3, minL: 10, maxL: 20, price: 10, locations: ['beach_shore'], colors: ['#a8c0ff', '#3f2b96'] },
        { name: 'Anchovy', rarity: 'common', difficulty: 0.10, minW: 0.05, maxW: 0.2, minL: 8, maxL: 15, price: 8, locations: ['beach_shore'], colors: ['#74ebd5', '#9face6'] },
        { name: 'Mackerel', rarity: 'common', difficulty: 0.22, minW: 0.5, maxW: 1.5, minL: 25, maxL: 45, price: 18, locations: ['beach_shore'], colors: ['#43c6ac', '#191654'] },
        { name: 'Herring', rarity: 'common', difficulty: 0.18, minW: 0.2, maxW: 0.6, minL: 15, maxL: 30, price: 14, locations: ['beach_shore'], colors: ['#8ca6db', '#b993d6'] },
        { name: 'Sand Eel', rarity: 'uncommon', difficulty: 0.28, minW: 0.1, maxW: 0.4, minL: 12, maxL: 25, price: 30, locations: ['beach_shore'], colors: ['#e2ebf0', '#cfd9df'] },
        { name: 'Sand Trout', rarity: 'uncommon', difficulty: 0.35, minW: 0.8, maxW: 2.2, minL: 30, maxL: 55, price: 45, locations: ['beach_shore'], colors: ['#fbc2eb', '#a6c1ee'] },
        { name: 'Whiting', rarity: 'uncommon', difficulty: 0.30, minW: 0.4, maxW: 1.2, minL: 20, maxL: 38, price: 38, locations: ['beach_shore'], colors: ['#fff1eb', '#ace0f9'] },
        { name: 'Pompano', rarity: 'rare', difficulty: 0.55, minW: 1.0, maxW: 3.5, minL: 35, maxL: 60, price: 110, locations: ['beach_shore'], colors: ['#ffd1ff', '#f107a3'] },
        { name: 'Flounder', rarity: 'rare', difficulty: 0.50, minW: 1.5, maxW: 5.0, minL: 25, maxL: 50, price: 95, locations: ['beach_shore'], colors: ['#aba591', '#4d483a'] },

        // --- Rocky Coast (9-15) ---
        { name: 'Gobie', rarity: 'common', difficulty: 0.12, minW: 0.05, maxW: 0.25, minL: 5, maxL: 12, price: 12, locations: ['rocky_coast'], colors: ['#654ea3', '#eaafc8'] },
        { name: 'Blenny', rarity: 'common', difficulty: 0.16, minW: 0.1, maxW: 0.3, minL: 8, maxL: 16, price: 15, locations: ['rocky_coast'], colors: ['#30e8bab', '#6f86d6'] },
        { name: 'Rock Cod', rarity: 'uncommon', difficulty: 0.38, minW: 1.2, maxW: 4.0, minL: 30, maxL: 60, price: 55, locations: ['rocky_coast'], colors: ['#ed213a', '#93291e'] },
        { name: 'Sea Bass', rarity: 'uncommon', difficulty: 0.45, minW: 1.5, maxW: 6.0, minL: 35, maxL: 75, price: 65, locations: ['rocky_coast'], colors: ['#1f4037', '#99f2c8'] },
        { name: 'Black Seabream', rarity: 'uncommon', difficulty: 0.42, minW: 1.0, maxW: 3.2, minL: 28, maxL: 50, price: 50, locations: ['rocky_coast'], colors: ['#2c3e50', '#bdc3c7'] },
        { name: 'Kelp Bass', rarity: 'rare', difficulty: 0.60, minW: 2.0, maxW: 8.0, minL: 40, maxL: 90, price: 130, locations: ['rocky_coast'], colors: ['#5a3f37', '#2c7744'] },
        { name: 'Octopus', rarity: 'epic', difficulty: 0.75, minW: 3.0, maxW: 12.0, minL: 45, maxL: 110, price: 320, locations: ['rocky_coast'], colors: ['#e65c00', '#f9d423'] },

        // --- Deep Ocean Dock (16-22) ---
        { name: 'Mullet', rarity: 'common', difficulty: 0.20, minW: 0.3, maxW: 1.0, minL: 15, maxL: 35, price: 16, locations: ['deep_dock'], colors: ['#89f7fe', '#66a6ff'] },
        { name: 'Tomcod', rarity: 'common', difficulty: 0.24, minW: 0.4, maxW: 1.5, minL: 18, maxL: 40, price: 20, locations: ['deep_dock'], colors: ['#4b6cb7', '#182848'] },
        { name: 'Haddock', rarity: 'uncommon', difficulty: 0.48, minW: 2.0, maxW: 6.5, minL: 40, maxL: 80, price: 70, locations: ['deep_dock'], colors: ['#ff9966', '#ff5e62'] },
        { name: 'Pollack', rarity: 'uncommon', difficulty: 0.46, minW: 1.8, maxW: 5.5, minL: 35, maxL: 70, price: 60, locations: ['deep_dock'], colors: ['#3a7bd5', '#00d2ff'] },
        { name: 'Halibut', rarity: 'rare', difficulty: 0.65, minW: 5.0, maxW: 35.0, minL: 50, maxL: 150, price: 210, locations: ['deep_dock'], colors: ['#4d4d4d', '#1a1a1a'] },
        { name: 'Cod', rarity: 'rare', difficulty: 0.58, minW: 3.0, maxW: 18.0, minL: 45, maxL: 110, price: 175, locations: ['deep_dock'], colors: ['#83a4d4', '#b6fbff'] },
        { name: 'Yellowfin Tuna', rarity: 'epic', difficulty: 0.85, minW: 15.0, maxW: 80.0, minL: 80, maxL: 180, price: 550, locations: ['deep_dock'], colors: ['#f12711', '#f5af19'] },

        // --- Tropical Island (23-29) ---
        { name: 'Clownfish', rarity: 'common', difficulty: 0.14, minW: 0.05, maxW: 0.15, minL: 5, maxL: 12, price: 22, locations: ['tropical_island'], colors: ['#ff4e50', '#f9d423'] },
        { name: 'Damselfish', rarity: 'common', difficulty: 0.15, minW: 0.05, maxW: 0.2, minL: 6, maxL: 14, price: 25, locations: ['tropical_island'], colors: ['#00c6ff', '#0072ff'] },
        { name: 'Parrotfish', rarity: 'uncommon', difficulty: 0.40, minW: 1.0, maxW: 4.5, minL: 25, maxL: 55, price: 85, locations: ['tropical_island'], colors: ['#4ac29a', '#bdfff3'] },
        { name: 'Surgeonfish', rarity: 'uncommon', difficulty: 0.42, minW: 0.8, maxW: 3.5, minL: 20, maxL: 48, price: 78, locations: ['tropical_island'], colors: ['#2193b0', '#6dd5ed'] },
        { name: 'Butterflyfish', rarity: 'rare', difficulty: 0.50, minW: 0.3, maxW: 1.2, minL: 12, maxL: 25, price: 160, locations: ['tropical_island'], colors: ['#ffe259', '#ffa751'] },
        { name: 'Lionfish', rarity: 'epic', difficulty: 0.80, minW: 1.0, maxW: 4.0, minL: 25, maxL: 50, price: 450, locations: ['tropical_island'], colors: ['#800000', '#ff6666'] },
        { name: 'Mahi Mahi', rarity: 'epic', difficulty: 0.82, minW: 5.0, maxW: 22.0, minL: 60, maxL: 140, price: 480, locations: ['tropical_island'], colors: ['#a8ff78', '#78ffd6'] },

        // --- Pirate Bay (30-36) ---
        { name: 'Rusty Anchovy', rarity: 'common', difficulty: 0.18, minW: 0.1, maxW: 0.3, minL: 8, maxL: 16, price: 20, locations: ['pirate_bay'], colors: ['#536976', '#292e49'] },
        { name: 'Bonefish', rarity: 'uncommon', difficulty: 0.45, minW: 1.2, maxW: 4.8, minL: 30, maxL: 65, price: 90, locations: ['pirate_bay'], colors: ['#ece9e6', '#ffffff'] },
        { name: 'Triggerfish', rarity: 'rare', difficulty: 0.60, minW: 1.0, maxW: 3.8, minL: 22, maxL: 45, price: 190, locations: ['pirate_bay'], colors: ['#fe8c00', '#f83600'] },
        { name: 'Ghost Fish', rarity: 'rare', difficulty: 0.62, minW: 0.5, maxW: 2.0, minL: 18, maxL: 40, price: 220, locations: ['pirate_bay'], colors: ['#e2ebf0', '#cfd9df'] },
        { name: 'Barracuda', rarity: 'epic', difficulty: 0.88, minW: 4.0, maxW: 18.0, minL: 60, maxL: 150, price: 580, locations: ['pirate_bay'], colors: ['#bdc3c7', '#2c3e50'] },
        { name: 'Kraken Tentacle', rarity: 'epic', difficulty: 0.92, minW: 10.0, maxW: 50.0, minL: 100, maxL: 300, price: 750, locations: ['pirate_bay'], colors: ['#2b5876', '#4e4376'] },
        { name: 'Ancient Dubloon Fish', rarity: 'legendary', difficulty: 0.98, minW: 5.0, maxW: 15.0, minL: 30, maxL: 60, price: 2500, locations: ['pirate_bay'], colors: ['#ffe066', '#d4af37'] },

        // --- Frozen Lake (37-43) ---
        { name: 'Ice Minnow', rarity: 'common', difficulty: 0.10, minW: 0.02, maxW: 0.1, minL: 4, maxL: 10, price: 25, locations: ['frozen_lake'], colors: ['#e0f7fa', '#80deea'] },
        { name: 'Perch', rarity: 'uncommon', difficulty: 0.38, minW: 0.4, maxW: 1.8, minL: 18, maxL: 38, price: 80, locations: ['frozen_lake'], colors: ['#00c9ff', '#92fe9d'] },
        { name: 'Arctic Grayling', rarity: 'rare', difficulty: 0.60, minW: 1.0, maxW: 3.5, minL: 28, maxL: 55, price: 240, locations: ['frozen_lake'], colors: ['#6190e8', '#a7bfe8'] },
        { name: 'Rainbow Trout', rarity: 'rare', difficulty: 0.64, minW: 1.2, maxW: 5.2, minL: 30, maxL: 68, price: 260, locations: ['frozen_lake'], colors: ['#fd746c', '#ff9068'] },
        { name: 'Walleye', rarity: 'epic', difficulty: 0.84, minW: 2.0, maxW: 8.5, minL: 40, maxL: 85, price: 600, locations: ['frozen_lake'], colors: ['#ffe259', '#ffa751'] },
        { name: 'Lake Trout', rarity: 'epic', difficulty: 0.86, minW: 3.5, maxW: 15.0, minL: 45, maxL: 98, price: 650, locations: ['frozen_lake'], colors: ['#00c6ff', '#0072ff'] },
        { name: 'Glacial Pike', rarity: 'legendary', difficulty: 0.96, minW: 8.0, maxW: 28.0, minL: 70, maxL: 140, price: 2800, locations: ['frozen_lake'], colors: ['#e2ebf0', '#859398'] },

        // --- Volcano Coast (44-48) ---
        { name: 'Ash Gill', rarity: 'uncommon', difficulty: 0.46, minW: 0.5, maxW: 2.2, minL: 15, maxL: 35, price: 140, locations: ['volcano_coast'], colors: ['#3e5151', '#decba4'] },
        { name: 'Magma Carp', rarity: 'rare', difficulty: 0.68, minW: 2.5, maxW: 9.0, minL: 35, maxL: 75, price: 340, locations: ['volcano_coast'], colors: ['#ff4e50', '#f9d423'] },
        { name: 'Obsidian Barb', rarity: 'rare', difficulty: 0.70, minW: 1.8, maxW: 6.5, minL: 28, maxL: 60, price: 360, locations: ['volcano_coast'], colors: ['#141517', '#434343'] },
        { name: 'Lava Ray', rarity: 'epic', difficulty: 0.88, minW: 8.0, maxW: 30.0, minL: 60, maxL: 130, price: 850, locations: ['volcano_coast'], colors: ['#f857a6', '#ff5858'] },
        { name: 'Phoenix Fish', rarity: 'legendary', difficulty: 0.97, minW: 4.0, maxW: 12.0, minL: 30, maxL: 70, price: 3200, locations: ['volcano_coast'], colors: ['#f12711', '#f5af19'] },

        // --- Secret Legendary Cove (49-52) ---
        { name: 'Golden Shark', rarity: 'legendary', difficulty: 0.99, minW: 50.0, maxW: 250.0, minL: 150, maxL: 350, price: 5000, locations: ['legendary_cove'], colors: ['#ffdf00', '#d4af37'] },
        { name: 'Crystal Koi', rarity: 'legendary', difficulty: 0.94, minW: 5.0, maxW: 18.0, minL: 40, maxL: 90, price: 4000, locations: ['legendary_cove'], colors: ['#a1c4fd', '#c2e9fb'] },
        { name: 'Ancient Sea Dragon Fish', rarity: 'legendary', difficulty: 0.99, minW: 80.0, maxW: 400.0, minL: 200, maxL: 500, price: 8000, locations: ['legendary_cove'], colors: ['#00c6ff', '#0072ff'] },
        { name: 'Celestial Ray', rarity: 'legendary', difficulty: 0.95, minW: 30.0, maxW: 150.0, minL: 100, maxL: 220, price: 4500, locations: ['legendary_cove'], colors: ['#fc00ff', '#00dbde'] }
    ],

    // Achievements
    achievements: [
        { id: 'first_fish', name: 'First Splash!', desc: 'Catch your very first fish.', reward: 50 },
        { id: 'fifty_fish', name: 'Fisherman Journeyman', desc: 'Catch 50 fish total.', reward: 200 },
        { id: 'hundred_fish', name: 'Reel Master', desc: 'Catch 100 fish total.', reward: 500 },
        { id: 'rare_hunter', name: 'Rare Collector', desc: 'Catch a rare fish.', reward: 150 },
        { id: 'epic_conqueror', name: 'Sea Leviathan Slayer', desc: 'Catch an epic fish.', reward: 300 },
        { id: 'legendary_master', name: 'Mythology Hunter', desc: 'Catch a legendary fish.', reward: 1000 },
        { id: 'upgrade_maxed', name: 'Fully Equipped', desc: 'Upgrade any piece of gear to maximum tier.', reward: 400 },
        { id: 'millionaire', name: 'Gold Rush', desc: 'Earn 10,000 lifetime coins.', reward: 1000 },
        { id: 'all_locations', name: 'Globe Trotter', desc: 'Unlock all 8 fishing locations.', reward: 1500 }
    ],

    // Daily Quests
    quests: [
        { id: 'catch_5', desc: 'Catch 5 fish of any species', target: 5, type: 'catch_count', reward: 50 },
        { id: 'earn_100', desc: 'Earn 100 coins from selling fish', target: 100, type: 'earn_coins', reward: 60 },
        { id: 'catch_rare', desc: 'Catch at least 1 Rare fish', target: 1, type: 'catch_rare', reward: 100 },
        { id: 'perfect_reels', desc: 'Catch 3 fish without letting the line snap', target: 3, type: 'safe_catches', reward: 80 }
    ]
};
