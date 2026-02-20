# HabitFlow

HabitFlow is a minimalist habit tracker built for Project 2 (Node + Express + Mongo + HTML5).

## Author
- Kenil Jitendrakumar Patel
- Sukanya Sudhir Shete

## Class
- Course: CS5610 Web Development
- Class Link: https://johnguerra.co/classes/webDevelopment_online_spring_2026/
- Assignment: Project 2 (Simple backend with Node + Express + Mongo + HTML5)

## Project Objective
- Build a useful habit tracking app with:
- Node.js + Express REST API
- MongoDB native driver (no Mongoose)
- Vanilla JavaScript client-side rendering
- Modular HTML/CSS/JS structure

## Main Features
- User registration and login
- Habit CRUD
- Mark habit complete for today + automatic streak calculation
- Journal entry by date (text + photos)
- Year heatmap of activity
- Friends feature using share codes
- View friend habits in modal
- Change password + delete account

## Screenshot
- Add final screenshots to `docs/` before submission and update links here.

## How to Run
1. Install dependencies:
```bash
npm install
```
2. Create environment file:
```bash
cp .env.example .env
```
3. Set values in `.env`:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```
4. Start server:
```bash
npm start
```
5. Open:
- `http://localhost:3000`

## Development Commands
- Run dev server:
```bash
npm run dev
```
- Lint:
```bash
npm run lint
```
- Format:
```bash
npm run format
```

## Project Structure
```text
src/
  server.js
  db/connection.js
  routes/
    auth.js
    habits.js
    friends.js
    journal.js
  utils/helpers.js

public/
  index.html
  register.html
  home.html
  dashboard.html
  friends.html
  css/
    common.css
    auth.css
    home.css
    dashboard.css
    friends.css
  js/
    api.js
    utils.js
    dashboard.js

docs/
  DESIGN.md
  PROPOSAL_CHECKLIST.md
```

## Notes
- Uses ES modules throughout backend (`import/export`), not CommonJS.
- Uses MongoDB native driver only (no Mongoose).
- No template engine used.

## License
- MIT (`LICENSE`)
