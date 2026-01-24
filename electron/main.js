const { ipcMain, shell, dialog } = require('electron');
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
                // Run migrations in sequence
                db.serialize(() => {
                    // Create attachments table
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
                        if (err) {
                            reject(err);
                            return;
                        }
                    });

                    // Create collections table
                    db.run(`
                        CREATE TABLE IF NOT EXISTS collections (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL
                        )
                    `, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                    });

                    // Create collection_attachments junction table
                    db.run(`
                        CREATE TABLE IF NOT EXISTS collection_attachments (
                            collection_id INTEGER NOT NULL,
                            attachment_id INTEGER NOT NULL,
                            PRIMARY KEY (collection_id, attachment_id),
                            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
                            FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE
                        )
                    `, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
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
        },

        // remove the default titlebar
        // and some code to expose window controls in Windows/Linux
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    });

    // Load angular app - works in both dev and packaged versions
    let angularDistPath;
    if (app.isPackaged) {
        // In packaged app, angular files are in dist-angular folder within Resources
        angularDistPath = path.join(__dirname, 'dist-angular', 'attachmi', 'browser', 'index.html');
    } else {
        // In development, angular files are in ../angular/dist
        angularDistPath = path.join(__dirname, '..', 'angular', 'dist', 'attachmi', 'browser', 'index.html');
    }

    console.log('Loading Angular app from:', angularDistPath);
    win.loadFile(angularDistPath).catch(err => {
        console.error('Failed to load Angular app:', err);
    });

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

ipcMain.handle('downloadFile', async (event, fileName, displayName) => {
    try {
        const storageDir = getStorageDir();
        const sourcePath = path.join(storageDir, fileName);

        // Check if source file exists
        await fs.access(sourcePath);

        // Get the file extension from the internal filename
        const ext = path.extname(fileName);

        // Build the default filename using displayName + original extension
        // Avoid duplicate extensions if displayName already ends with the same extension
        const displayNameExt = path.extname(displayName);
        const defaultFileName = displayNameExt.toLowerCase() === ext.toLowerCase()
            ? displayName
            : displayName + ext;

        // Show save dialog
        const { canceled, filePath: destPath } = await dialog.showSaveDialog({
            defaultPath: path.join(app.getPath('downloads'), defaultFileName),
            filters: [
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled || !destPath) {
            return { success: false, canceled: true };
        }

        // Copy the file to the chosen location
        await fs.copyFile(sourcePath, destPath);

        // Open the folder and select the file
        shell.showItemInFolder(destPath);

        return { success: true, destPath };
    } catch (error) {
        console.error('Error downloading file:', error);
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

// Collections IPC Handlers
ipcMain.handle('listCollections', async (event) => {
    console.log('ipc:listCollections()');
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT
                c.id,
                c.name,
                COUNT(ca.attachment_id) as count
            FROM collections c
            LEFT JOIN collection_attachments ca ON c.id = ca.collection_id
            GROUP BY c.id, c.name
            ORDER BY c.id DESC
        `, (err, rows) => {
            if (err) {
                console.error('Error listing collections:', err);
                reject(err);
            } else {
                console.log('Loaded collections from DB:', rows);
                resolve(rows || []);
            }
        });
    });
});

ipcMain.handle('createCollection', async (event, collection) => {
    console.log('ipc:createCollection()');
    return new Promise((resolve, reject) => {
        const { name } = collection;
        db.run(
            'INSERT INTO collections (name) VALUES (?)',
            [name],
            function (err) {
                if (err) {
                    console.error('Error creating collection:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, name, count: 0 });
                }
            }
        );
    });
});

ipcMain.handle('updateCollection', async (event, collection) => {
    console.log('ipc:updateCollection()');
    return new Promise((resolve, reject) => {
        const { id, name } = collection;
        db.run(
            'UPDATE collections SET name = ? WHERE id = ?',
            [name, id],
            function (err) {
                if (err) {
                    console.error('Error updating collection:', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
});

ipcMain.handle('deleteCollection', async (event, id) => {
    console.log('ipc:deleteCollection()');
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM collections WHERE id = ?', [id], function (err) {
            if (err) {
                console.error('Error deleting collection:', err);
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
});

// Collection-Attachment Relationship Handlers
ipcMain.handle('getCollectionAttachments', async (event, collectionId) => {
    console.log('ipc:getCollectionAttachments()');
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT a.*
            FROM attachments a
            INNER JOIN collection_attachments ca ON a.id = ca.attachment_id
            WHERE ca.collection_id = ?
            ORDER BY a.id DESC
        `, [collectionId], (err, rows) => {
            if (err) {
                console.error('Error getting collection attachments:', err);
                reject(err);
            } else {
                console.log('Loaded attachments for collection:', rows);
                resolve(rows || []);
            }
        });
    });
});

ipcMain.handle('addAttachmentToCollection', async (event, collectionId, attachmentId) => {
    console.log('ipc:addAttachmentToCollection()');
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT OR IGNORE INTO collection_attachments (collection_id, attachment_id) VALUES (?, ?)',
            [collectionId, attachmentId],
            function (err) {
                if (err) {
                    console.error('Error adding attachment to collection:', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
});

ipcMain.handle('removeAttachmentFromCollection', async (event, collectionId, attachmentId) => {
    console.log('ipc:removeAttachmentFromCollection()');
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM collection_attachments WHERE collection_id = ? AND attachment_id = ?',
            [collectionId, attachmentId],
            function (err) {
                if (err) {
                    console.error('Error removing attachment from collection:', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
});