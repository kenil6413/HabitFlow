# Project 2 Rubric Audit (HabitFlow)

Audit date: 2026-02-20

This checklist maps each rubric item to repository evidence and current status.

## Legend

- PASS: verified in repository
- READY: implemented support exists, but must be executed/validated in deployment
- MANUAL: requires external submission action (cannot be auto-verified in code)

## Rubric Mapping

| Rubric Item                                                                   | Status | Evidence / Notes                                                                              |
| ----------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Design document includes description, personas, stories, mockups              | PASS   | `docs/DESIGN.md`                                                                              |
| App accomplishes approved requirements                                        | READY  | Features implemented across `src/routes/*`, `public/js/*`; final instructor validation needed |
| App is usable and includes instructions                                       | PASS   | In-app guidance on Home (`public/home.html`), plus README usage steps                         |
| App is useful                                                                 | MANUAL | Requires instructor/user evaluation                                                           |
| ESLint config exists and has no errors                                        | PASS   | `eslint.config.js`; run `npm run lint`                                                        |
| Code properly organized by pages/modules                                      | PASS   | Separate HTML/CSS/JS modules in `public/`; backend split in `src/`                            |
| JS organized in modules                                                       | PASS   | ESM modules across frontend/backend                                                           |
| Client-side rendering using vanilla JS                                        | PASS   | `public/js/*` uses DOM rendering with no framework                                            |
| Implements at least 1 form                                                    | PASS   | Login/Register/Add Habit/Add Friend/Journal forms                                             |
| Deployed on public server and works                                           | MANUAL | Requires deployed URL check                                                                   |
| Uses at least 2 Mongo collections with CRUD support                           | PASS   | `users`, `habits`, `journal` via `src/routes/*.js`                                            |
| Database has >1000 records                                                    | READY  | `scripts/seed-rubric-data.js`; run `npm run seed:rubric`                                      |
| Uses Node + Express                                                           | PASS   | `src/server.js`                                                                               |
| Formatted using Prettier                                                      | READY  | `.prettierrc`; run `npm run format` before final freeze                                       |
| Uses standard HTML elements (no non-standard interactive hacks)               | PASS   | Buttons/inputs/forms are semantic HTML elements                                               |
| CSS organized by modules                                                      | PASS   | `public/css/auth.css`, `home.css`, `dashboard.css`, `friends.css`, `common.css`               |
| README includes author, class link, objective, screenshot, build instructions | READY  | `README.md` includes all sections; add final screenshot files + class URL                     |
| No exposed credentials                                                        | PASS   | `.env` ignored by `.gitignore`; `.env.example` template only                                  |
| Includes package.json with dependencies                                       | PASS   | `package.json`                                                                                |
| Uses MIT license                                                              | PASS   | `LICENSE`                                                                                     |
| No obvious leftover unused scaffold code                                      | PASS   | Removed duplicate auth route and unused auth API call                                         |
| Google form submission links/thumbnail correct                                | MANUAL | External submission step                                                                      |
| Includes short public narrated video                                          | MANUAL | External submission step                                                                      |
| Code frozen on time                                                           | MANUAL | Process requirement                                                                           |
| Backend does not use CommonJS (`require`)                                     | PASS   | ESM imports in `src/`                                                                         |
| No Mongoose or template engine usage                                          | PASS   | Dependencies/routes confirm native driver + static HTML                                       |

## Final Submission Actions (Outside Repo)

1. Deploy and verify public URL.
2. Add real app screenshots in `docs/screenshots/` and link them in `README.md`.
3. Replace placeholder class link in `README.md` with exact course/assignment URL.
4. Run `npm run format` and `npm run lint` on final commit.
5. Run `npm run seed:rubric` on deployment database if 1000+ record requirement is enforced.
6. Record/upload narrated demo video.
7. Complete Google Form with correct thumbnail and links.
8. Freeze code before deadline.
