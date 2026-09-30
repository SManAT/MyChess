# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MyChess is a two-player online chess game for school use (PH Noe). It is a two-package repo — `server/` (Express + Socket.IO + SQLite) and `client/` (Vite multi-page vanilla JS + jQuery + Bootstrap). The root `package.json` is stale: its scripts reference `display-server`/`display-client`/`display-backend` directories that do not exist. Ignore it and work inside `server/` and `client/`.

## Commands

```bash
# Server (from server/)
npm install
npm run dev          # nodemon --inspect server.js
npm start            # plain node
npm run production   # NODE_ENV=production

# Client (from client/)
npm install
npm run dev          # vite dev server on http://localhost:5173
npm run build        # vite build, then remove-crossorigin.js post-processes dist/*.html
npm run lint         # eslint . --ext .js,.vue
```

There is no test suite and no test runner configured.

`updateNodeModules.py` exists in both packages: an interactive `npm outdated` → `npm install <pkg>@latest` helper. Run it from within the package directory.

The server **must be started with `server/` as the working directory** — `clientTalk.js` and `socketHandler.js` open the DB via the relative path `"./DB/chessapp.db"`, and the winston logger writes to `"logs/server.log"` relative to CWD.

## Configuration

Both packages read `.env` (gitignored, present locally):

- `server/.env` — `APP_IP`, `APP_PORT` (server binds to these), `JWT_SECRET`, `DEBUG` (when set, `server.js` prints the endpoint table).
- `client/.env` — `VITE_SERVER_URL`, `VITE_SERVER_PORT`. Client env vars must carry the `VITE_` prefix to reach the bundle via `import.meta.env`.

The client talks to the server via an absolute URL (`http://${VITE_SERVER_URL}:${VITE_SERVER_PORT}`) built in `utils/axiosApi.js`, so the `/api` dev proxy in `vite.config.js` (pointing at port 5000) is not actually on the request path. Changing the server host/port means editing `client/.env`, not the proxy.

## Architecture

### Request/transport split

Two independent channels, both authenticated by the same login:

- **REST (axios → Express)** — everything lobby-related: login, player list, game creation, game list, game stats. Routes are declared in `server/modules/routes.js`, all `POST`, all mounted under `/api`, all behind `authenticateToken` except `/api/login`. Handlers live in `server/modules/clientTalk.js`.
- **Socket.IO** — everything in-game: `join-game`, `make-move`, `get-possible-moves`, plus presence and private messaging. Handled in `server/modules/socketHandler.js`.

`utils/axiosApi.js` is the only HTTP entry point on the client. Its request interceptor attaches `Authorization: Bearer <authToken>` and a `userid` header from `localStorage`; its response interceptor dispatches `server-reachable` / `server-unreachable` window events, which each page listens for to toggle the `.network_status` banner. Add new API calls through this module, never with raw `fetch`.

### Auth and client state

JWT signed with `JWT_SECRET`, 8h expiry. The server's `authenticateToken` middleware verifies the token and copies the raw `userid` header onto `req.userid` — handlers use `req.userid` (a string; DB helpers coerce with `Number()`), while `req.user` holds the JWT payload.

All client-side session state is `localStorage`: `authToken`, `userId`, `username`, `gameId`, `gameStatus`. `utils/tools.js#AuthGuard()` is called at the top of every protected entry file and redirects to `/index.html` when `authToken` is missing. `socketManager` reads `username` from `localStorage` and sends it in the Socket.IO handshake `auth` object — the server has no other identification of the socket.

### Connection tracking

`server/modules/connectionManager.js` is a singleton holding two in-memory maps: `socketId → connection data` and `username → Set<socketId>`. A user may hold several sockets (multiple tabs). `socketUtils.js` is the thin read/emit facade over it — use `emitToUser`, `isUserOnline`, etc. rather than reaching into the manager. Sockets also join a `user_${username}` room on connect, and a `game-${gameId}` room on `join-game`. Stale connections (>20 min without `updateLastActivity`) are swept every 60s by an interval in `socketHandler.js`; any handler that should keep a session alive has to call `connectionManager.updateLastActivity(socket.id)` explicitly.

### Chess engine

Server-authoritative. `server/game/ChessGame.js` holds the per-game state (8×8 array of piece chars — uppercase = white, lowercase = black, `null` = empty; `players`, `currentPlayer`, `gameStatus`, `moveHistory`) and delegates rules to `server/game/ChessLogic.js`. The client's `chess/ChessBoard.js` only renders and collects clicks — it asks the server for legal moves (`get-possible-moves`) and sends intents (`make-move`); it never validates.

Note the current gap: `socketHandler.js` keeps `games`/`players` Maps that `join-game` never populates (it only joins rooms and marks the player online in SQLite), so `make-move` and `get-possible-moves` return early. Wiring persisted games in `DB.games` to in-memory `ChessGame` instances is the missing link between the lobby and a playable board.

### Persistence

`better-sqlite3`, synchronous, file at `server/DB/chessapp.db` (WAL mode, foreign keys on). `server/modules/database.js` is a hand-rolled wrapper: a generic CRUD/query layer (`create`, `read`, `update`, `delete`, `transaction`, `createTable`, …) plus domain methods (`getUserId`, `getPlayers`, `getGames`, `getOtherPlayer`, `createNewGame`, `setUserInGameOnline`, …). Handlers instantiate `new SQLiteDatabase("./DB/chessapp.db", { verbose: false })` per request and never close it.

Schema (two tables, defined in `server/modules/dbInit.js`): `users` (id, username, password, online, created_at) and `games` (id, name, player1_id, player2_id, player1_inGame, player2_inGame, stat, turn, erg, created_at). `games.stat` uses the `gameStats` enum — `CLOSED: 0`, `ACTIVE: 1` — which is duplicated as `server/modules/gameStats.js` (CommonJS) and `client/src/utils/gameStats.js` (ESM); keep both in sync.

`DBInit({ init, backupData })` is called from `server.js` and is normally a no-op (`init: false`). Setting `init: true` recreates tables **and** restores from the newest `server/DBbackups/chessapp_backup_*.sql`; `backupData: true` writes a fresh SQL dump there. `server/Dummy Users` holds seed `INSERT` statements for the `users` table.

### Client page structure

Vite multi-page app rooted at `client/` with sources under `src/`. Three pages, each an HTML file plus a matching entry module:

| URL | HTML | entry |
| --- | --- | --- |
| `/`, `/index.html` | `src/index.html` | `src/entries/main.js` (login) |
| `/lobby.html` | `src/lobby.html` | `src/entries/lobby.js` (games + online players) |
| `/game.html` | `src/game.html` | `src/entries/game.js` (board) |

Clean URLs work in dev only, via the inline `rewrite-urls` middleware plugin in `vite.config.js`. **`build.rollupOptions.input` lists only `index.html`** — `lobby.html` and `game.html` are not in the production build; add them there when touching the build.

Aliases: `@` → `src`, `@scss` → `src/scss` (`@js` → `src/js` points at a directory that doesn't exist). SCSS lives in `src/scss/`, one file per page, imported at the top of the corresponding entry. Static assets are referenced as `/src/public/...` from the HTML.

`utils/socketManager.js` is a singleton exported as an already-constructed instance — importing it opens the connection. Use `socketManager.emit/on/off`; note its `emit()` doubles as an internal event dispatcher for `socketManager:*` lifecycle events.

UI conventions: jQuery is the DOM layer (assigned to `window.$` in each entry), Bootstrap 5 for layout, SweetAlert2 for dialogs (cat images from `src/public/cat/` as `iconHtml`), moment for dates. User-facing strings are mostly German.

## Conventions

- Server code is CommonJS (`require`/`module.exports`); client code is ESM (`import`/`export`). Do not mix.
- Formatting differs per package and is intentional: `server/.prettierrc` sets `semi: false`, `printWidth: 200`; the client has no `.prettierrc` and uses Prettier defaults (semicolons, 80 cols). Match the package you are editing.
- ESLint runs on the client only, and as a Vite plugin as well as via `npm run lint`. The config turns off `no-unused-vars` and `no-console`, so lint passing says little.
- Logging: use `require("./logger").logger` (winston, 1 MB rotating `logs/server.log`) on the server rather than `console.log`.

## Known rough edges

Worth knowing before changing behavior — these are current state, not intentional design:

- `clientTalk.login` issues a JWT for any username/password without checking the `users` table password column at all.
- `entries/main.js` overwrites the submitted credentials with hardcoded debug values (`hans.moser`) before posting to `/api/login`.
- `entries/game.js` never calls `setupSocketListeners()`, so the game page registers no socket handlers.
- `users.online` in SQLite is not maintained by the socket lifecycle; live presence comes from `connectionManager`, while `getPlayers`/`getGames` read the stale DB column.
