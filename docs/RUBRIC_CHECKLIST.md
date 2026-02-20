# Rubric Checklist (Code-Focused)

This is a practical checklist for final QA before submission.

## Already Covered in Code

- ESLint config exists (`eslint.config.js`)
- Lint command runs without errors (`npm run lint`)
- Prettier config exists (`.prettierrc`)
- Package metadata exists (`package.json`)
- MIT license exists (`LICENSE`)
- Backend uses Node + Express (`src/server.js`)
- Backend uses ES modules, not CommonJS
- MongoDB native driver is used (no Mongoose)
- No template engine (EJS/Pug/etc.) used
- Frontend uses vanilla JS with client-side rendering
- Code organized by modules:
  - DB connector: `src/db/connection.js`
  - Routes in `src/routes/`
  - Frontend API module: `public/js/api.js`
  - Frontend utilities: `public/js/utils.js`
- CSS organized by page modules:
  - `public/css/auth.css`
  - `public/css/home.css`
  - `public/css/dashboard.css`
  - `public/css/friends.css`
- At least one form is implemented:
  - Auth forms
  - Add friend form
  - Add habit form
  - Journal save workflow
- At least two Mongo collections with CRUD-related operations:
  - `users`
  - `habits`
  - `friends` relation in users
  - `journal`

## Manual Checks Before Final Submission

- Deployment URL works publicly
- README includes final screenshot file(s)
- README includes complete usage instructions
- Database has required record count (if instructor enforces 1000+)
- Google form submission links and thumbnail are correct
- Demo video is recorded and accessible
- Final branch/repo is frozen before deadline
