// Global State
let currentRecipes = [];
let fallbackRecipes = [];
let favoriteRecipes = JSON.parse(localStorage.getItem('bitecraft_favorites')) || [];
let activeTab = 'all'; // 'all' or 'favorites'

// API Endpoints
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const API_SEARCH = `${API_BASE}/search.php?s=`;
const API_LOOKUP = `${API_BASE}/lookup.php?i=`;
const API_CATEGORIES = `${API_BASE}/list.php?c=list`;
const API_AREAS = `${API_BASE}/list.php?a=list`;

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const areaFilter = document.getElementById('area-filter');
const resetBtn = document.getElementById('reset-filters');
const recipesGrid = document.getElementById('recipes-grid');
const resultsHeading = document.getElementById('results-heading');
const resultsCount = document.getElementById('results-count');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Tabs
const showAllBtn = document.getElementById('show-all-btn');
const showFavBtn = document.getElementById('show-fav-btn');
const favCountSpan = document.getElementById('fav-count');

// Modal Elements
const recipeModal = document.getElementById('recipe-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalRecipeImg = document.getElementById('modal-recipe-img');
const modalFavBtn = document.getElementById('modal-fav-btn');
const modalRecipeCategory = document.getElementById('modal-recipe-category');
const modalRecipeArea = document.getElementById('modal-recipe-area');
const modalRecipeIngredients = document.getElementById('modal-recipe-ingredients');
const modalRecipeTitle = document.getElementById('modal-recipe-title');
const modalRecipeInstructions = document.getElementById('modal-recipe-instructions');
const modalYoutubeLink = document.getElementById('modal-youtube-link');

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await initFallbackRecipes();
    initFilters();
    loadDefaultRecipes();
    updateFavBadge();
    setupEventListeners();
});

// Load Fallback Recipes
async function initFallbackRecipes() {
    try {
        const res = await fetch('recipeData.json');
        fallbackRecipes = await res.json();
    } catch (err) {
        console.error('Failed to load fallback recipes:', err);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    searchForm.addEventListener('submit', handleSearchSubmit);
    categoryFilter.addEventListener('change', handleFilterChange);
    areaFilter.addEventListener('change', handleFilterChange);
    resetBtn.addEventListener('click', resetFilters);
    
    showAllBtn.addEventListener('click', () => switchTab('all'));
    showFavBtn.addEventListener('click', () => switchTab('favorites'));
    
    closeModalBtn.addEventListener('click', hideModal);
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) hideModal();
    });
}

// Fetch Filter Lists
async function initFilters() {
    try {
        const [catsRes, areasRes] = await Promise.all([
            fetch(API_CATEGORIES),
            fetch(API_AREAS)
        ]);
        
        const catsData = await catsRes.json();
        const areasData = await areasRes.json();
        
        if (catsData.meals) {
            catsData.meals.sort((a,b) => a.strCategory.localeCompare(b.strCategory)).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.strCategory;
                opt.textContent = cat.strCategory;
                categoryFilter.appendChild(opt);
            });
        }
        
        if (areasData.meals) {
            areasData.meals.sort((a,b) => a.strArea.localeCompare(b.strArea)).forEach(area => {
                const opt = document.createElement('option');
                opt.value = area.strArea;
                opt.textContent = area.strArea;
                areaFilter.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error initializing filters:', err);
    } finally {
        populateFiltersFromFallback();
    }
}

function populateFiltersFromFallback() {
    const catsSet = new Set();
    const areasSet = new Set();
    
    fallbackRecipes.forEach(meal => {
        if (meal.strCategory) catsSet.add(meal.strCategory);
        if (meal.strArea) areasSet.add(meal.strArea);
    });
    
    Array.from(catsSet).sort().forEach(cat => {
        if (!categoryFilter.querySelector(`option[value="${cat}"]`)) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryFilter.appendChild(opt);
        }
    });
    
    Array.from(areasSet).sort().forEach(area => {
        if (!areaFilter.querySelector(`option[value="${area}"]`)) {
            const opt = document.createElement('option');
            opt.value = area;
            opt.textContent = area;
            areaFilter.appendChild(opt);
        }
    });
}

// Load Default Recipes on App Start
async function loadDefaultRecipes() {
    // Default search is 'pasta' to populate the screen beautifully
    fetchRecipes('pasta');
}

// Fetch Recipes by query
async function fetchRecipes(query) {
    showLoading(true);
    showError(false);
    recipesGrid.innerHTML = '';
    
    try {
        const res = await fetch(`${API_SEARCH}${encodeURIComponent(query)}`);
        const data = await res.json();
        
        let apiMeals = data.meals || [];
        
        // Merge with local matches
        const localMatches = fallbackRecipes.filter(meal => 
            meal.strMeal.toLowerCase().includes(query.toLowerCase()) ||
            meal.strCategory.toLowerCase().includes(query.toLowerCase()) ||
            meal.strArea.toLowerCase().includes(query.toLowerCase())
        );
        
        const merged = [...apiMeals];
        localMatches.forEach(localMeal => {
            if (!merged.some(m => m.strMeal.toLowerCase() === localMeal.strMeal.toLowerCase())) {
                merged.push(localMeal);
            }
        });
        
        if (merged.length > 0) {
            currentRecipes = merged;
            applyFiltersAndRender();
        } else {
            currentRecipes = [];
            showLoading(false);
            showError(true, `No recipes found for "${query}". Try searching something else like 'chicken', 'beef', or 'chocolate'.`);
        }
    } catch (err) {
        console.error('Error fetching recipes, using fallback:', err);
        const localMatches = fallbackRecipes.filter(meal => 
            meal.strMeal.toLowerCase().includes(query.toLowerCase()) ||
            meal.strCategory.toLowerCase().includes(query.toLowerCase()) ||
            meal.strArea.toLowerCase().includes(query.toLowerCase())
        );
        
        if (localMatches.length > 0) {
            currentRecipes = localMatches;
            applyFiltersAndRender();
        } else {
            currentRecipes = [];
            showLoading(false);
            showError(true, 'Connection error. Displaying no recipes.');
        }
    }
}

// Handle Form Submission
function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        switchTab('all');
        fetchRecipes(query);
    }
}

// Apply Filters & Render
function applyFiltersAndRender() {
    showLoading(false);
    
    let filtered = [];
    if (activeTab === 'all') {
        const catVal = categoryFilter.value;
        const areaVal = areaFilter.value;
        
        if (catVal || areaVal) {
            filtered = [...fallbackRecipes];
            if (catVal) {
                filtered = filtered.filter(meal => meal.strCategory === catVal);
            }
            if (areaVal) {
                filtered = filtered.filter(meal => meal.strArea === areaVal);
            }
            
            // Also merge with any matches from currentRecipes that weren't in the fallback list
            currentRecipes.forEach(meal => {
                if (catVal && meal.strCategory !== catVal) return;
                if (areaVal && meal.strArea !== areaVal) return;
                if (!filtered.some(f => f.strMeal.toLowerCase() === meal.strMeal.toLowerCase())) {
                    filtered.push(meal);
                }
            });
        } else {
            filtered = [...currentRecipes];
        }
        
        resultsHeading.textContent = catVal || areaVal ? 'Filtered Results' : 'Featured Recipes';
    } else {
        filtered = [...favoriteRecipes];
        resultsHeading.textContent = 'My Saved Recipes';
    }
    
    resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? '' : 's'} found`;
    
    if (filtered.length === 0) {
        showError(true, activeTab === 'all' 
            ? 'No meals match the selected Category and Cuisine filters.' 
            : 'You have not added any favorite recipes yet! Click the heart icon on any recipe to save it.');
        recipesGrid.innerHTML = '';
    } else {
        showError(false);
        renderRecipeCards(filtered);
    }
}

// Render Recipe Cards to Grid
function renderRecipeCards(meals) {
    recipesGrid.innerHTML = '';
    
    meals.forEach(meal => {
        const isFav = favoriteRecipes.some(fav => fav.idMeal === meal.idMeal);
        
        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.dataset.id = meal.idMeal;
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <button class="fav-btn ${isFav ? 'active' : ''}" aria-label="Toggle favorite">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
            <div class="card-content">
                <div class="card-tags">
                    <span class="card-tag">${meal.strCategory || 'Recipe'}</span>
                </div>
                <h3 class="recipe-title">${meal.strMeal}</h3>
                <div class="recipe-action">
                    <span>View Recipe Details</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </div>
            </div>
        `;
        
        // Add events
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(meal, favBtn);
        });
        
        card.addEventListener('click', () => showRecipeDetails(meal.idMeal));
        
        recipesGrid.appendChild(card);
    });
}

// Toggle Favorites
function toggleFavorite(meal, button) {
    const idx = favoriteRecipes.findIndex(fav => fav.idMeal === meal.idMeal);
    if (idx > -1) {
        // Remove
        favoriteRecipes.splice(idx, 1);
        button.classList.remove('active');
    } else {
        // Add
        favoriteRecipes.push(meal);
        button.classList.add('active');
    }
    
    localStorage.setItem('bitecraft_favorites', JSON.stringify(favoriteRecipes));
    updateFavBadge();
    
    // If we're on the favorites tab, re-apply filter to remove it from display
    if (activeTab === 'favorites') {
        applyFiltersAndRender();
    }
}

// Update Favorite Count Badge
function updateFavBadge() {
    favCountSpan.textContent = favoriteRecipes.length;
}

// Switch tabs: All vs Favorites
function switchTab(tab) {
    activeTab = tab;
    if (tab === 'all') {
        showAllBtn.classList.add('active');
        showFavBtn.classList.remove('active');
        categoryFilter.disabled = false;
        areaFilter.disabled = false;
        resetBtn.disabled = false;
    } else {
        showFavBtn.classList.add('active');
        showAllBtn.classList.remove('active');
        categoryFilter.disabled = true;
        areaFilter.disabled = true;
        resetBtn.disabled = true;
    }
    applyFiltersAndRender();
}

// Show Recipe Details Modal
async function showRecipeDetails(id) {
    // Check fallback list first
    const localMeal = fallbackRecipes.find(m => m.idMeal === id);
    if (localMeal) {
        populateModal(localMeal);
        showModal();
        return;
    }

    showLoading(true);
    
    try {
        const res = await fetch(`${API_LOOKUP}${id}`);
        const data = await res.json();
        
        if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
            populateModal(meal);
            showLoading(false);
            showModal();
        } else {
            showLoading(false);
            alert('Failed to load recipe details.');
        }
    } catch (err) {
        console.error('Error fetching meal details:', err);
        showLoading(false);
        alert('Connection error occurred while fetching details.');
    }
}

// Populate Recipe Details Modal
function populateModal(meal) {
    modalRecipeTitle.textContent = meal.strMeal;
    modalRecipeImg.src = meal.strMealThumb;
    modalRecipeImg.alt = meal.strMeal;
    
    // Set Favorites state
    const isFav = favoriteRecipes.some(fav => fav.idMeal === meal.idMeal);
    if (isFav) {
        modalFavBtn.classList.add('active');
    } else {
        modalFavBtn.classList.remove('active');
    }
    
    // Re-bind click for modal favorite button
    modalFavBtn.onclick = () => {
        toggleFavorite(meal, modalFavBtn);
        // Sync card list states
        const correspondingCard = document.querySelector(`.recipe-card[data-id="${meal.idMeal}"] .fav-btn`);
        if (correspondingCard) {
            if (modalFavBtn.classList.contains('active')) {
                correspondingCard.classList.add('active');
            } else {
                correspondingCard.classList.remove('active');
            }
        }
    };
    
    modalRecipeCategory.textContent = meal.strCategory;
    modalRecipeArea.textContent = meal.strArea;
    
    // Render Instructions
    modalRecipeInstructions.textContent = meal.strInstructions;
    
    // Render Ingredients & Measures
    modalRecipeIngredients.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        
        if (ing && ing.trim() !== '') {
            const li = document.createElement('li');
            li.innerHTML = `<span>${ing}</span><span>${meas ? meas : 'To taste'}</span>`;
            modalRecipeIngredients.appendChild(li);
        }
    }
    
    // YouTube link
    if (meal.strYoutube) {
        modalYoutubeLink.href = meal.strYoutube;
        modalYoutubeLink.classList.remove('hidden');
    } else {
        modalYoutubeLink.href = '#';
        modalYoutubeLink.classList.add('hidden');
    }
}

// Modal Toggle helpers
function showModal() {
    recipeModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Disable page scrolling
}

function hideModal() {
    recipeModal.classList.remove('show');
    document.body.style.overflow = ''; // Re-enable page scrolling
}

// Reset Filters
function resetFilters() {
    categoryFilter.value = '';
    areaFilter.value = '';
    searchInput.value = '';
    fetchRecipes('pasta');
}

// Filter Dropdown Handlers
function handleFilterChange() {
    applyFiltersAndRender();
}

// UI States Utilities
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        recipesGrid.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        recipesGrid.classList.remove('hidden');
    }
}

function showError(isError, text = '') {
    if (isError) {
        errorMessage.classList.remove('hidden');
        errorText.textContent = text;
        recipesGrid.classList.add('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}
