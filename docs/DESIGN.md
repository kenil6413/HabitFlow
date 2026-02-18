# HabitFlow Design Document

## 1. Project Description

**HabitFlow** is a habit-tracking web application that helps users build better habits through daily tracking, streak motivation, and social accountability. Users can create habits, log completions each day, track streaks, and connect with friends to view each other's progress—encouraging consistency and motivation.

**Tech Stack:** Node.js, Express, MongoDB (native driver), vanilla JavaScript (client-side rendering), HTML5, CSS3.

**Key Features:**

- User registration and authentication
- Create, read, update, and delete habits
- Daily habit completion tracking with streak calculation
- Progress heatmap (GitHub-style) with Week / Month / Year views
- Share codes to add friends and view their habit progress
- Account settings (change password, delete account)
- Responsive, modern UI

---

## 2. User Personas

### Persona 1: Maya – The Busy Professional

- **Age:** 28
- **Goal:** Wants to build morning routines (exercise, meditation) but struggles with consistency
- **Needs:** Simple daily check-ins, visual streak feedback, no complex setup
- **Pain Point:** Other apps are too feature-heavy; she just needs to log “done” and see progress

### Persona 2: Jake – The Social Motivator

- **Age:** 22
- **Goal:** Stays accountable by sharing progress with friends
- **Needs:** Easy way to add friends, see friends’ habits and streaks
- **Pain Point:** Wants accountability without public social media pressure

### Persona 3: Priya – The Habit Beginner

- **Age:** 35
- **Goal:** Starting small—one or two habits like “drink water” or “read 10 minutes”
- **Needs:** Clear instructions, simple onboarding, encouragement (streaks)
- **Pain Point:** Overwhelmed by apps with too many options; needs clarity

---

## 3. User Stories

### Story 1: Maya signs up and creates her first habit

> As Maya, I want to create an account quickly so that I can start tracking my morning exercise habit. I register with a username and password, get a share code to optionally connect with friends, and am taken to my dashboard. There I add “Morning Exercise” as my first habit. By the end of the day, I tap “Complete Today” and see my streak go to 1 day.

### Story 2: Jake adds a friend and views their habits

> As Jake, I want to add my friend using their share code so that I can see their habits and stay motivated together. I go to the Friends page, enter my friend’s share code (e.g., HABIT-12345), and they appear in my friends list. When I click “View Habits,” I see their habits and current streaks, which motivates me to keep my own streak going.

### Story 3: Priya completes a habit and sees her streak grow

> As Priya, I want to log that I completed my habit today so that I can see my streak and feel motivated. On my dashboard, I see my habit card with a “Complete Today” button. After clicking it, the card updates to show “Completed Today!” and my streak increases. The visual feedback encourages me to come back tomorrow.

### Story 4: Maya updates her password

> As Maya, I want to change my password from the Settings panel so that I can keep my account secure. I open Settings from the dashboard, enter my current and new password, and confirm the change. I receive a success message and can continue using the app with my new password.

### Story 5: Priya learns how to use the app

> As Priya, I want clear instructions on how to get started so that I’m not confused. The app provides a “How to Use” section on the dashboard and register page with step-by-step guidance: create account, add habits, complete daily, optionally add friends. This helps her feel confident using HabitFlow.

---

## 4. Design Mockups

### 4.1 Login Page

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [HabitFlow Logo]                       │
│         Build better habits, one day at a time      │
│                                                     │
│         ┌─────────────────────────┐                 │
│         │ Username                │                 │
│         └─────────────────────────┘                 │
│         ┌─────────────────────────┐                 │
│         │ Password                │                 │
│         └─────────────────────────┘                 │
│                                                     │
│         [        Login        ]                     │
│                                                     │
│         Don't have an account? Sign up here         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Welcome, Maya! 👋          [+ Add Habit] [Friends] [Logout]  │
│  Your Share Code: HABIT-12345                                 │
├──────────────────────────────────────────────────────────────┤
│  My Habits                                    [Refresh]       │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │ Morning Exercise    │  │ Read 10 min         │            │
│  │ 🔥 5 day streak     │  │ 🔥 3 day streak     │            │
│  │ [✓ Complete] [Edit] │  │ [✓ Complete] [Edit] │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                               │
│  [Stats: 2 habits | Best streak: 5 days]                      │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Friends Page

```
┌──────────────────────────────────────────────────────────────┐
│  👥 Friends                      [Back to Dashboard] [Logout] │
│  Connect with friends and stay motivated                      │
├──────────────────────────────────────────────────────────────┤
│  Share Your Code: HABIT-12345        [Copy Code]              │
│                                                               │
│  Add a Friend                                                 │
│  [Enter share code (HABIT-xxxxx)    ] [Add Friend]            │
│                                                               │
│  My Friends (2)                              [Refresh]        │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │ J  Jake             │  │ P  Priya            │            │
│  │ HABIT-54321         │  │ HABIT-98765         │            │
│  │ [View Habits][Remove]│  │ [View Habits][Remove]│            │
│  └─────────────────────┘  └─────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Mobile Wireframe (Dashboard)

```
┌───────────────────┐
│ HabitFlow    [≡]  │
├───────────────────┤
│ Welcome, Maya!    │
│ Share: HABIT-12345│
│ [Add][Friends]    │
├───────────────────┤
│ Morning Exercise  │
│ 🔥 5 day streak   │
│ [✓ Complete]      │
├───────────────────┤
│ Read 10 min       │
│ 🔥 3 day streak   │
│ [✓ Complete]      │
└───────────────────┘
```
