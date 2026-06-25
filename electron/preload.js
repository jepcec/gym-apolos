const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  backup: {
    create: () => ipcRenderer.invoke("backup:create"),
    list: () => ipcRenderer.invoke("backup:list"),
    delete: (id) => ipcRenderer.invoke("backup:delete", id),
    restore: (id) => ipcRenderer.invoke("backup:restore", id),
    export: (id) => ipcRenderer.invoke("backup:export", id),
    import: () => ipcRenderer.invoke("backup:import"),
    cleanup: (count) => ipcRenderer.invoke("backup:cleanup", count),
    scheduleAuto: (frequency, retention) => ipcRenderer.invoke("backup:scheduleAuto", frequency, retention),
    stopAuto: () => ipcRenderer.invoke("backup:stopAuto"),
  },
});
