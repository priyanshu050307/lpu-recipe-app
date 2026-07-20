# Project 1: BiteCraft — Premium Recipe Discovery App

An elegant, glassmorphic Single Page Web Application built using vanilla HTML5, CSS3, and modern asynchronous JavaScript (ES6+). It utilizes **TheMealDB API** to fetch, search, filter, and view detailed recipe information in real-time, matching the course syllabus specifications.

## Key Features
- **Real-Time Recipe Search**: Search for recipes using keywords, ingredients, or title queries.
- **Advanced Dynamic Filtering**: Filter the results on the fly by category (e.g., Seafood, Vegetarian, Desserts) and country/cuisine origin (e.g., Italian, French, Indian).
- **Interactive Details Modal**: View instructions, parsed ingredients lists with measurement metrics, and responsive links to YouTube video tutorials inside a custom overlay layout.
- **Bookmarks Manager**: Save favorite recipes to an active bookmarks list. Bookmarks are persistent across browser sessions using `localStorage`.
- **Fully Responsive CSS Grid Layout**: Uses custom CSS variables, media queries, flexbox, and autofitting grids to guarantee visual excellence on mobile, tablet, and desktop viewports.
- **Modern Dark Glassmorphism Theme**: Uses blur filters, vibrant floating background shapes, and custom SVG icons to present a premium product appearance.

## Syllabus Integration
- **HTML**: Semantic structures (`<header>`, `<main>`, `<section>`, `<article>`), HTML5 form inputs, labels, and aria accessibility attributes.
- **CSS**: Custom HSL color variables, CSS Grid autofit layouts, Flexbox alignments, `@media` viewport queries, backdrop filters, transform-based hover states, and keyframe animations.
- **JavaScript**: Async/Await fetch promises, Local Storage state managers, DOM selectors, event list triggers, template string DOM generation, and array filter methods.

## API Integration
The application consumes the public **TheMealDB** REST endpoints:
1. `https://www.themealdb.com/api/json/v1/1/search.php?s={query}` (search recipes)
2. `https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}` (fetch specific meal by ID)
3. `https://www.themealdb.com/api/json/v1/1/list.php?c=list` (fetch category lists)
4. `https://www.themealdb.com/api/json/v1/1/list.php?a=list` (fetch geographical area lists)

## Deployment Instructions
1. Upload the files (`index.html`, `style.css`, `app.js`) to a GitHub Repository.
2. Go to Repository settings -> Pages -> Select standard deploy branch (main/master).
3. The application will be deployed and publically accessible via `https://username.github.io/repository-name/`.
