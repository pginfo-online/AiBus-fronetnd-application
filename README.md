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

Set `VITE_API_BASE_URL` in `.env` to the base URL of the AIBus API. Vite exposes
variables prefixed with `VITE_` to browser code, so do not put secrets in them.

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

The production build is written to `dist/`. When deploying the app, configure
the host to serve `index.html` as a fallback for client-side routes.
