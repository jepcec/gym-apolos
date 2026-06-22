"use client";

import { Download, Users, CreditCard, ClipboardCheck, DollarSign } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";

export default function ReportsPage() {
  const reports = [
    {
      type: "clients",
      title: "Clientes",
      description: "Descarga un archivo CSV con todos los clientes registrados",
      icon: Users,
      color: "blue",
    },
    {
      type: "memberships",
      title: "Membresías",
      description: "Descarga un archivo CSV con todas las membresías registradas",
      icon: CreditCard,
      color: "green",
    },
    {
      type: "checkins",
      title: "Check-ins",
      description: "Descarga un archivo CSV con todos los registros de asistencia",
      icon: ClipboardCheck,
      color: "amber",
    },
    {
      type: "payments",
      title: "Pagos",
      description: "Descarga un archivo CSV con todos los pagos registrados",
      icon: DollarSign,
      color: "purple",
    },
  ];

  const handleDownload = (type: string) => {
    window.open(`/api/reports/${type}`, "_blank");
  };

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-green-100 dark:bg-green-900/30", icon: "text-green-600 dark:text-green-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-900/30", icon: "text-amber-600 dark:text-amber-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400" },
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Reportes
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;
            const colors = colorClasses[report.color];

            return (
              <button
                key={report.type}
                onClick={() => handleDownload(report.type)}
                className="group text-left rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                        {report.title}
                      </h2>
                      <Download
                        className={`h-5 w-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors ${colors.icon}`}
                      />
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {report.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Los reportes se descargan como archivos CSV. Puedes abrirlos en Excel o Google Sheets para un mejor análisis.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
