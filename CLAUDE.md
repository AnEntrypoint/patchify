
# Patchify - JavaScript-Only, Build-Less Architecture

## Bun Runtime

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## JavaScript Only (No TypeScript)

- **Use plain JavaScript (.js) for all backend files**. No TypeScript, no type annotations.
- **Use JSX (.jsx) for React components** in the frontend. JSX is valid JavaScript and works natively.
- No tsconfig.json, no TypeScript compiler, no type checking.
- No Python. Migrate all Python functionality to JavaScript.

## Bun APIs and Libraries

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file()` over `node:fs`'s readFile/writeFile

## Testing

Use `bun test` to run tests.

```js#index.test.js
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend (WebJSX - Local & Build-Less)

The frontend uses **WebJSX**, a lightweight JSX framework that runs directly in the browser without a build step. It's installed locally in `frontend/node_modules/webjsx` (no CDN).

### WebJSX Setup

WebJSX is installed via npm and imported locally:

```js
import webjsx from '/node_modules/webjsx/dist/index.mjs';
const { jsx, render } = webjsx;
```

The frontend uses pure vanilla JavaScript with simple DOM manipulation - no React, no Vite, no build tools needed.

### Running the Frontend

The frontend is served by the Bun backend. Simply start the backend and visit `http://localhost:3000` in your browser. The HTML page loads WebJSX from local `node_modules` and runs the app directly.

## Build-Less Approach

This project uses Bun's native support for JavaScript and JSX without requiring a separate build step. Run files directly with Bun.

### Backend Server

Backend code runs directly as JavaScript without compilation:

```js#server/index.js
import { serve } from 'bun';
import { join } from 'path';

const PORT = process.env.PORT || 3000;

serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);
```

Run the server directly:

```sh
bun run server/index.js
# or with hot reload for development
bun --hot server/index.js
```

### Frontend (React with JSX)

Frontend uses JSX files that Bun compiles automatically. Each `.jsx` file is a React component:

```jsx
import React from 'react';

export default function App() {
  return <h1>Hello, Patchify!</h1>;
}
```

Entry point loads the React app:

```jsx#frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Running the Project

```sh
# Start development server with hot reload
bun run dev

# Start production server
bun start

# Run CLI tools
bun run cli <command>

# Run tests
bun test
```

For more information, visit https://bun.sh/docs
