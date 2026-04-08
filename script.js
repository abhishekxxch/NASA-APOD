// ============================================================================
// NASA APOD - Enhanced Web Application
// Features: Loading spinner, video support, favorites, random APOD, error handling
// ============================================================================

// Configuration
const CONFIG = {
  API_BASE: 'https://api.nasa.gov/planetary/apod',
  API_KEY: 'DEMO_KEY', // Replace with your NASA API key
  MIN_DATE: new Date('1995-06-16'),
  STORAGE_KEY: 'apod_favorites'
};

// DOM Elements
const elements = {
  form: document.getElementById('birthdayForm'),
  dateInput: document.getElementById('birthday'),
  randomBtn: document.getElementById('randomBtn'),
  apodContainer: document.getElementById('apod-container'),
  errorMessage: document.getElementById('error-message'),
  loadingSpinner: document.getElementById('loading-spinner'),
  favoritesSection: document.getElementById('favorites-section'),
  favoritesList: document.getElementById('favorites-list'),
  clearFavoritesBtn: document.getElementById('clearFavoritesBtn')
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format date to YYYY-MM-DD format
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date
 */
const getTodayDate = () => {
  return new Date();
};

/**
 * Generate random date between MIN_DATE and today
 */
const getRandomDate = () => {
  const minTime = CONFIG.MIN_DATE.getTime();
  const maxTime = getTodayDate().getTime();
  const randomTime = Math.random() * (maxTime - minTime) + minTime;
  return new Date(randomTime);
};

/**
 * Show/hide loading spinner
 */
const toggleSpinner = (show) => {
  if (show) {
    elements.loadingSpinner.classList.remove('hidden');
  } else {
    elements.loadingSpinner.classList.add('hidden');
  }
};

/**
 * Show error message
 */
const showError = (message) => {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.animation = 'none';
  setTimeout(() => {
    elements.errorMessage.style.animation = 'slideIn 0.3s ease';
  }, 10);
};

/**
 * Clear error message
 */
const clearError = () => {
  elements.errorMessage.textContent = '';
};

/**
 * Get favorites from localStorage
 */
const getFavorites = () => {
  const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save favorite to localStorage
 */
const saveFavorite = (apodData) => {
  const favorites = getFavorites();
  const exists = favorites.some(fav => fav.date === apodData.date);
  
  if (!exists) {
    favorites.push(apodData);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(favorites));
    return true;
  }
  return false;
};

/**
 * Remove favorite from localStorage
 */
const removeFavorite = (date) => {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => fav.date !== date);
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(favorites));
};

/**
 * Check if date is favorited
 */
const isFavorited = (date) => {
  return getFavorites().some(fav => fav.date === date);
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch APOD data from NASA API
 */
const fetchAPOD = async (date) => {
  clearError();
  toggleSpinner(true);
  elements.apodContainer.innerHTML = '';

  try {
    const url = `${CONFIG.API_BASE}?date=${date}&api_key=${CONFIG.API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No APOD data available for this date. Please try another date.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again in a few moments.');
      } else {
        throw new Error(`API Error: ${response.status}. Please try again.`);
      }
    }

    const data = await response.json();
    
    // Validate response data
    if (!data.url || !data.title || !data.explanation) {
      throw new Error('Invalid APOD data received. Please try another date.');
    }

    displayAPOD({ ...data, date });
    updateFavoritesDisplay();

  } catch (error) {
    handleError(error.message);
    console.error('Fetch Error:', error);
  } finally {
    toggleSpinner(false);
  }
};

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Display APOD content (supports both images and videos)
 */
const displayAPOD = (data) => {
  const isFav = isFavorited(data.date);
  const favBtnClass = isFav ? 'btn-favorite-active' : '';
  const favBtnText = isFav ? '★ Remove from Favorites' : '☆ Save to Favorites';
  
  // Determine media type
  const isVideo = data.media_type === 'video';
  const mediaContent = isVideo
    ? `<iframe 
        width="600" 
        height="400" 
        src="${data.url}" 
        title="${data.title}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        class="apod-media">
      </iframe>`
    : `<img 
        src="${data.url}" 
        alt="${data.title}" 
        class="apod-media apod-image"
        loading="lazy">`;

  elements.apodContainer.innerHTML = `
    <div class="apod-content fade-in">
      ${mediaContent}
      <h2 class="apod-title">${escapeHtml(data.title)}</h2>
      <p class="apod-date">📅 ${formatDateReadable(data.date)}</p>
      <p class="apod-explanation">${escapeHtml(data.explanation)}</p>
      ${data.copyright ? `<p class="apod-copyright">© ${escapeHtml(data.copyright)}</p>` : ''}
      <button id="favoriteBtn" class="btn btn-favorite ${favBtnClass}">
        ${favBtnText}
      </button>
    </div>
  `;

  // Attach favorite button event
  document.getElementById('favoriteBtn').addEventListener('click', () => {
    handleFavoriteToggle(data);
  });
};

/**
 * Format date to readable format
 */
const formatDateReadable = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Handle favorite toggle
 */
const handleFavoriteToggle = (apodData) => {
  if (isFavorited(apodData.date)) {
    removeFavorite(apodData.date);
  } else {
    saveFavorite(apodData);
  }
  
  // Update display
  displayAPOD(apodData);
  updateFavoritesDisplay();
};

/**
 * Display favorites section
 */
const updateFavoritesDisplay = () => {
  const favorites = getFavorites();
  
  if (favorites.length === 0) {
    elements.favoritesSection.classList.add('hidden');
    return;
  }

  elements.favoritesSection.classList.remove('hidden');
  
  elements.favoritesList.innerHTML = favorites.map(fav => `
    <div class="favorite-card fade-in">
      <div class="favorite-preview">
        ${fav.media_type === 'video'
          ? `<div class="favorite-placeholder">🎥 Video</div>`
          : `<img src="${fav.url}" alt="${fav.title}" class="favorite-image">`
        }
      </div>
      <h4 class="favorite-title">${escapeHtml(fav.title)}</h4>
      <p class="favorite-date">${formatDateReadable(fav.date)}</p>
      <div class="favorite-actions">
        <button class="btn btn-small btn-view" data-date="${fav.date}">View</button>
        <button class="btn btn-small btn-remove" data-date="${fav.date}">Remove</button>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.getAttribute('data-date');
      elements.dateInput.value = date;
      fetchAPOD(date);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.getAttribute('data-date');
      removeFavorite(date);
      updateFavoritesDisplay();
    });
  });
};

/**
 * Handle errors
 */
const handleError = (message) => {
  elements.apodContainer.innerHTML = '';
  showError(`❌ ${message}`);
};

// ============================================================================
// Form & Input Handling
// ============================================================================

/**
 * Set up date input constraints
 */
const setupDateInput = () => {
  const today = getTodayDate();
  const minDateStr = formatDate(CONFIG.MIN_DATE);
  const todayStr = formatDate(today);

  elements.dateInput.min = minDateStr;
  elements.dateInput.max = todayStr;
  elements.dateInput.value = todayStr;
};

/**
 * Validate date input
 */
const validateDate = (dateStr) => {
  const selectedDate = new Date(dateStr);

  if (selectedDate < CONFIG.MIN_DATE) {
    return {
      valid: false,
      message: '❌ Please select a date on or after June 16, 1995.'
    };
  }

  if (selectedDate > getTodayDate()) {
    return {
      valid: false,
      message: '❌ Please select a date on or before today.'
    };
  }

  return { valid: true };
};

// ============================================================================
// Event Listeners
// ============================================================================

// Form submission
elements.form.addEventListener('submit', (e) => {
  e.preventDefault();

  const dateStr = elements.dateInput.value;
  const validation = validateDate(dateStr);

  if (!validation.valid) {
    showError(validation.message);
    elements.apodContainer.innerHTML = '';
    return;
  }

  fetchAPOD(dateStr);
});

// Random APOD button
elements.randomBtn.addEventListener('click', () => {
  const randomDate = getRandomDate();
  const dateStr = formatDate(randomDate);
  elements.dateInput.value = dateStr;
  fetchAPOD(dateStr);
});

// Clear favorites button
elements.clearFavoritesBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all favorites?')) {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    updateFavoritesDisplay();
  }
});

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the application
 */
const initializeApp = () => {
  setupDateInput();
  updateFavoritesDisplay();
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);