"use client";

import { Download, Users, CreditCard, ClipboardCheck, DollarSign } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";

export default function ReportsPage() {
  const reports = [
    {
      type: "clients",
      title: "Clientes",
      description: "Todos los clientes registrados, con contacto y estado.",
      icon: Users,
    },
    {
      type: "memberships",
      title: "Membresías",
      description: "Cada membresía con cliente, plan, fechas y precio.",
      icon: CreditCard,
    },
    {
      type: "checkins",
      title: "Check-ins",
      description: "Registro de asistencia con fecha y hora de ingreso.",
      icon: ClipboardCheck,
    },
    {
      type: "payments",
      title: "Pagos",
      description: "Historial de pagos con método, fecha y monto.",
      icon: DollarSign,
    },
  ];

  const handleDownload = (type: string) => {
    window.open(`/api/reports/${type}`, "_blank");
  };

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <h1 className="page-title">Reportes</h1>

        <div className="card grid grid-cols-1 divide-y divide-[var(--line-soft)] md:grid-cols-2 md:divide-y-0">
          {reports.map((report, i) => {
            const Icon = report.icon;
            return (
              <button
                key={report.type}
                onClick={() => handleDownload(report.type)}
                className={`group flex items-start gap-4 p-6 text-left transition-colors hover:bg-[var(--line-soft)]/50 ${
                  i % 2 === 1 ? "md:border-l md:border-[var(--line-soft)]" : ""
                } ${i >= 2 ? "md:border-t md:border-[var(--line-soft)]" : ""}`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--line)]">
                  <Icon className="h-5 w-5 text-muted group-hover:text-ink" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium text-ink">{report.title}</h2>
                    <Download className="h-4 w-4 text-muted transition-colors group-hover:text-ember" />
                  </div>
                  <p className="mt-1 text-sm text-muted">{report.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted">
          Los reportes se descargan como archivo CSV, listo para Excel o Google
          Sheets.
        </p>
      </div>
    </SidebarLayout>
  );
}
