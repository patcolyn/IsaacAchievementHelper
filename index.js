import AchievementHelper from './app/AchievementHelper.js';

(async () => {
    try {
        const res = await fetch('./app/data/config.json');
        if (!res.ok) throw new Error('Failed to load config.json');
        const config = await res.json();
        new AchievementHelper(config);
    } catch (err) {
        console.error('Error loading config:', err);
    }
})();
