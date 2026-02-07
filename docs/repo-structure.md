# Repository Structure

This document provides an overview of the Attachmi repository layout.

## Top-Level Structure

```
Attachmi/
├── angular/              # Angular frontend application
├── electron/             # Electron main process and desktop packaging
├── docs/                 # Project documentation
├── manual-tests/         # Manual testing checklists and procedures
├── package.json          # Root package.json with build scripts
├── CLAUDE.md             # AI assistant guidance for codebase
└── TODO                  # Project task list
```

## Directory Details

### `angular/` - Frontend Application

The Angular-based user interface for the application.

```
angular/
├── src/                  # Source code
│   ├── app/              # Angular application code
│   │   ├── components/   # UI components
│   │   │   ├── add-attachment-modal/
│   │   │   ├── attachment-details/
│   │   │   ├── attachments-list/
│   │   │   ├── filter-bar/
│   │   │   └── header/
│   │   ├── model/        # Data models and TypeScript interfaces
│   │   ├── services/     # Angular services (state management, data access)
│   │   ├── app.ts        # Root component
│   │   ├── app.html      # Root component template
│   │   ├── app.less      # Root component styles
│   │   ├── app.spec.ts   # Root component tests
│   │   ├── app.config.ts # Angular configuration
│   │   └── app.routes.ts # Angular routing configuration
│   ├── index.html        # Application entry point
│   ├── main.ts           # Angular bootstrap
│   └── styles.less       # Global styles
├── public/               # Static assets (favicon, etc.)
├── dist/                 # Build output (Angular compiled assets)
├── node_modules/         # npm dependencies
├── angular.json          # Angular CLI configuration
├── tsconfig.json         # TypeScript configuration (base)
├── tsconfig.app.json     # TypeScript configuration (application)
├── tsconfig.spec.json    # TypeScript configuration (tests)
└── package.json          # Dependencies and scripts (includes Prettier config)
```

### `electron/` - Desktop Application

The Electron wrapper that turns the Angular app into a desktop application.

```
electron/
├── main.js               # Main process entry point, creates BrowserWindow
├── preload.js            # Preload script, exposes electronAPI via contextBridge
├── dist/                 # Packaged application outputs (DMG, ZIP, etc.)
├── dist-angular/         # Copied Angular build for packaging
├── node_modules/         # npm dependencies
└── package.json          # Dependencies, scripts, and electron-builder config
```

### `docs/` - Documentation

Project documentation files.

```
docs/
├── overview.md           # Project overview
├── technologies.md       # Technology stack documentation
├── style-guide.txt       # Code style guidelines
└── repo-structure.md     # This file
```

### `manual-tests/` - Manual Testing

Manual test procedures and checklists for QA.

```
manual-tests/
├── basic-functionality.md   # Core feature testing checklist
└── keyboard-shortcuts.md    # Keyboard shortcut testing procedures
```

## Source Code Location

- **Frontend source**: `angular/src/app/`
- **Components**: `angular/src/app/components/`
- **Services**: `angular/src/app/services/`
- **Models**: `angular/src/app/model/`
- **Electron main process**: `electron/main.js`
- **Electron preload**: `electron/preload.js`

## Test Location

- **Unit tests**: Located alongside source files using the `*.spec.ts` naming convention
- **Primary test file**: `angular/src/app/app.spec.ts`
- **Test runner**: Vitest (configured in Angular project)

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` (root) | Root build scripts for monorepo |
| `angular/package.json` | Angular dependencies, scripts, Prettier config |
| `electron/package.json` | Electron dependencies, scripts, electron-builder config |
| `angular/angular.json` | Angular CLI configuration |
| `angular/tsconfig.json` | Base TypeScript configuration |
| `angular/tsconfig.app.json` | App-specific TypeScript settings |
| `angular/tsconfig.spec.json` | Test-specific TypeScript settings |

## Build Outputs and Artifacts

| Location | Contents |
|----------|----------|
| `angular/dist/attachmi/browser/` | Compiled Angular application (HTML, JS, CSS) |
| `electron/dist/` | Packaged desktop applications (DMG, ZIP, installers) |
| `electron/dist-angular/` | Copy of Angular build used during Electron packaging |
| `angular/.angular/cache/` | Angular build cache (gitignored) |

## Scripts and Tooling

### Root Scripts (`package.json`)
- `npm run build` - Build Angular application
- `npm run start` - Build Angular and start Electron in production mode

### Angular Scripts (`angular/package.json`)
- `npm start` - Start Angular dev server on localhost:4200
- `npm run build` - Build Angular for production
- `npm test` - Run Vitest tests

### Electron Scripts (`electron/package.json`)
- `npm run start` - Start Electron app
- `npm run dev` - Start Electron with auto-restart on changes (uses nodemon)
- `npm run build` - Full build (Angular + Electron packaging)
- `npm run build:mac` - Build for macOS
- `npm run build:win` - Build for Windows
- `npm run build:linux` - Build for Linux
