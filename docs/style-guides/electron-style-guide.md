# Electron Style Guide

This document describes the Electron-specific conventions and patterns used in the Attachmi codebase. The Electron code is written in JavaScript (CommonJS).

## File Organization

### Directory Structure
```
electron/
  main.js              # Main process - app lifecycle, window creation, IPC handlers
  preload.js           # Preload script - bridges main and renderer processes
  package.json         # Electron dependencies and build configuration
  dist-angular/        # Built Angular app (copied during build)
  node_modules/
```

### Separation of Concerns
- `main.js` - Contains all main process logic including:
  - App lifecycle management
  - Window creation
  - Database initialization and operations
  - File system operations
  - IPC handlers
- `preload.js` - Minimal, only exposes API to renderer

## JavaScript Conventions

### Module System
Uses **CommonJS** (`require`/`module.exports`):
```javascript
const { ipcMain, shell, dialog } = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
```

### Destructuring Imports
Group related imports from same module:
```javascript
const { ipcMain, shell, dialog } = require('electron');
const { app, BrowserWindow } = require('electron');
```

### Variable Declarations
- Use `const` for values that won't be reassigned
- Use `let` for mutable variables
- Global state variables at module scope:
```javascript
let db;
```

## Naming Conventions

### Functions
- Use **camelCase**: `createWindow`, `initDatabase`, `getStorageDir`
- Action prefixes: `get`, `create`, `update`, `delete`, `ensure`, `init`

### IPC Handlers
- Use **camelCase** matching the operation: `'listAttachments'`, `'createAttachment'`, `'saveFile'`
- No namespace prefixes (e.g., NOT `'attachments:list'`)

### Database Tables
- Use **snake_case**: `attachments`, `collections`, `collection_attachments`

### Variables
- Use **camelCase**: `storageDir`, `dbDir`, `filePath`, `angularDistPath`

## Code Organization in main.js

### Section Order
1. Imports
2. Global variables (database reference)
3. Database helper functions
4. Database initialization
5. Error handling setup
6. Window creation function
7. App lifecycle handlers
8. File system helper functions
9. IPC handlers (grouped by domain)

### Grouping IPC Handlers
Group related handlers with comments:
```javascript
// Database IPC Handlers
ipcMain.handle('listAttachments', async (event) => { ... });
ipcMain.handle('createAttachment', async (event, attachment) => { ... });

// Collections IPC Handlers
ipcMain.handle('listCollections', async (event) => { ... });

// Collection-Attachment Relationship Handlers
ipcMain.handle('getCollectionAttachments', async (event, collectionId) => { ... });
```

## IPC Communication Pattern

### Handler Registration
Use `ipcMain.handle` for async request-response:
```javascript
ipcMain.handle('operationName', async (event, ...args) => {
    // Implementation
    return result;
});
```

### Preload Bridge Pattern
Expose APIs via `contextBridge` in preload.js:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.invoke('message', message),
  saveFile: (fileName, fileData) => ipcRenderer.invoke('saveFile', fileName, fileData),
  // ... more methods
});
```

### API Design
- Keep method signatures simple
- Pass objects for complex data:
```javascript
createAttachment: (attachment) => ipcRenderer.invoke('createAttachment', attachment),
```
- Pass individual parameters for simple operations:
```javascript
deleteAttachment: (id) => ipcRenderer.invoke('deleteAttachment', id),
downloadFile: (fileName, displayName) => ipcRenderer.invoke('downloadFile', fileName, displayName),
```

## Error Handling

### Global Error Handler
```javascript
process.on('uncaughtException', (error) => {
    console.error("Unexpected error: ", error);
});
```

### IPC Handler Pattern
Return success/error objects for file operations:
```javascript
ipcMain.handle('saveFile', async (event, fileName, fileData) => {
    try {
        // ... operation
        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: error.message };
    }
});
```

### Database Operations
Use Promise wrappers with resolve/reject:
```javascript
return new Promise((resolve, reject) => {
    db.all('SELECT * FROM attachments', (err, rows) => {
        if (err) {
            console.error('Error listing attachments:', err);
            reject(err);
        } else {
            resolve(rows || []);
        }
    });
});
```

## Console Logging

### Debug Logging
- Log IPC method invocations: `console.log('ipc:listAttachments()');`
- Log file paths: `console.log('Loading Angular app from:', angularDistPath);`
- Log data operations: `console.log('Loaded attachments from DB:', rows);`

### Error Logging
- Always use `console.error` for errors
- Include context: `console.error('Error saving file:', error);`

## Database Patterns

### SQLite Setup
```javascript
const sqlite3 = require('sqlite3').verbose();
let db;

const initDatabase = async () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(getDbPath(), (err) => {
            if (err) {
                reject(err);
            } else {
                db.serialize(() => {
                    // Run migrations
                });
            }
        });
    });
};
```

### SQL Formatting
- Use template literals for multi-line SQL
- Indent SQL for readability
```javascript
db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        fileName TEXT
    )
`, callback);
```

### Parameterized Queries
Always use parameterized queries to prevent SQL injection:
```javascript
db.run(
    'INSERT INTO attachments (name, date, description, notes, fileName) VALUES (?, ?, ?, ?, ?)',
    [name, date, description || '', notes || '', fileName || null],
    function (err) { ... }
);
```

### Accessing Last Insert ID
Use `this.lastID` in the callback context:
```javascript
function (err) {
    if (err) {
        reject(err);
    } else {
        resolve({ id: this.lastID, name, date, description, notes, fileName });
    }
}
```

## File System Patterns

### Using Promises API
```javascript
const fs = require('fs').promises;
```

### Path Construction
Use `path.join` for cross-platform compatibility:
```javascript
const filePath = path.join(storageDir, fileName);
const angularDistPath = path.join(__dirname, 'dist-angular', 'attachmi', 'browser', 'index.html');
```

### Storage Directory Pattern
```javascript
const getStorageDir = () => {
    return path.join(app.getPath('userData'), 'attachments');
};

const ensureStorageDir = async () => {
    const dir = getStorageDir();
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    return dir;
};
```

## BrowserWindow Configuration

### Window Creation
```javascript
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
        // Frameless window for custom titlebar
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    });
}
```

### Security Settings
- `contextIsolation: true` - Required for secure preload scripts
- `enableRemoteModule: false` - Disabled for security

## App Lifecycle

### Startup Sequence
```javascript
app.whenReady().then(async () => {
    await initDatabase();
    createWindow();
});
```

### Window Management
```javascript
app.on('window-all-closed', () => {
    if (db) db.close();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

## Development vs Production

### Loading Angular App
```javascript
let angularDistPath;
if (app.isPackaged) {
    // Production: bundled with app
    angularDistPath = path.join(__dirname, 'dist-angular', 'attachmi', 'browser', 'index.html');
} else {
    // Development: from Angular build output
    angularDistPath = path.join(__dirname, '..', 'angular', 'dist', 'attachmi', 'browser', 'index.html');
}
win.loadFile(angularDistPath);

// Alternative for dev mode with ng serve:
// win.loadURL('http://localhost:4200');
```

## Shell Integration

### Opening Files
```javascript
const { shell } = require('electron');

await shell.openPath(filePath);  // Open with default app
shell.showItemInFolder(destPath);  // Show in file explorer
```

### Save Dialog
```javascript
const { dialog } = require('electron');

const { canceled, filePath: destPath } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('downloads'), defaultFileName),
    filters: [
        { name: 'All Files', extensions: ['*'] }
    ]
});
```

## Build Configuration

### electron-builder Setup (in package.json)
```json
{
  "build": {
    "appId": "com.attachmi.app",
    "productName": "Attachmi",
    "directories": {
      "output": "dist",
      "buildResources": "assets"
    },
    "files": [
      "main.js",
      "preload.js",
      "node_modules/**/*",
      "dist-angular/**/*"
    ]
  }
}
```

## Comments

### File Header
Simple comment identifying the file:
```javascript
// preload.js
```

### No JSDoc
The Electron code doesn't use JSDoc comments; inline comments are used for clarification when needed.
