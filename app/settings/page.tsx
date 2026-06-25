"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Database, Download, Upload, Trash2, RefreshCw, Plus, Shield } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import { apiFetch } from "../lib/api";

interface Settings {
  inactivity_days: string;
  warning_days: string;
  backup_auto_enabled: string;
  backup_frequency: string;
  backup_retention_count: string;
}

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
}

declare global {
  interface Window {
    electronAPI?: {
      backup: {
        create: () => Promise<{ success: boolean; backup?: Backup; error?: string }>;
        list: () => Promise<{ success: boolean; backups?: Backup[]; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean; error?: string }>;
        restore: (id: string) => Promise<{ success: boolean; error?: string }>;
        export: (id: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        import: () => Promise<{ success: boolean; backup?: Backup; canceled?: boolean; error?: string }>;
        cleanup: (count: number) => Promise<{ success: boolean; result?: { deleted: number }; error?: string }>;
        scheduleAuto: (frequency: string, retention: number) => Promise<{ success: boolean; error?: string }>;
        stopAuto: () => Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    inactivity_days: "30",
    warning_days: "7",
    backup_auto_enabled: "false",
    backup_frequency: "daily",
    backup_retention_count: "10",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI);
    loadSettings();
    loadBackups();
  }, []);

  async function loadSettings() {
    try {
      const data = await apiFetch<Record<string, string>>("/settings");
      setSettings({
        inactivity_days: data.inactivity_days || "30",
        warning_days: data.warning_days || "7",
        backup_auto_enabled: data.backup_auto_enabled || "false",
        backup_frequency: data.backup_frequency || "daily",
        backup_retention_count: data.backup_retention_count || "10",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBackups() {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.backup.list();
      if (result.success && result.backups) {
        setBackups(result.backups);
      }
    } catch (error) {
      console.error("Error loading backups:", error);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      if (window.electronAPI) {
        if (settings.backup_auto_enabled === "true") {
          await window.electronAPI.backup.scheduleAuto(
            settings.backup_frequency,
            parseInt(settings.backup_retention_count, 10)
          );
        } else {
          await window.electronAPI.backup.stopAuto();
        }
      }

      setMessage({ type: "success", text: "Configuración guardada exitosamente" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBackup() {
    if (!window.electronAPI) return;
    setBackupLoading(true);
    try {
      const result = await window.electronAPI.backup.create();
      if (result.success) {
        setMessage({ type: "success", text: "Backup creado exitosamente" });
        await loadBackups();
      } else {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      setMessage({ type: "error", text: "Error al crear backup" });
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleDeleteBackup(id: string) {
    if (!window.electronAPI) return;
    if (!confirm("¿Estás seguro de eliminar este backup?")) return;
    try {
      const result = await window.electronAPI.backup.delete(id);
      if (result.success) {
        setMessage({ type: "success", text: "Backup eliminado" });
        await loadBackups();
      } else {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
    }
  }

  async function handleRestoreBackup(id: string) {
    if (!window.electronAPI) return;
    if (!confirm("¿Restaurar este backup? La aplicación se reiniciará y los datos actuales serán reemplazados.")) return;
    try {
      const result = await window.electronAPI.backup.restore(id);
      if (result.success) {
        setMessage({ type: "success", text: "Backup restaurado. Reiniciando aplicación..." });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
    }
  }

  async function handleExportBackup(id: string) {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.backup.export(id);
      if (result.success) {
        setMessage({ type: "success", text: `Backup exportado a: ${result.path}` });
      } else if (!result.canceled) {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error exporting backup:", error);
    }
  }

  async function handleImportBackup() {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.backup.import();
      if (result.success) {
        setMessage({ type: "success", text: "Backup importado exitosamente" });
        await loadBackups();
      } else if (!result.canceled) {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error importing backup:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("es-PE");
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500 dark:text-zinc-400">Cargando...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Configuración
        </h1>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {message.type === "error" && <AlertCircle className="h-5 w-5" />}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                Configuración General
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Días de inactividad umbral
                </label>
                <input
                  type="number"
                  name="inactivity_days"
                  value={settings.inactivity_days}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Número de días sin actividad antes de marcar un cliente como inactivo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Días de aviso de membresía por vencer
                </label>
                <input
                  type="number"
                  name="warning_days"
                  value={settings.warning_days}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Número de días antes del vencimiento para mostrar aviso
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>
          </div>
        </form>

        {isElectron && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                    Backups
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleImportBackup}
                    className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <Upload className="h-4 w-4" />
                    Importar
                  </button>
                  <button
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {backupLoading ? "Creando..." : "Nuevo Backup"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Backup automático
                  </label>
                  <select
                    name="backup_auto_enabled"
                    value={settings.backup_auto_enabled}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="false">Desactivado</option>
                    <option value="true">Activado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Frecuencia
                  </label>
                  <select
                    name="backup_frequency"
                    value={settings.backup_frequency}
                    onChange={handleChange}
                    disabled={settings.backup_auto_enabled !== "true"}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cantidad de backups a mantener
                </label>
                <input
                  type="number"
                  name="backup_retention_count"
                  value={settings.backup_retention_count}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Los backups más antiguos se eliminarán automáticamente
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                Backups disponibles ({backups.length})
              </h3>
              {backups.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                  No hay backups disponibles
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-zinc-400" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {backup.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDate(backup.createdAt)} · {formatFileSize(backup.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRestoreBackup(backup.id)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="Restaurar"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExportBackup(backup.id)}
                          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          title="Exportar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
