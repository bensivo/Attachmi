# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attachmi is a desktop application for structured document storage, built with Electron, Angular, and SQLite. The app uses a monorepo structure with separate `angular/` and `electron/` directories.

## Tech Stack

- **Frontend**: Angular 21 with TypeScript 5.9, Less for styling
- **Desktop**: Electron 40
- **Backend/Storage**: Node.js 24, SQLite (planned)
- **Testing**: Vitest
- **Package Manager**: npm 11.6.2

## Architecture

### Directory Structure
- `angular/` - Angular frontend application
  - `src/app/` - Angular components and app logic
  - Built output goes to `angular/dist/attachmi/browser/`
- `electron/` - Electron main process
  - `main.js` - Main Electron process, creates BrowserWindow and handles app lifecycle
  - `preload.js` - Preload script that exposes `electronAPI` to renderer via contextBridge

### IPC Communication
The app uses Electron's IPC for Angular-Electron communication:
- **Frontend**: Components call `(window as any).electronAPI.sendMessage()`
- **Preload**: `preload.js` exposes `electronAPI.sendMessage()` via contextBridge
- **Backend**: `main.js` handles IPC messages via `ipcMain.handle('message', ...)`

### Development vs Production
Electron's `main.js` has two loading modes (electron/main.js:21-25):
- **Production**: Loads built Angular files from `angular/dist/attachmi/browser/index.html`
- **Development**: Uncomment line 25 to load from `http://localhost:4200` when Angular dev server is running

## Common Commands

### Development
```bash
# Frontend development (run in terminal 1)
cd angular && npm start              # Starts Angular dev server on localhost:4200

# Electron development (run in terminal 2)
cd electron && npm run dev           # Starts Electron with auto-restart on file changes
```

### Building
```bash
# Build Angular app
cd angular && npm run build          # or: npm run build (from root)

# Build and start (production mode)
npm run start                        # From root: builds Angular, then starts Electron
```

### Testing
```bash
cd angular && npm test               # Run Vitest tests
```

### Code Style
Prettier is configured in `angular/package.json`:
- Print width: 100
- Single quotes
- Angular parser for HTML files
