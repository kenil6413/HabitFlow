# HabitFlow

HabitFlow is a habit tracking web app built for Project 2 using Node.js, Express, MongoDB (native driver), HTML5, CSS, and vanilla JavaScript.

## Author

- Kenil Jitendrakumar Patel
- Sukanya Sudhir Shete

## Class
- Course: CS5610 Web Development
- Class Link: https://johnguerra.co/classes/webDevelopment_online_spring_2026/
- Assignment: Project 2 (Simple backend with Node + Express + Mongo + HTML5)

## Project Objective

Build a practical habit tracker where users can:

- create and manage habits
- track daily completions and streaks
- write daily journal entries
- visualize consistency with a heatmap/calendar
- connect with friends for accountability

## Screenshot

Add final screenshots in `docs/screenshots/` and reference them here.

Example:

```md
![Dashboard Screenshot](docs/screenshots/dashboard.png)
![Friends Screenshot](docs/screenshots/friends.png)
```

## Tech Stack

- Node.js + Express
- MongoDB native driver (`mongodb`)
- HTML5 + CSS3
- Vanilla JavaScript modules (client-side rendering)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure `.env`:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

4. Start the app:

```bash
npm start
```

5. Open `http://localhost:3000`

## Development Commands

```bash
npm run dev
npm run lint
npm run format
```

## How to Use

1. Register an account on `register.html`.
2. Log in on `index.html`.
3. Open Dashboard to add/edit/delete habits.
4. Mark habits complete daily to build streaks.
5. Use Friends page to share/add friends using share code.
6. Use journal and heatmap sections to review progress.

## Rubric Support Commands

Run lint:

```bash
npm run lint
```

Seed rubric/demo data (creates 1000+ records):

```bash
npm run seed:rubric
```

Optional seed customization:

```bash
node scripts/seed-rubric-data.js --users=50 --habits-per-user=25 --journals-per-user=6
```

Default rubric seed users:

- username prefix: `rubric_user_`
- password: `HabitFlow123!`

## Project Structure

```text
src/
  server.js
  db/
    connection.js
  routes/
    auth.js
    habits.js
    friends.js
    journal.js
    assets.js
  utils/
    helpers.js
    object-id.js

public/
  index.html
  register.html
  home.html
  dashboard.html
  friends.html
  css/
    auth.css
    common.css
    home.css
    dashboard.css
    friends.css
  js/
    api.js
    page-bootstrap.js
    app-shell.js
    wallpaper-preload.js
    profile-menu.js
    utils.js
    auth/
      login.js
      register.js
      particles.js
    home/
      calendar.js
      pomodoro.js
      quotes.js
      wallpaper.js
    dashboard/
      habits.js
      heatmap.js
      journal.js
      stats.js
    friends/
      render.js
      ui.js

docs/
  DESIGN.md
  RUBRIC_CHECKLIST.md
  RUBRIC_AUDIT.md
```

## Constraints Compliance

- Uses ES Modules (`import`/`export`) in backend.
- Does not use Mongoose.
- Does not use template engines (EJS/Pug/Handlebars/etc).
- Uses MongoDB native driver directly.

## License

MIT (`LICENSE`)
