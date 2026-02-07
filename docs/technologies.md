# Technologies

This document lists the technologies used in the Attachmi project.

## Programming Languages

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.9 | Primary language for Angular frontend development |
| JavaScript | ES2022 (target) | Electron main process and preload scripts |

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21 | Frontend framework for building the single-page application UI |
| RxJS | 7.8 | Reactive programming library used with Angular for observables and async data streams |
| NG-ZORRO (ng-zorro-antd) | 21 | UI component library based on Ant Design, provides pre-built components (layout, splitter, modals, forms) |
| Angular CDK | 21 | Component Dev Kit providing accessibility primitives and utilities |
| Less | 4 | CSS preprocessor for styling, used for component styles and NG-ZORRO theming |

## Desktop Application

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 40 | Desktop application framework that wraps the Angular app into a native desktop application |

## Backend / Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime for Electron main process, handles file system operations and IPC |
| SQLite (sqlite3) | 5 | Embedded database for persistent storage of attachments and collections metadata |

## Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular CLI | 21 | Build tooling and development server for Angular application |
| Electron Builder | 24 | Packaging and distribution tool for creating installers (DMG, NSIS, AppImage) |
| npm | 11.6 | Package manager for dependency management |

## Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 4 | Unit testing framework, used with Angular's built-in test runner |
| JSDOM | 27 | DOM implementation for running tests in Node.js environment |

## Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| Nodemon | 3 | Development utility that auto-restarts Electron on file changes |
| Prettier | - | Code formatter (configured in package.json) |
