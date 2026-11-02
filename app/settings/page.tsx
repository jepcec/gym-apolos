"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Plus,
  Shield,
} from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import ConfirmDialog from "../components/ConfirmDialog";
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

type PendingAction =
  | { kind: "delete"; backup: Backup }
  | { kind: "restore"; backup: Backup }
  | null;

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
  const [pending, setPending] = useState<PendingAction>(null);

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

      setMessage({ type: "success", text: "Configuración guardada" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "No se pudo guardar la configuración. Intenta de nuevo." });
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
        setMessage({ type: "success", text: "Backup creado" });
        await loadBackups();
      } else {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      setMessage({ type: "error", text: "No se pudo crear el backup." });
    } finally {
      setBackupLoading(false);
    }
  }

  async function runPendingAction() {
    if (!pending || !window.electronAPI) return;
    const { kind, backup } = pending;
    try {
      const result =
        kind === "delete"
          ? await window.electronAPI.backup.delete(backup.id)
          : await window.electronAPI.backup.restore(backup.id);

      if (result.success) {
        if (kind === "delete") {
          setMessage({ type: "success", text: "Backup eliminado" });
          await loadBackups();
        } else {
          setMessage({ type: "success", text: "Backup restaurado. Reiniciando la aplicación…" });
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        setMessage({ type: "error", text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("Backup action failed:", error);
      setMessage({ type: "error", text: "La operación de backup falló." });
    } finally {
      setPending(null);
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
        setMessage({ type: "success", text: "Backup importado" });
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

  const latestBackup = backups.length
    ? [...backups].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--line-soft)]" />
          <div className="h-64 animate-pulse rounded-xl bg-[var(--line-soft)]" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-2xl space-y-5">
        <h1 className="page-title">Configuración</h1>

        {message && (
          <div
            className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm"
            style={{
              background:
                message.type === "success"
                  ? "var(--st-active-bg)"
                  : "var(--st-exp-bg)",
              color:
                message.type === "success"
                  ? "var(--st-active-fg)"
                  : "var(--st-exp-fg)",
            }}
            role="status"
          >
            <p>{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              aria-label="Cerrar aviso"
              className="font-medium opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="card">
            <div className="border-b border-[var(--line-soft)] px-6 py-4">
              <h2 className="text-base font-semibold text-ink">
                Configuración general
              </h2>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Días de inactividad
                </label>
                <input
                  type="number"
                  name="inactivity_days"
                  value={settings.inactivity_days}
                  onChange={handleChange}
                  min="1"
                  className="input max-w-40 font-mono"
                />
                <p className="mt-1 text-xs text-muted">
                  Cuántos días sin visitar el gimnasio antes de marcar a un
                  cliente como inactivo.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Días de aviso por vencer
                </label>
                <input
                  type="number"
                  name="warning_days"
                  value={settings.warning_days}
                  onChange={handleChange}
                  min="1"
                  className="input max-w-40 font-mono"
                />
                <p className="mt-1 text-xs text-muted">
                  Con cuánta anticipación la app marca una membresía como «por
                  vencer» y la pone en tu cola del dashboard.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[var(--line-soft)] px-6 py-4">
              <button type="submit" disabled={saving} className="btn btn-primary">
                <Save className="h-4 w-4" />
                {saving ? "Guardando…" : "Guardar configuración"}
              </button>
            </div>
          </div>
        </form>

        {isElectron && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted" />
                <h2 className="text-base font-semibold text-ink">Backups</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImportBackup}
                  className="btn btn-outline !py-1.5"
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                  className="btn btn-primary !py-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {backupLoading ? "Creando…" : "Nuevo backup"}
                </button>
              </div>
            </div>

            {/* Estado del respaldo: el dato vive solo en este computador */}
            <div className="border-b border-[var(--line-soft)] px-6 py-4">
              <p className="text-sm text-muted">
                Último respaldo:{" "}
                {latestBackup ? (
                  <span className="font-medium text-ink">
                    {formatDate(latestBackup.createdAt)}
                  </span>
                ) : (
                  <span style={{ color: "var(--st-warn-fg)" }}>
                    ninguno. Tus datos viven solo en este computador: crea tu
                    primer respaldo ahora.
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Backup automático
                  </label>
                  <select
                    name="backup_auto_enabled"
                    value={settings.backup_auto_enabled}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="false">Desactivado</option>
                    <option value="true">Activado</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Frecuencia
                  </label>
                  <select
                    name="backup_frequency"
                    value={settings.backup_frequency}
                    onChange={handleChange}
                    disabled={settings.backup_auto_enabled !== "true"}
                    className="input disabled:opacity-50"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Backups a mantener
                </label>
                <input
                  type="number"
                  name="backup_retention_count"
                  value={settings.backup_retention_count}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="input max-w-40 font-mono"
                />
                <p className="mt-1 text-xs text-muted">
                  Los más antiguos se eliminan automáticamente.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--line-soft)] px-6 py-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Respaldos guardados ({backups.length})
              </h3>
              {backups.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  Aún no hay respaldos guardados en este equipo.
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Database className="h-5 w-5 flex-shrink-0 text-muted" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {backup.name}
                          </p>
                          <p className="font-mono text-xs text-muted">
                            {formatDate(backup.createdAt)} ·{" "}
                            {formatFileSize(backup.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPending({ kind: "restore", backup })}
                          aria-label={`Restaurar ${backup.name}`}
                          className="btn btn-ghost rounded !p-2"
                          title="Restaurar"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExportBackup(backup.id)}
                          aria-label={`Exportar ${backup.name}`}
                          className="btn btn-ghost rounded !p-2"
                          title="Exportar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPending({ kind: "delete", backup })}
                          aria-label={`Eliminar ${backup.name}`}
                          className="btn btn-danger rounded !p-2"
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

      {pending && (
        <ConfirmDialog
          title={pending.kind === "restore" ? "Restaurar backup" : "Eliminar backup"}
          confirmLabel={pending.kind === "restore" ? "Restaurar" : "Eliminar"}
          message={
            pending.kind === "restore"
              ? `Se restaurará “${pending.backup.name}” (${formatDate(pending.backup.createdAt)}). La aplicación se reiniciará y los datos actuales serán reemplazados por los de ese respaldo.`
              : `Se eliminará el respaldo “${pending.backup.name}” de este computador.`
          }
          onConfirm={runPendingAction}
          onCancel={() => setPending(null)}
        />
      )}
    </SidebarLayout>
  );
}
