const { ipcMain, shell } = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();

// Database setup
let db;

const getDbPath = () => {
    const dbDir = path.join(app.getPath('userData'), 'db');
    return path.join(dbDir, 'attachments.db');
};

const initDatabase = async () => {
    const dbDir = path.dirname(getDbPath());
    try {
        await fs.access(dbDir);
    } catch {
        await fs.mkdir(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(getDbPath(), (err) => {
            if (err) {
                reject(err);
            } else {
                db.run(`
                    CREATE TABLE IF NOT EXISTS attachments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        date TEXT NOT NULL,
                        description TEXT,
                        notes TEXT,
                        fileName TEXT
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    });
};

// Error Handling
process.on('uncaughtException', (error) => {
    console.error("Unexpected error: ", error);
});
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });

    // Uncomment for production mode, loading from a built angular appp
    const angularDistPath = path.join(__dirname, '../angular/dist/attachmi/browser/index.html');
    win.loadFile(angularDistPath);

    // Uncomment for dev mode, loading from the `ng serve` server
    // win.loadURL('http://localhost:4200');
}
// App Lifecycle
app.whenReady().then(async () => {
    await initDatabase();
    createWindow();
});
app.on('window-all-closed', () => {
    if (db) db.close();
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Get the application data directory
const getStorageDir = () => {
    const storageDir = path.join(app.getPath('userData'), 'attachments');
    return storageDir;
};

// Ensure storage directory exists
const ensureStorageDir = async () => {
    const dir = getStorageDir();
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    return dir;
};

ipcMain.handle('message', async (event, message) => {
    console.log("Message from Renderer::", message);
    return 'hi';
});

ipcMain.handle('saveFile', async (event, fileName, fileData) => {
    try {
        const storageDir = await ensureStorageDir();
        const filePath = path.join(storageDir, fileName);

        // Convert base64 to buffer and save
        const buffer = Buffer.from(fileData, 'base64');
        await fs.writeFile(filePath, buffer);

        console.log('File saved:', filePath);
        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('loadFile', async (event, fileName) => {
    try {
        const storageDir = getStorageDir();
        const filePath = path.join(storageDir, fileName);

        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');

        return { success: true, data: base64 };
    } catch (error) {
        console.error('Error loading file:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('openFile', async (event, fileName) => {
    try {
        const storageDir = getStorageDir();
        const filePath = path.join(storageDir, fileName);

        // Check if file exists
        await fs.access(filePath);

        // Open file with default application
        await shell.openPath(filePath);

        return { success: true };
    } catch (error) {
        console.error('Error opening file:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('deleteFile', async (event, fileName) => {
    try {
        const storageDir = getStorageDir();
        const filePath = path.join(storageDir, fileName);

        // Check if file exists before attempting to delete
        await fs.access(filePath);

        // Delete the file
        await fs.unlink(filePath);

        console.log('File deleted:', filePath);
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
});

// Database IPC Handlers
ipcMain.handle('listAttachments', async (event) => {
    console.log('ipc:listAttachments()');
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM attachments ORDER BY id DESC', (err, rows) => {
            if (err) {
                console.error('Error listing attachments:', err);
                reject(err);
            } else {
                console.log('Loaded attachments from DB:', rows);
                resolve(rows || []);
            }
        });
    });
});

ipcMain.handle('createAttachment', async (event, attachment) => {
    console.log('ipc:createAttachment()');
    return new Promise((resolve, reject) => {
        const { name, date, description, notes, fileName } = attachment;
        db.run(
            'INSERT INTO attachments (name, date, description, notes, fileName) VALUES (?, ?, ?, ?, ?)',
            [name, date, description || '', notes || '', fileName || null],
            function (err) {
                if (err) {
                    console.error('Error creating attachment:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, name, date, description, notes, fileName });
                }
            }
        );
    });
});

ipcMain.handle('updateAttachment', async (event, attachment) => {
    console.log('ipc:updateAttachment()');
    return new Promise((resolve, reject) => {
        const { id, name, date, description, notes } = attachment;
        db.run(
            'UPDATE attachments SET name = ?, date = ?, description = ?, notes = ? WHERE id = ?',
            [name, date, description || '', notes || '', id],
            function (err) {
                if (err) {
                    console.error('Error updating attachment:', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
});

ipcMain.handle('deleteAttachment', async (event, id) => {
    console.log('ipc:deleteAttachment()');
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM attachments WHERE id = ?', [id], function (err) {
            if (err) {
                console.error('Error deleting attachment:', err);
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
});