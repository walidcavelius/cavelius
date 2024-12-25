// Core functionality for track management
const CACHE_KEY = 'lastfm_track_cache';
const CACHE_DURATION = 60000; // 1 minute in milliseconds

class TrackManager {
    constructor() {
        this.currentTrack = null;
        this.lastFetchTime = 0;
    }

    async initialize() {
        // Try to load from cache first
        const cached = this.loadFromCache();
        if (cached) {
            this.currentTrack = cached.track;
            this.lastFetchTime = cached.timestamp;
            return this.currentTrack;
        }

        // If no cache or expired, fetch new data
        return await this.fetchAndUpdateTrack();
    }

    loadFromCache() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - data.timestamp <= CACHE_DURATION) {
            return data;
        }
        return null;
    }

    async fetchLatestTrack() {
        try {
            const response = await fetch(
                "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=KhalWalid&api_key=5150101ea591b02148931c448529eeb7&limit=1&format=json"
            );
            const data = await response.json();
            const latestTrack = data.recenttracks.track[0];
            return `${latestTrack.artist["#text"]} - ${latestTrack.name}`;
        } catch (error) {
            console.error("An error occurred:", error);
            return "An error occurred while fetching the track.";
        }
    }

    async fetchAndUpdateTrack() {
        const newTrack = await this.fetchLatestTrack();
        const now = Date.now();

        // Update cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            track: newTrack,
            timestamp: now
        }));

        this.currentTrack = newTrack;
        this.lastFetchTime = now;
        return newTrack;
    }

    async checkForUpdates() {
        const now = Date.now();
        if (now - this.lastFetchTime > CACHE_DURATION) {
            return await this.fetchAndUpdateTrack();
        }
        return this.currentTrack;
    }
}

console.log("test")
// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const trackManager = new TrackManager();
    
    // Initial track fetch and display
    const trackElement = document.getElementById('soundcloud-player');
    if (trackElement) {
        const trackName = await trackManager.initialize();
        trackElement.textContent = trackName;

        // Set up periodic checks for updates
        setInterval(async () => {
            const updatedTrack = await trackManager.checkForUpdates();
            if (trackElement && trackElement.textContent !== updatedTrack) {
                trackElement.textContent = updatedTrack;
            }
        }, CACHE_DURATION);
    }
});
