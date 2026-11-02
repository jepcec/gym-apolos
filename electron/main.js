const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const backupManager = require("./backup-manager");

let mainWindow;
let nextServer;
const PORT = 3456;

// Marca de la app (mantener sincronizado con app/lib/branding.ts)
const BRAND = {
  name: "FORJA",
  tagline: "Gym & Entrenamiento",
  description: "Sistema de gestión para gimnasios",
  ember: "#ef7a45",
};

function getDatabasePath() {
  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "database");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, "app.db");
}

function copyDatabaseIfNotExists() {
  const dbPath = getDatabasePath();
  if (!fs.existsSync(dbPath)) {
    let sourceDb;
    if (app.isPackaged) {
      sourceDb = path.join(process.resourcesPath, "database", "dev.db");
    } else {
      sourceDb = path.join(__dirname, "..", "dev.db");
    }
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath);
    }
  }
  return dbPath;
}

function waitForServer(url, retries = 60, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(url, (res) => {
        resolve();
      });
      req.on("error", () => {
        if (attempts >= retries) {
          reject(new Error(`Server not ready after ${retries} attempts`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
        if (attempts >= retries) {
          reject(new Error(`Server not ready after ${retries} attempts`));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    check();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const dbPath = copyDatabaseIfNotExists();
    const env = {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: `file:${dbPath}`,
      NODE_ENV: "production",
    };

    let serverPath;
    let cwd;

    if (app.isPackaged) {
      cwd = path.join(process.resourcesPath, "app");
      serverPath = path.join(cwd, "server.js");
    } else {
      cwd = path.join(__dirname, "..");
      serverPath = path.join(cwd, ".next", "standalone", "server.js");
    }

    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Server file not found: ${serverPath}. Run 'npm run build' first.`));
      return;
    }

    // Electron ya incluye su propio runtime de Node. Usarlo evita distribuir
    // un node.exe adicional dentro del instalador.
    const nodeBin = process.execPath;

    nextServer = spawn(nodeBin, [serverPath], {
      cwd,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    nextServer.stdout.on("data", (data) => {
      console.log(`[Next.js] ${data}`);
    });

    nextServer.stderr.on("data", (data) => {
      console.error(`[Next.js] ${data}`);
    });

    nextServer.on("error", (err) => {
      reject(new Error(`Failed to start server: ${err.message}`));
    });

    nextServer.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    waitForServer(`http://127.0.0.1:${PORT}`)
      .then(() => resolve())
      .catch(reject);
  });
}

function getSplashHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        .container {
          text-align: center;
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          font-size: 52px;
          font-weight: 700;
          color: #f2f1ee;
          margin-bottom: 8px;
          letter-spacing: 0.06em;
        }
        .knurl {
          width: 30px;
          height: 9px;
          background: repeating-linear-gradient(90deg, ${BRAND.ember} 0 3px, transparent 3px 8px);
          border-radius: 2px;
        }
        .subtitle {
          color: #83858b;
          font-size: 14px;
          margin-bottom: 32px;
          letter-spacing: 0.04em;
        }
        .loader {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,.1);
          border-radius: 50%;
          border-top-color: ${BRAND.ember};
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .status {
          color: #555;
          font-size: 13px;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">${BRAND.name} <span class="knurl" aria-hidden="true"></span></div>
        <div class="subtitle">${BRAND.tagline}</div>
        <div class="loader"></div>
        <div class="status">Iniciando aplicación...</div>
      </div>
    </body>
    </html>
  `;
}

function createWindow() {
  const iconPath = path.join(__dirname, "icon.ico");
  const preloadPath = path.join(__dirname, "preload.js");
  const windowOptions = {
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: BRAND.name,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    show: true,
  };

  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHTML())}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function loadApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
    
    mainWindow.webContents.executeJavaScript(`
      const style = document.createElement('style');
      style.textContent = 'body { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
      document.head.appendChild(style);
    `).catch(() => {});
  } catch (err) {
    console.error("Failed to load app:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; 
                   background: #1a1a2e; color: #fff; font-family: sans-serif; flex-direction: column; }
            .error { color: #ef4444; font-size: 18px; margin-bottom: 16px; }
            .details { color: #8b9dc3; font-size: 14px; max-width: 500px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="error">Error al iniciar la aplicación</div>
          <div class="details">${err.message}</div>
        </body>
        </html>
      `)}`);
    }
  }
}

async function loadSettingsForBackup() {
  try {
    const prismaModule = path.join(
      app.isPackaged ? process.resourcesPath : path.join(__dirname, ".."),
      "app", "generated", "prisma", "index.js"
    );
    
    if (fs.existsSync(prismaModule)) {
      const { PrismaClient } = require(prismaModule);
      const prisma = new PrismaClient({
        datasources: { db: { url: `file:${getDatabasePath()}` } },
      });
      const settings = await prisma.setting.findMany();
      await prisma.$disconnect();
      const result = {};
      settings.forEach(s => { result[s.key] = s.value; });
      return result;
    }
  } catch (error) {
    console.error("Error loading settings for backup:", error);
  }
  return {};
}

ipcMain.handle("backup:create", () => {
  try {
    return { success: true, backup: backupManager.createBackup() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:list", () => {
  try {
    return { success: true, backups: backupManager.listBackups() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:delete", (event, id) => {
  try {
    backupManager.deleteBackup(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:restore", async (event, id) => {
  try {
    await backupManager.restoreBackup(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:export", async (event, id) => {
  try {
    return await backupManager.exportBackup(id);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:import", async () => {
  try {
    return await backupManager.importBackup();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:cleanup", (event, count) => {
  try {
    return { success: true, result: backupManager.cleanupOldBackups(count) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:scheduleAuto", (event, frequency, retention) => {
  try {
    backupManager.scheduleAutoBackup(frequency, retention);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup:stopAuto", () => {
  try {
    backupManager.stopAutoBackup();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(async () => {
  createWindow();
  
  try {
    await startNextServer();
    await loadApp();
    
    const settings = await loadSettingsForBackup();
    if (settings.backup_auto_enabled === "true") {
      const frequency = settings.backup_frequency || "daily";
      const retention = parseInt(settings.backup_retention_count || "10", 10);
      backupManager.scheduleAutoBackup(frequency, retention);
    }
  } catch (err) {
    console.error("Failed to start application:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; 
                   background: #1a1a2e; color: #fff; font-family: sans-serif; flex-direction: column; }
            .error { color: #ef4444; font-size: 18px; margin-bottom: 16px; }
            .details { color: #8b9dc3; font-size: 14px; max-width: 500px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="error">Error al iniciar el servidor</div>
          <div class="details">${err.message}</div>
        </body>
        </html>
      `)}`);
    }
  }
});

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
  }
  app.quit();
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }
});
