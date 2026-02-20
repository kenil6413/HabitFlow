# HabitFlow

HabitFlow is a full-stack habit tracking web application built for CS5610 Project 2.  
It combines a vanilla JavaScript frontend with a Node.js + Express backend and MongoDB (native driver) for storage.

## Authors

- Kenil Jitendrakumar Patel
- Sukanya Sudhir Shete

## Class

- Course: CS5610 Web Development
- Class Link: https://johnguerra.co/classes/webDevelopment_online_spring_2026/
- Assignment: Project 2 (Simple backend with Node + Express + Mongo + HTML5)

## Project Objective

The app helps users build consistency by:

- creating and managing habits
- tracking daily completion and streak behavior
- writing daily journal entries (with optional image uploads)
- visualizing progress using calendar/heatmap views
- adding friends for accountability through share codes

## Features

- Auth flow with register/login
- Habit CRUD with date-based tracking
- Daily progress calendar with completion states
- Journal entries with optional image attachments
- Friends system with mutual add/remove behavior
- Responsive layout across laptop and external screens

## Tech Stack

- Node.js + Express
- MongoDB native driver (`mongodb`)
- HTML5 + CSS3 (modular CSS files)
- Vanilla JavaScript modules (client-side rendering only)

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas or local MongoDB instance

## Installation

```bash
git clone <your-repo-url>
cd Project-2-HabitFlow
npm install
```

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```


## Run Locally

Start production mode:

```bash
npm start
```

Start development mode:

```bash
npm run dev
```

Open:

`http://localhost:3000`

## Page-Wise Usage

### Register / Login

1. Create a new account on `register.html`.
2. Log in from `index.html`.

### Dashboard

1. Add habits using the habit form.
2. Mark habits completed each day.
3. Edit/delete habits when needed.
4. Change selected date to review past records.

### Home

1. View daily summary and completion status.
2. Check calendar dots: red = no habits completed, light green = some habits completed, dark green = all habits completed.
3. Use timer for focus sessions.

### Journal

1. Pick a date.
2. Write journal text.
3. Optionally upload image(s).
4. Save entry and review later by date.

### Friends

1. Copy your share code.
2. Add friend by their code.
3. Search and view friends' shared progress.
4. Remove friends when needed.

## Quick Demo Flow

1. Register `user_1` and `user_2` (or run seeded data).
2. Log in as `user_1`.
3. Create 3 habits and complete at least 1.
4. Add a journal entry.
5. Add `user_2` as a friend via share code.
6. Verify friend data appears on Friends page.

## Seed Data (1000+ Records)

Generate rubric-friendly sample data:

```bash
npm run seed:rubric
```

Optional custom seed:

```bash
node scripts/seed-rubric-data.js --users=50 --habits-per-user=25 --journals-per-user=6
```

Seed journal entries with a fixed image:

```bash
node scripts/seed-rubric-data.js --journal-image=/journal-images/dog.jpg
```

Default seeded credentials:

- username pattern: `user_1`, `user_2`, ...
- password: `123456`

## Linting and Formatting

```bash
npm run lint
npm run format
```

## Deployment (Render)

This project includes `render.yaml` for deployment setup.

- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/api/health`
- Required env var on Render: `MONGODB_URI`

## Screenshots

Project screenshots are available in the `sc/` folder.

### Login
![Login](docs/screenshots/Screenshot%202026-02-20%20at%204.41.18%E2%80%AFPM.png)

### Home
![Home](docs/screenshots/Screenshot%202026-02-20%20at%204.41.40%E2%80%AFPM.png)

### Dashboard
![Dashboard](docs/screenshots/Screenshot%202026-02-20%20at%204.43.38%E2%80%AFPM.png)

### Friends
![Friends](docs/screenshots/Screenshot%202026-02-20%20at%204.43.49%E2%80%AFPM.png)

## Project Structure

```text
backend/
  db/
  routes/
  utils/
  server.js

frontend/
  css/
  img/
  journal-images/
  js/
  index.html
  register.html
  home.html
  dashboard.html
  friends.html

docs/
scripts/
sc/
render.yaml
```

## Constraints Compliance

- Uses ES Modules (`import`/`export`) in backend
- Uses MongoDB native driver (no Mongoose)
- No template engines (EJS/Pug/Handlebars/etc)
- Frontend uses vanilla JavaScript client-side rendering

## License

MIT License (`LICENSE`)
