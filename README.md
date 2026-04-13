# 2SOEN1LAPTOP-SOEN341_Project_W26
Description
MealMajor is a web app for students to plan meals, track groceries, and propose easy recipes.

Baseline features:
1. User Account Management

   - User registration and login
   - Profile management (diet preferences, allergies)

3. Recipe Management

   - Create, edit, and delete recipes.
   - Recipe attributes (ingredients, prep. time, prep. steps, cost, etc.)
   - Search recipes
   - Filter recipes
   - Time, difficulty, cost, dietary tag, etc.

3. Weekly Meal Planner

   - Create a weekly meal plan
   - View meals in a weekly grid
   - Assign recipes to:
     - Day of the week
     - Meal type (breakfast/lunch/dinner/snack)
   - Edit or remove meals from the planner
   - Prevent duplicates for the same week


Team Members: 
- Ethan Elkaim / E-tin30 (40311428) - Scrum Master
- Chrisjan Alejandro / Alertify123 (40309216) - Backend Developper
- Kepler Paul-Emile / Kepler-paule (40313171) - Frontend Developper
- Paul-Philippe Ehui / paul-sans-I (40269547) - Quality Assurance
- Marc Urbano / Azzossi (40305993) - Tester
- Martin Miskovski / Mart2455 (40298894) - Project Manager

Logs:
- Backlog: https://docs.google.com/spreadsheets/d/19nyoOnyxjDlC09DkUDNmzfnAfoTsoWI66Jg28DF5yDc/edit?usp=sharing
- Time Logs:
   - Sprint 1: https://docs.google.com/spreadsheets/d/1b9PzG_Y6IkF75Kk-9qGGttu_zmzAqYlvYA0VqyPZarM/edit?usp=sharing
   - Sprint 2: https://docs.google.com/spreadsheets/d/1ZE7JPHccUs39tjYqvfkqhB2QFpWboyF7q3MEfbG_ljI/edit?usp=sharing
   - Sprint 3: https://docs.google.com/spreadsheets/d/1Gs_wDg4gBJKAljqLEFPmoyDG7oocTUfEWMKSaPNC0bw/edit?usp=sharing
   - Sprint 4: https://docs.google.com/spreadsheets/d/1SajuaPQ-b8ba46csTaBrSYNeLt-vBh4Z9VXZWqiidBo/edit?usp=sharing
- Sprint Planning Document:
   - Sprint 2: https://docs.google.com/document/d/1JwpAEbxm_GfPl8BNeWyWNqS_YO-nmvzFFreqm28Sg8g/edit?usp=sharing
   - Sprint 3: https://docs.google.com/document/d/1ZcLZZ12JUQTl2GUy1f4P6cCHF3zp5GqDriOi-14PGnM/edit?usp=sharing
   - Sprint 4: https://docs.google.com/document/d/1PjloSvWYmjKtzpUB8u42kzI2Ac2Cjox44eJ3DgYeORs/edit?usp=sharing
- Bug Fixes: https://docs.google.com/document/d/1mGQWtxUrzmNzyyBZttBnUoJKG-IYFGPgOmWK-CVIMj8/edit?usp=sharing

## Code Conventions:

The MealMajor project enforces a consistent and well-defined set of coding standards to ensure readability, maintainability, and team-wide collaboration. All file names, variables, and functions follow the camelCase naming convention across both frontend and backend components. Functions are written using clear, descriptive verb-based names to reflect their behavior, while variables use concise yet meaningful identifiers to improve code clarity. The codebase follows a modular structure, separating concerns such as routes, views, and data handling, in line with best practices for Node.js and Express applications. Additionally, consistent formatting, indentation, and validation practices are applied throughout the project to maintain uniformity. These conventions are communicated and enforced across the team to ensure high-quality, maintainable code.

## Project Structure

The project follows a modular structure based on separation of concerns. 
Routes, views (EJS), and data are organized into dedicated folders to improve readability and maintainability. 
Static assets (CSS/JS) are stored in the public directory, while server logic is handled through Express route modules.

## Static Analysis (ESLint)

We use ESLint to analyze our JavaScript code.

To run ESLint:
npx eslint .

This command scans the entire codebase for potential bugs and code quality issues.

Configuration is defined in eslint.config.mjs, which excludes non-JavaScript files such as EJS and CSS.
