const API = {
    currentUser: null,
    isGuest: true,

    async checkSession() {
        try {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
                const data = await res.json();
                if (data.logged_in) {
                    this.currentUser = data.username;
                    this.isGuest = false;
                    return data;
                }
            }
        } catch (e) {
            console.warn("Backend API not reachable. Running in LocalStorage Guest mode.");
        }
        this.isGuest = true;
        this.currentUser = localStorage.getItem('fishing_master_guest_user') || 'VISHVA SRI';
        return { logged_in: false, username: this.currentUser };
    },

    async register(username, password) {
        if (this.isGuest && !window.location.origin.includes('5000') && !window.location.origin.includes('localhost')) {
            // Local fallback if running standalone index.html
            localStorage.setItem('fishing_master_guest_user', username);
            this.currentUser = username;
            this.isGuest = true;
            return { success: true, username, guest: true };
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this.currentUser = data.username;
                this.isGuest = false;
            }
            return data;
        } catch (e) {
            return { error: "Network error. Failed to connect to server." };
        }
    },

    async login(username, password) {
        if (this.isGuest && !window.location.origin.includes('5000') && !window.location.origin.includes('localhost')) {
            localStorage.setItem('fishing_master_guest_user', username);
            this.currentUser = username;
            this.isGuest = true;
            return { success: true, username, guest: true };
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this.currentUser = data.username;
                this.isGuest = false;
            }
            return data;
        } catch (e) {
            return { error: "Network error. Failed to connect to server." };
        }
    },

    async logout() {
        if (this.isGuest) {
            this.currentUser = 'VISHVA SRI';
            localStorage.removeItem('fishing_master_guest_user');
            return { success: true };
        }
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                this.currentUser = 'VISHVA SRI';
                this.isGuest = true;
                return { success: true };
            }
        } catch (e) {
            console.error("Logout failed", e);
        }
        return { success: false };
    },

    async save(gameState) {
        if (this.isGuest) {
            localStorage.setItem('fishing_master_save', JSON.stringify(gameState));
            return { success: true, guest: true };
        }

        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameState)
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Failed to save to backend. Saving to LocalStorage instead.", e);
        }
        
        localStorage.setItem('fishing_master_save', JSON.stringify(gameState));
        return { success: true, fallback: true };
    },

    async load() {
        if (this.isGuest) {
            const save = localStorage.getItem('fishing_master_save');
            return save ? JSON.parse(save) : null;
        }

        try {
            const res = await fetch('/api/load');
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Failed to load from backend. Loading from LocalStorage.", e);
        }

        const save = localStorage.getItem('fishing_master_save');
        return save ? JSON.parse(save) : null;
    },

    async getLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Using mock local leaderboard.");
        }

        // Mock leaderboard fallback
        return [
            { username: "DeepSeaCaptain", level: 62, xp: 4500, coins: 12500 },
            { username: "WaveRider99", level: 50, xp: 2100, coins: 8200 },
            { username: "ReelLegend", level: 41, xp: 3550, coins: 7550 },
            { username: "FishWhisperer", level: 32, xp: 1200, coins: 4100 },
            { username: "BaitMaster", level: 25, xp: 800, coins: 2500 },
            { username: this.currentUser || "Guest", level: 1, xp: 0, coins: 100 }
        ];
    },

    async getTournament() {
        try {
            const res = await fetch('/api/tournament');
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Using mock tournament data.");
        }

        return {
            tournament_name: "Summer Beach Classic (Offline Mode)",
            time_left: "2 days, 12 hours",
            leaderboard: [
                { username: "DeepSeaCaptain", score: 9850, rank: 1 },
                { username: "WaveRider99", score: 8200, rank: 2 },
                { username: "ReelLegend", score: 7550, rank: 3 },
                { username: this.currentUser || "Guest", score: 1500, rank: 4 },
                { username: "FishWhisperer", score: 1200, rank: 5 }
            ]
        };
    }
};
