import './app/css/styles.css';
import AchievementHelper from './app/AchievementHelper.js';

async function init() {
  try {
    const response = await fetch('./app/config.json');
    if (!response.ok) throw new Error('Failed to load config.json');
    const config = await response.json();

    new AchievementHelper(config);
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

init();
