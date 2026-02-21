# HabitFlow

HabitFlow is a full-stack habit tracking web application built for CS5610 Project 2.  
It combines a vanilla JavaScript frontend with a Node.js + Express backend and MongoDB (native driver) for storage.

The application, inspired by the principles of 'Atomic Habits' is designed to help users build lasting, meaningful habits through structured tracking, social accountability and daily reflection making the process of behavior change both intentional and enjoyable.

## Authors

- Kenil Jitendrakumar Patel
- Sukanya Sudhir Shete

## Quick Links
- Live Hosted Website(Demo): https://habitflow-myhk.onrender.com/home.html
- Design Document: https://drive.google.com/file/d/1z8JvYs4BuBHi7fCPS1pl7llQAI3By0XG/view?
- Video Explanation on YouTube: https://youtu.be/y93p9dsO6SI
- How to use the application (Instructions): https://docs.google.com/document/d/16XjWUEZpEGrQirCAb7TJAhDu8OiGr-mBGi_zyxf8VLM/edit?usp=sharing
usp=drive_link
- Presentation: https://docs.google.com/presentation/d/1lAdCwQdUulUYQ9zSOAResBOwO5JtOO3glYMLic4_l_8/edit?usp=sharing

## Test Credentials

The database is pre-seeded with demo records so the app can be tested immediately.

Seeded Data (Ready to Test)

Users: 40 demo accounts (admin_1 to admin_40)
Habits: 1200
Journal entries: 240
Password for all demo accounts: 123456
You can log in with any account from admin_1 to admin_40 (same password: 123456).

To verify journal data, open Dashboard Journal and check dates:
2026-02-16 to 2026-02-21.
If demo users are unavailable, please create a new account from the Register page.

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
Project-2-HabitFlow/
├── backend/
│   ├── server.js
│   ├── db/
│   │   └── connection.js
│   ├── routes/
│   │   ├── assets.js
│   │   ├── auth.js
│   │   ├── friends.js
│   │   ├── habits.js
│   │   └── journal.js
│   └── utils/
│       ├── helpers.js
│       └── object-id.js
├── frontend/
│   ├── index.html
│   ├── register.html
│   ├── home.html
│   ├── dashboard.html
│   ├── friends.html
│   ├── css/
│   │   ├── auth.css
│   │   ├── common.css
│   │   ├── home.css
│   │   ├── dashboard.css
│   │   └── friends.css
│   ├── img/
│   │   ├── minimalist-mountains-river-at-dawn-desktop-wallpaper.jpg
│   │   ├── pastel-ocean-sunset-aesthetic-desktop-wallpaper-4k.jpg
│   │   ├── wp13694694-ultrawide-minimalist-wallpapers.jpg
│   │   └── wp13694699-ultrawide-minimalist-wallpapers.jpg
│   ├── journal-images/
│   │   └── dog.jpg
│   └── js/
│       ├── api.js
│       ├── app-shell.js
│       ├── client-helpers.js
│       ├── dashboard.js
│       ├── friends.js
│       ├── home.js
│       ├── page-bootstrap.js
│       ├── profile-menu.js
│       ├── utils.js
│       ├── wallpaper-preload.js
│       ├── wallpaper.js
│       ├── auth/
│       │   ├── login.js
│       │   ├── particles.js
│       │   ├── register.js
│       │   └── shared.js
│       ├── dashboard/
│       │   ├── habits.js
│       │   ├── heatmap.js
│       │   ├── image-utils.js
│       │   ├── journal.js
│       │   └── stats.js
│       ├── friends/
│       │   ├── render.js
│       │   └── ui.js
│       └── home/
│           ├── calendar.js
│           ├── pomodoro.js
│           ├── quotes.js
│           └── wallpaper.js
├── docs/
│   └── screenshots/
├── scripts/
│   └── seed-rubric-data.js
├── LICENSE
├── README.md
├── eslint.config.js
├── package.json
├── package-lock.json
└── render.yaml
```

## License

MIT License (`LICENSE`)
