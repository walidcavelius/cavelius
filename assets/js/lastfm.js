// Configuration settings for LastFM integration
const CONFIG = {
    CACHE_KEY: 'lastfm_track_cache',
    CACHE_DURATION: 120000, // 2 minutes in milliseconds
    API_BASE: 'https://ws.audioscrobbler.com/2.0/',
    API_KEY: '5150101ea591b02148931c448529eeb7',
    USER: 'KhalWalid',
    DEFAULT_IMAGE: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"%3E%3Cpath fill="%23ccc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/%3E%3C/svg%3E'
};

function formatPlayTime(trackInfo) {
    if (trackInfo.isNowPlaying) {
        return 'Now Playing';
    }
    
    if (!trackInfo.timestamp) return '';
    
    const now = Date.now();
    const diff = now - trackInfo.timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else {
        return 'Just now';
    }
}


class TrackManager {
    constructor() {
        this.currentTrack = null;
        this.lastFetchTime = 0;
    }

    // Helper method to create API URLs with proper parameters
    #createApiUrl(method, additionalParams = {}) {
        const url = new URL(CONFIG.API_BASE);
        const params = {
            method: method,
            user: CONFIG.USER,
            api_key: CONFIG.API_KEY,
            format: 'json',
            ...additionalParams
        };

        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return url.toString();
    }

    async initialize() {
        const cached = this.loadFromCache();
        if (cached) {
            this.currentTrack = cached.track;
            this.lastFetchTime = cached.timestamp;
            return this.currentTrack;
        }
        return await this.fetchAndUpdateTrack();
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            return Date.now() - data.timestamp <= CONFIG.CACHE_DURATION ? data : null;
        } catch (error) {
            console.error('Cache loading failed:', error);
            localStorage.removeItem(CONFIG.CACHE_KEY);
            return null;
        }
    }

    // Get the best quality image from LastFM's image array
    #getBestImage(images) {
        if (!Array.isArray(images) || images.length === 0) {
            return CONFIG.DEFAULT_IMAGE;
        }

        // LastFM provides images in various sizes - we prefer larger ones
        const preferredSizes = ['extralarge', 'large', 'medium', 'small'];
        
        for (const size of preferredSizes) {
            const image = images.find(img => img.size === size);
            if (image && image['#text']) {
                return image['#text'];
            }
        }
        
        // If no preferred size is found, try to get any valid image URL
        const anyValidImage = images.find(img => img['#text']);
        return anyValidImage ? anyValidImage['#text'] : CONFIG.DEFAULT_IMAGE;
    }

    async fetchLatestTrack() {
        try {
            // First fetch the recent tracks to get the latest track info
            const recentTracksUrl = this.#createApiUrl('user.getrecenttracks', { limit: 1 });
            const response = await fetch(recentTracksUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const latestTrack = data.recenttracks?.track?.[0];
            
            if (!latestTrack) {
                throw new Error('No track data available');
            }

            // Fetch additional track info including high-res album art
            const trackInfo = await this.#fetchTrackInfo(
                latestTrack.artist?.['#text'],
                latestTrack.name
            );
            const isNowPlaying = latestTrack['@attr']?.nowplaying === 'true';

            return {
                artist: latestTrack.artist?.['#text'] || 'Unknown Artist',
                name: latestTrack.name || 'Unknown Track',
                image: trackInfo.image || this.#getBestImage(latestTrack.image),
                album: latestTrack.album?.['#text'] || 'Unknown Album',
                url: latestTrack.url || `https://www.last.fm/music/${encodeURIComponent(latestTrack.artist?.['#text'])}/_/${encodeURIComponent(latestTrack.name)}`,
                isNowPlaying: isNowPlaying,
                timestamp: !isNowPlaying && latestTrack.date?.uts ? parseInt(latestTrack.date.uts) * 1000 : null
            };
        } catch (error) {
            console.error("An error occurred:", error);
            return {
                artist: 'Error',
                name: 'Could not fetch track',
                image: CONFIG.DEFAULT_IMAGE,
                album: 'Unknown Album',
                url: 'https://www.last.fm'
            };
        }
    }

    
    // Helper method to fetch additional track information including high-res album art
    async #fetchTrackInfo(artist, track) {
        try {
            const trackInfoUrl = this.#createApiUrl('track.getInfo', {
                artist: artist,
                track: track
            });

            const response = await fetch(trackInfoUrl);
            const data = await response.json();

            if (data.track?.album?.image) {
                return {
                    image: this.#getBestImage(data.track.album.image)
                };
            }
            
            return { image: null };
        } catch (error) {
            console.error('Failed to fetch track info:', error);
            return { image: null };
        }
    }

    async fetchAndUpdateTrack() {
        const newTrack = await this.fetchLatestTrack();
        const now = Date.now();

        try {
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
                track: newTrack,
                timestamp: now
            }));
        } catch (error) {
            console.error('Cache update failed:', error);
            localStorage.clear(); // Clear storage if it's full
        }

        this.currentTrack = newTrack;
        this.lastFetchTime = now;
        return newTrack;
    }

    async checkForUpdates() {
        return Date.now() - this.lastFetchTime > CONFIG.CACHE_DURATION
            ? await this.fetchAndUpdateTrack()
            : this.currentTrack;
    }
}

// Helper function to update the display with new track information
function updateDisplay(trackElement, artistElement, artworkElement, trackInfo) {
    if (!trackInfo) return;

    const linkElement = document.getElementById('track-link');
    const timeElement = document.getElementById('play-time');

    if (linkElement) {
        linkElement.href = trackInfo.url;
    }

    // Update track name
    if (trackElement) {
        trackElement.textContent = trackInfo.name;
    }
    
    // Update artist name
    if (artistElement) {
        artistElement.textContent = trackInfo.artist;
    }

    if (timeElement) {
        timeElement.textContent = formatPlayTime(trackInfo);
        // Add a pulsing effect for "Now Playing"
        if (trackInfo.isNowPlaying) {
            timeElement.classList.add('animate-pulse', 'text-green-500');
        } else {
            timeElement.classList.remove('animate-pulse', 'text-green-500');
        }
    }

    
    // Update album artwork with error handling
    if (artworkElement instanceof HTMLImageElement) {
        // Only update if the image URL has changed
        if (artworkElement.src !== trackInfo.image) {
            artworkElement.src = trackInfo.image;
            artworkElement.alt = `Album artwork for ${trackInfo.name} by ${trackInfo.artist}`;
            
            // Set up error handling for the image
            artworkElement.onerror = () => {
                if (artworkElement.src !== CONFIG.DEFAULT_IMAGE) {
                    artworkElement.src = CONFIG.DEFAULT_IMAGE;
                    console.warn('Failed to load album artwork, using default image');
                }
            };
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Create track manager instance
    const trackManager = new TrackManager();
    console.log("test");
    
    // Get references to DOM elements
    const trackElement = document.getElementById('song');
    const artistElement = document.getElementById('artist');
    const artworkElement = document.getElementById('album-art');
    
    if (trackElement && artistElement && artworkElement) {
        // Initial fetch and display
        const trackInfo = await trackManager.initialize();
        console.log(trackInfo);
        updateDisplay(trackElement, artistElement, artworkElement, trackInfo);

        // Set up periodic updates
        setInterval(async () => {
            const updatedTrack = await trackManager.checkForUpdates();
            updateDisplay(trackElement, artistElement, artworkElement, updatedTrack);
        }, CONFIG.CACHE_DURATION);

        // Optional: Add visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                trackManager.checkForUpdates().then(track => {
                    updateDisplay(trackElement, artistElement, artworkElement, track);
                });
            }
        });
    } else {
        console.error('Required DOM elements not found');
    }
});
