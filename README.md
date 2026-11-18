# Urbanrise Site Visit Tracker

A small, mobile-first application for site sales executives to view a day's booked visits and record the outcome and next action after each meeting.

## Requirements

- Bun 1.1 or newer

## Run

From this directory:

```bash
bun install && bun run dev
```

Open <http://localhost:3000>. The initial view shows Farhan's visits on 6 October 2026. Change the executive or date to view another schedule.

Run the automated backend tests with:

```bash
bun test
```

The backend uses Hono, the client uses React + Vite, and TypeScript is used throughout the application and tests. `bun run build && bun start` runs the production build.

## API

- `GET /api/visits?executive=EX-02%20Farhan&date=2026-10-06` lists visits for one executive and date, ordered by visit time.
- `PATCH /api/visits/:visitId` records an outcome and next action.
- Outcomes are restricted to `Interested`, `Needs time`, `Not interested`, and `No show`.
- Phone numbers are masked in every API response. Only the last four digits are shown.
- Invalid input returns HTTP 400; an unknown visit returns HTTP 404.

Example update:

```bash
curl -X PATCH 'http://localhost:3000/api/visits/V-3002' \
  -H 'Content-Type: application/json' \
  -d '{"outcome":"Interested","next_action":"Call tomorrow with the price sheet"}'
```

## Data and design notes

The frontend is in `client/` and the Hono backend is in `server/`. Data is persisted in SQLite at `server/data/visits.sqlite` using Drizzle ORM. The supplied CSV seeds the database on first run, and updates remain after server restarts. Set `URBANRISE_DB_PATH` to override the database location. The supplied dataset contains 24 synthetic visits across three executives and dates 6–8 October 2026. The application preserves those source dates; it does not silently rewrite historical fixture data to today's date. A date with no matching visits returns an empty list rather than an error.

For this small assignment, SQLite-file persistence keeps setup simple and avoids requiring a separate database server. It is not intended for concurrent multi-instance production use. In production I would use a hosted relational database, enforce authorization for the logged-in executive, and audit every outcome change.

## Five tests I would add next, and why

1. **Executive/date isolation:** verify that a request never returns another executive's visits or visits from an adjacent date. This protects customer and schedule boundaries.
2. **Concurrent updates:** send two updates to the same visit and verify the chosen conflict policy. The current file store is deliberately single-process and does not provide transactional concurrency control.
3. **Boundary validation:** test whitespace-only next actions, the 240-character limit, malformed JSON, and unsupported extra fields. This hardens the API against bad client input.
4. **Phone data variants:** test short, international, and punctuation-heavy phone numbers, including missing values. Privacy masking must fail closed rather than leak a number.
5. **Mobile browser workflow:** use Playwright at 320px and 390px widths to test keyboard focus, select controls, save feedback, and slow-network errors. A screen that technically renders but cannot be operated on site is not useful.

## Known scope limits

- No authentication is included because the assignment does not specify an identity provider. A production implementation must authenticate users and authorize executive-level access.
- The supplied dataset has historical dates. Select 6, 7, or 8 October 2026 to see the provided visits.
- Optional AI visit summaries were intentionally not added. The required workflow is deterministic, and a generated summary could misstate customer intent. If added later, it should be labelled as an assistive draft with a link to the source fields and human review before use.
