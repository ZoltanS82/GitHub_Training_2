# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

##Implementation decisions
1. Presentation tier decision: Implement the React UI last, after the API contract and backend behavior are stable. Use the shared API client and relative /api paths.

2. Logic tier decision: Implement and validate the Express/TypeScript service methods before wiring the API routes. Handle validation errors deliberately with 4xx responses.

3. Data tier decision: Implement the Mongoose schema contracts and seed behavior first because the API and frontend depend on stable data models.

4. Activity tracking approach: Validate userId and teamId before creating activities, reject invalid or missing references with 4xx responses, and calculate points and occurredAt when creating an activity.

5. Team management approach: Support listing and creating teams, preserve name and mascot, and reject teams without a name with HTTP 400.

6. Leaderboard approach: Aggregate activity points by team, sort teams by total points descending, and return teamName, totalPoints, and a 1-based rank.

7. Workout suggestions approach: Find users by email and generate suggestions from their goal and recent activity. Return a deliberate 4xx response when no matching user exists.

##Test plan
Data-tier command: npm run test:data --prefix octofit-tracker/backend
Failures indicate incomplete Mongoose models, schema contracts, or seed behavior.
API command: npm run test:api --prefix octofit-tracker/backend
Failures indicate incomplete service logic, validation, routes, HTTP status codes, or response payloads.
Frontend command: npm test --prefix octofit-tracker/frontend
Failures indicate incomplete React rendering, API integration, loading states, or error handling.
Backend build command: npm run build --prefix octofit-tracker/backend
Must complete without TypeScript build errors.
Frontend build command: npm run build --prefix octofit-tracker/frontend
Must complete without frontend build errors.