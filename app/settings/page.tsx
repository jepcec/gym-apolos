"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import { apiFetch } from "../lib/api";

interface Settings {
  inactivity_days: string;
  warning_days: string;
  data_dir: string;
  backup_dir: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    inactivity_days: "30",
    warning_days: "7",
    data_dir: "",
    backup_dir: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await apiFetch<Record<string, string>>("/settings");
      setSettings({
        inactivity_days: data.inactivity_days || "30",
        warning_days: data.warning_days || "7",
        data_dir: data.data_dir || "",
        backup_dir: data.backup_dir || "",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
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
      setMessage({ type: "success", text: "Configuración guardada exitosamente" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

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
      </div>
    </SidebarLayout>
  );
}
