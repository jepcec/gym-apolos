const { app, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

class BackupManager {
  constructor() {
    this.backupDir = this.getBackupDir();
    this.dbPath = this.getDatabasePath();
    this.autoBackupInterval = null;
  }

  getBackupDir() {
    const userDataPath = app.getPath("userData");
    const backupDir = path.join(userDataPath, "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  }

  getDatabasePath() {
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "database", "app.db");
  }

  createBackup() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        throw new Error("Base de datos no encontrada");
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const backupName = `backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupName);

      fs.copyFileSync(this.dbPath, backupPath);

      const stats = fs.statSync(backupPath);
      return {
        id: backupName,
        name: backupName,
        path: backupPath,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    } catch (error) {
      console.error("Error creating backup:", error);
      throw error;
    }
  }

  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith(".db"));
      const backups = files.map(filename => {
        const filePath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filePath);
        return {
          id: filename,
          name: filename,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
        };
      });

      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error listing backups:", error);
      return [];
    }
  }

  deleteBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error("Backup no encontrado");
      }
      fs.unlinkSync(backupPath);
      return true;
    } catch (error) {
      console.error("Error deleting backup:", error);
      throw error;
    }
  }

  async restoreBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error("Backup no encontrado");
      }

      const tempPath = `${this.dbPath}.restoring`;
      fs.copyFileSync(backupPath, tempPath);
      fs.renameSync(tempPath, this.dbPath);

      return true;
    } catch (error) {
      console.error("Error restoring backup:", error);
      throw error;
    }
  }

  async exportBackup(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      if (!fs.existsSync(backupPath)) {
        throw new Error("Backup no encontrado");
      }

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Exportar backup",
        defaultPath: backupId,
        filters: [
          { name: "Base de datos SQLite", extensions: ["db"] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      fs.copyFileSync(backupPath, filePath);
      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error exporting backup:", error);
      throw error;
    }
  }

  async importBackup() {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Importar backup",
        filters: [
          { name: "Base de datos SQLite", extensions: ["db"] },
        ],
        properties: ["openFile"],
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const sourcePath = filePaths[0];
      const filename = path.basename(sourcePath);
      const destPath = path.join(this.backupDir, filename);

      fs.copyFileSync(sourcePath, destPath);

      const stats = fs.statSync(destPath);
      return {
        success: true,
        backup: {
          id: filename,
          name: filename,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
        },
      };
    } catch (error) {
      console.error("Error importing backup:", error);
      throw error;
    }
  }

  cleanupOldBackups(retentionCount = 10) {
    try {
      const backups = this.listBackups();
      if (backups.length <= retentionCount) {
        return { deleted: 0 };
      }

      const toDelete = backups.slice(retentionCount);
      toDelete.forEach(backup => {
        const backupPath = path.join(this.backupDir, backup.id);
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
      });

      return { deleted: toDelete.length };
    } catch (error) {
      console.error("Error cleaning up backups:", error);
      throw error;
    }
  }

  scheduleAutoBackup(frequency = "daily", retentionCount = 10) {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }

    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const interval = intervals[frequency] || intervals.daily;

    this.autoBackupInterval = setInterval(() => {
      try {
        this.createBackup();
        this.cleanupOldBackups(retentionCount);
        console.log("Auto backup created successfully");
      } catch (error) {
        console.error("Error in auto backup:", error);
      }
    }, interval);

    console.log(`Auto backup scheduled: ${frequency} (every ${interval}ms)`);
  }

  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      console.log("Auto backup stopped");
    }
  }
}

module.exports = new BackupManager();
