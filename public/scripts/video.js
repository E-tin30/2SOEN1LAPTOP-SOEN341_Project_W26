
const fs = require('fs').promises;
const path = require('path');

const RECIPES_FILE = path.join(__dirname, '../../data/recipes.json');


const YOUTUBE_API_KEY = "AIzaSyDKvaxbMqEGr7zPTM_O3UV91vU7o9jiHZA";

// simple guard to avoid overlapping runs
let isRunning = false;

async function checkAndUpdateRecipes() {
  if (isRunning) return;
  isRunning = true;

  try {
    const raw = await fs.readFile(RECIPES_FILE, 'utf8');
    const recipes = raw ? JSON.parse(raw) : [];

    for (const recipe of recipes) {
      if (!('videoURL' in recipe)) {
        recipe.videoURL = null;
      }
      if (recipe.videoURL) continue;
      console.log("Updating the URL for ", recipe)
      const videoUrl = await getYoutubeUrl(recipe.name);
      recipe.videoURL = videoUrl;
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
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${query}&key=${YOUTUBE_API_KEY}`;
  
    const response = await fetch(url);
    console.log(response)
    const data = await response.json();
  
    if (!data.items || data.items.length === 0) {
      return null;
    }
  
    const videoId = data.items[0].id.videoId;
  
    return `https://www.youtube.com/embed/${videoId}`;
  }

module.exports = { startRecipeWatcher };