
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const RECIPES_FILE = path.join(__dirname, '../../data/recipes.json');


const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// simple guard to avoid overlapping runs
let isRunning = false;

async function checkAndUpdateRecipes() {
  if (isRunning) return;
  isRunning = true;

  try {
    const raw = await fs.readFile(RECIPES_FILE, 'utf8');
    const recipes = raw ? JSON.parse(raw) : [];

    for (const recipe of recipes) {
      if (!('videoURL_1' in recipe)) {
        recipe.videoURL_1 = null;
        recipe.videoURL_2 = null;
        recipe.videoURL_3 = null;
      }
      if (recipe.videoURL_1) continue;
      console.log("Updating the URL for ", recipe)
      const videoUrls = await getYoutubeUrl(recipe.name);
      recipe.videoURL_1 = videoUrls[0];
      recipe.videoURL_2 = videoUrls[1];
      recipe.videoURL_3 = videoUrls[2];
    }

    
    await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
  } catch (err) {
    console.error('[recipeWatcher] Error processing recipes.json:', err);
  } finally {
    isRunning = false;
  }
}

function startRecipeWatcher() {
  // run once on startup
  console.log("Getting recipe video")
  checkAndUpdateRecipes();

  // run every minute (60 * 1000 ms)
  setInterval(checkAndUpdateRecipes, 60 * 1000);
}


async function getYoutubeUrl(title) {
    const query = encodeURIComponent(title + " recipe");
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${query}&key=${YOUTUBE_API_KEY}`;
  
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [null, null, null];
    }

    const videoIds = data.items.map(item => item.id.videoId);
    const videoId1 = videoIds[0] || null;
    const videoId2 = videoIds[1] || null;
    const videoId3 = videoIds[2] || null;

  
    return [`https://www.youtube.com/embed/${videoId1}`, `https://www.youtube.com/embed/${videoId2}`, `https://www.youtube.com/embed/${videoId3}`];
  }

module.exports = { startRecipeWatcher, getYoutubeUrl };