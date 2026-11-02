"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Copy } from "lucide-react";
import SidebarLayout from "./components/SidebarLayout";
import ClientDetailModal from "./components/ClientDetailModal";
import MembershipModal from "./components/MembershipModal";
import ConfirmDialog from "./components/ConfirmDialog";
import ToastStack, { useToasts } from "./components/Toast";
import { ClientFormValues } from "./components/ClientForm";
import { apiFetch } from "./lib/api";
import { getMembershipStatus } from "./lib/membershipStatus";

interface DashboardStats {
  activeClients: number;
  expiringMemberships: number;
  todayCheckins: number;
  monthlyIncome: number;
  newClientsThisMonth: number;
}

interface Client {
  id: number;
  name: string;
  dni: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  address: string | null;
  status: string;
  lastCheckin: string | null;
  createdAt: string;
  memberships: Array<{
    id: number;
    startDate: string;
    endDate: string;
    status: string;
    price: number;
    type: {
      id: number;
      name: string;
      durationDays: number;
      price: number;
    } | null;
  }>;
  checkins: Array<{ id: number; checkinDate: string }>;
}

interface MembershipType {
  id: number;
  name: string;
  durationDays: number;
  price: number;
}

type MembersByStatus = {
  expiring_soon: Client[];
  expired: Client[];
  active: Client[];
  no_membership: Client[];
};

type TabType = "expiring_soon" | "expired" | "active" | "no_membership" | "ingresos";

interface MonthlyIncome {
  month: string;
  year: number;
  total: number;
  count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [membersByStatus, setMembersByStatus] = useState<MembersByStatus | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabType>("expiring_soon");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [warningDays, setWarningDays] = useState(7);
  const [monthlyIncomeData, setMonthlyIncomeData] = useState<MonthlyIncome[]>([]);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, membersRes, typesRes, settingsRes, incomeRes] =
        await Promise.all([
          apiFetch<DashboardStats>("/dashboard"),
          apiFetch<MembersByStatus>("/dashboard/members-by-status"),
          apiFetch<MembershipType[]>("/membership-types"),
          apiFetch<Record<string, string>>("/settings"),
          apiFetch<MonthlyIncome[]>("/dashboard/monthly-income"),
        ]);
      setStats(statsRes);
      setMembersByStatus(membersRes);
      setMembershipTypes(typesRes);
      setWarningDays(parseInt(settingsRes.warning_days || "7", 10));
      setMonthlyIncomeData(incomeRes);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      push("error", "No se pudo cargar el panel. Recarga la página.");
    }
  }

  async function confirmDeleteClient() {
    if (!pendingDelete) return;
    try {
      await apiFetch(`/clients/${pendingDelete.id}`, { method: "DELETE" });
      push("success", `${pendingDelete.name} fue eliminado`);
      setPendingDelete(null);
      setSelectedClient(null);
      loadData();
    } catch {
      push("error", "No se pudo eliminar al cliente. Intenta de nuevo.");
    }
  }

  async function handleEditClient(
    id: number,
    values: ClientFormValues
  ): Promise<string | null> {
    try {
      const updated = await apiFetch<Partial<Client>>(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setMembersByStatus((mbs) =>
        mbs
          ? {
              ...mbs,
              ...Object.fromEntries(
                Object.entries(mbs).map(([k, list]) => [
                  k,
                  (list as Client[]).map((c) =>
                    c.id === id ? { ...c, ...updated } : c
                  ),
                ])
              ),
            }
          : mbs
      );
      setSelectedClient((c) => (c && c.id === id ? { ...c, ...updated } : c));
      push("success", "Datos actualizados");
      return null;
    } catch (error) {
      console.error("Error updating client:", error);
      return error instanceof Error
        ? error.message
        : "No se pudo guardar. Intenta de nuevo.";
    }
  }

  async function handleSaveMembership(data: {
    clientId: number;
    typeId?: number;
    startDate: string;
    durationDays?: number;
    price: number;
  }) {
    try {
      await apiFetch("/memberships", {
        method: "POST",
        body: JSON.stringify(data),
      });
      push("success", "Membresía guardada");
      setMembershipModal(null);
      setSelectedClient(null);
      loadData();
    } catch {
      push("error", "No se pudo guardar la membresía. Intenta de nuevo.");
    }
  }

  const currentClients =
    activeTab !== "ingresos" ? membersByStatus?.[activeTab] || [] : [];
  const filteredClients = currentClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.dni.includes(searchQuery)
  );

  const totalIncome = monthlyIncomeData.reduce((sum, m) => sum + m.total, 0);
  const totalPayments = monthlyIncomeData.reduce((sum, m) => sum + m.count, 0);

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "expiring_soon",
      label: "Por vencer",
      count: membersByStatus?.expiring_soon.length || 0,
    },
    {
      key: "expired",
      label: "Vencidas",
      count: membersByStatus?.expired.length || 0,
    },
    {
      key: "active",
      label: "Activas",
      count: membersByStatus?.active.length || 0,
    },
    {
      key: "no_membership",
      label: "Sin membresía",
      count: membersByStatus?.no_membership.length || 0,
    },
    { key: "ingresos", label: "Ingresos", count: totalPayments },
  ];

  const statCells = stats
    ? [
        { label: "Clientes activos", value: String(stats.activeClients) },
        {
          label: "Por vencer",
          value: String(stats.expiringMemberships),
          highlight: true,
        },
        { label: "Ingresos hoy", value: String(stats.todayCheckins) },
        { label: "Mes en S/", value: stats.monthlyIncome.toFixed(2) },
        { label: "Nuevos este mes", value: String(stats.newClientsThisMonth) },
      ]
    : [];

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="page-title">Dashboard</h1>
          <Link href="/clients/new/" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </div>

        {/* Franja de métricas */}
        <div className="card grid grid-cols-2 divide-y divide-[var(--line-soft)] sm:grid-cols-3 md:grid-cols-5 md:divide-x md:divide-y-0">
          {stats
            ? statCells.map((cell) => (
                <div key={cell.label} className="px-5 py-4">
                  <p className="mb-1.5 text-xs text-muted">{cell.label}</p>
                  <p className="num text-3xl">
                    {cell.value}
                    {cell.highlight && stats.expiringMemberships > 0 && (
                      <span
                        className="ml-2 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: "var(--st-warn-fg)" }}
                        aria-hidden="true"
                      />
                    )}
                  </p>
                </div>
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="mb-2 h-3 w-20 animate-pulse rounded bg-[var(--line-soft)]" />
                  <div className="h-7 w-14 animate-pulse rounded bg-[var(--line-soft)]" />
                </div>
              ))}
        </div>

        {stats && stats.expiringMemberships > 0 && (
          <p className="text-sm text-muted">
            <span
              className="font-medium"
              style={{ color: "var(--st-warn-fg)" }}
            >
              {stats.expiringMemberships} membresía
              {stats.expiringMemberships === 1 ? "" : "s"}
            </span>{" "}
            vencen en {warningDays} días o menos. Atiéndelas en la cola de
            abajo.
          </p>
        )}

        {/* Cola / tabs */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-1 border-b border-[var(--line-soft)] px-3 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-selected={activeTab === tab.key}
                role="tab"
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  activeTab === tab.key
                    ? "bg-[var(--line-soft)] font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 font-mono text-xs opacity-70">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "ingresos" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line-soft)] text-left">
                      <th className="pb-2.5 font-medium text-muted">Mes</th>
                      <th className="pb-2.5 text-right font-medium text-muted">
                        Pagos
                      </th>
                      <th className="pb-2.5 text-right font-medium text-muted">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[13px]">
                    {monthlyIncomeData.map((item) => (
                      <tr
                        key={`${item.year}-${item.month}`}
                        className="border-b border-[var(--line-soft)]"
                      >
                        <td className="py-2.5 font-sans text-ink">
                          {item.month} {item.year}
                        </td>
                        <td className="py-2.5 text-right text-muted">
                          {item.count}
                        </td>
                        <td className="py-2.5 text-right text-ink">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {monthlyIncomeData.length > 0 && (
                      <tr className="font-semibold">
                        <td className="pt-3 text-ink">Total</td>
                        <td className="pt-3 text-right text-muted">
                          {totalPayments}
                        </td>
                        <td className="pt-3 text-right text-ink">
                          {totalIncome.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {monthlyIncomeData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center font-sans text-muted">
                          Aún no hay pagos registrados este periodo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input mb-4"
                />

                {!membersByStatus ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-md bg-[var(--line-soft)]"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--line-soft)] text-left">
                          <th className="pb-2.5 font-medium text-muted">
                            DNI
                          </th>
                          <th className="pb-2.5 font-medium text-muted">
                            Nombre
                          </th>
                          <th className="pb-2.5 font-medium text-muted">
                            Teléfono
                          </th>
                          <th className="pb-2.5 font-medium text-muted">Plan</th>
                          <th className="pb-2.5 font-medium text-muted">
                            Vencimiento
                          </th>
                          <th className="pb-2.5 text-right font-medium text-muted">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((client) => {
                          const activeMembership = client.memberships[0];
                          const st = activeMembership
                            ? getMembershipStatus(
                                activeMembership.endDate,
                                warningDays
                              )
                            : null;
                          const needsAttention =
                            st && st.key !== "active";
                          return (
                            <tr
                              key={client.id}
                              onClick={() => setSelectedClient(client)}
                              className="cursor-pointer border-b border-[var(--line-soft)] hover:bg-[var(--line-soft)]/60"
                            >
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="code-chip">
                                    {client.dni}
                                  </span>
                                  <button
                                    aria-label={`Copiar DNI ${client.dni}`}
                                    className="btn-ghost rounded p-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(client.dni);
                                      push("success", `DNI ${client.dni} copiado`);
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 text-ink">{client.name}</td>
                              <td className="py-2.5 text-muted">
                                {client.phone || "—"}
                              </td>
                              <td className="py-2.5 text-ink">
                                {activeMembership
                                  ? activeMembership.type?.name || "Personalizado"
                                  : "—"}
                              </td>
                              <td className="py-2.5">
                                {activeMembership && st ? (
                                  <span className={st.className}>
                                    {new Date(
                                      activeMembership.endDate
                                    ).toLocaleDateString("es-PE")}
                                  </span>
                                ) : (
                                  <span className="plate plate-none">
                                    Sin fecha
                                  </span>
                                )}
                              </td>
                              <td
                                className="py-2.5 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {needsAttention ? (
                                  <button
                                    onClick={() =>
                                      setMembershipModal({
                                        mode: "renew",
                                        clientId: client.id,
                                        clientName: client.name,
                                      })
                                    }
                                    className="btn btn-outline !py-1 !text-xs"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Renovar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedClient(client)}
                                    className="btn btn-ghost !py-1 !text-xs"
                                  >
                                    Ver ficha
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredClients.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-muted">
                              {searchQuery
                                ? `Nada coincide con “${searchQuery}”.`
                                : activeTab === "expiring_soon"
                                  ? "Nada por vencer. La semana está tranquila."
                                  : activeTab === "no_membership"
                                    ? "Todos los clientes tienen membresía."
                                    : "Nadie en esta categoría."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          membershipTypes={membershipTypes}
          warningDays={warningDays}
          onClose={() => setSelectedClient(null)}
          onDelete={(id) => {
            const target = membersByStatus
              ? (Object.values(membersByStatus) as Client[][])
                  .flat()
                  .find((c) => c.id === id) || null
              : null;
            setPendingDelete(target);
          }}
          onAssignMembership={(clientId) => {
            setMembershipModal({
              mode: "assign",
              clientId,
              clientName: selectedClient.name,
            });
          }}
          onSaveEdit={handleEditClient}
          onRenewMembership={(clientId) => {
            setMembershipModal({
              mode: "renew",
              clientId,
              clientName: selectedClient.name,
            });
          }}
          onRefresh={loadData}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar cliente"
          message={`Se eliminará a ${pendingDelete.name} (DNI ${pendingDelete.dni}) junto con sus membresías, pagos e ingresos. Esta acción no se puede deshacer.`}
          onConfirm={confirmDeleteClient}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {membershipModal && (
        <MembershipModal
          mode={membershipModal.mode}
          clientId={membershipModal.clientId}
          clientName={membershipModal.clientName}
          membershipTypes={membershipTypes}
          onClose={() => setMembershipModal(null)}
          onSave={handleSaveMembership}
        />
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </SidebarLayout>
  );
}
