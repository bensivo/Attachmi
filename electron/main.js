const { ipcMain, shell } = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
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