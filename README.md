# AIBus Frontend

The AIBus frontend is a React application built with Vite.

## Requirements

- Node.js 22 or newer
- npm

## Getting started

From this directory, install dependencies and create your local environment file:

```sh
npm ci
cp .env.example .env
```

Set `VITE_API_BASE_URL` in `.env` to the AIBus API URL, for example
`https://aibus.shop/api/v1`. The frontend accepts either this URL or the
backend's origin (`https://aibus.shop`). Vite exposes variables prefixed with
`VITE_` to browser code, so do not put secrets in them.

Start the development server:

```sh
npm run dev
```

## Checks and production build

```sh
npm run lint
npm run build
npm run preview
```

The production build is written to `dist/`. The included `vercel.json` configures
Vercel to serve the React app for client-side routes.

## Deploying to Vercel

Import this repository into Vercel and use the Vite defaults:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://aibus.shop/api/v1`

Set the environment variable for each Vercel environment you use, then redeploy
so it is included in the frontend build. The backend must allow requests from
your deployed frontend domain via its CORS configuration.
