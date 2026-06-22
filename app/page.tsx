"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  ClipboardCheck,
  DollarSign,
  UserPlus,
  Copy,
  Plus,
} from "lucide-react";
import SidebarLayout from "./components/SidebarLayout";
import ClientDetailModal from "./components/ClientDetailModal";
import MembershipModal from "./components/MembershipModal";
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
  code: string;
  name: string;
  dni: string | null;
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
    type: { id: number; name: string; durationDays: number; price: number } | null;
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
  const [membersByStatus, setMembersByStatus] = useState<MembersByStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("expiring_soon");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [warningDays, setWarningDays] = useState(7);
  const [monthlyIncomeData, setMonthlyIncomeData] = useState<MonthlyIncome[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, membersRes, typesRes, settingsRes, incomeRes] = await Promise.all([
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
    }
  }

  async function handleDeleteClient(id: number) {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      await apiFetch(`/clients/${id}`, { method: "DELETE" });
      setSelectedClient(null);
      loadData();
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error al eliminar cliente");
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
      setMembershipModal(null);
      setSelectedClient(null);
      loadData();
    } catch (error) {
      console.error("Error saving membership:", error);
      alert("Error al guardar membresía");
    }
  }

  const currentClients = activeTab !== "ingresos" ? (membersByStatus?.[activeTab] || []) : [];
  const filteredClients = currentClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.dni && client.dni.includes(searchQuery))
  );

  const totalIncome = monthlyIncomeData.reduce((sum, m) => sum + m.total, 0);
  const totalPayments = monthlyIncomeData.reduce((sum, m) => sum + m.count, 0);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "expiring_soon", label: "Por vencer", count: membersByStatus?.expiring_soon.length || 0 },
    { key: "expired", label: "Vencidas", count: membersByStatus?.expired.length || 0 },
    { key: "active", label: "Activas", count: membersByStatus?.active.length || 0 },
    { key: "no_membership", label: "Sin membresía", count: membersByStatus?.no_membership.length || 0 },
    { key: "ingresos", label: "Ingresos", count: totalPayments },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Dashboard
          </h1>
          <Link
            href="/clients/new/"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Clientes Activos
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {stats?.activeClients ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Por Vencer
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {stats?.expiringMemberships ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <ClipboardCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Check-ins Hoy
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {stats?.todayCheckins ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Ingresos del Mes
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  S/ {stats?.monthlyIncome?.toFixed(2) ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Nuevos Este Mes
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {stats?.newClientsThisMonth ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-700 px-4 pt-4">
            <div className="flex items-center gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {activeTab === "ingresos" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                      <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Mes
                      </th>
                      <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Pagos
                      </th>
                      <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyIncomeData.map((item) => (
                      <tr
                        key={`${item.year}-${item.month}`}
                        className="border-b border-zinc-100 dark:border-zinc-700/50"
                      >
                        <td className="py-3 text-zinc-900 dark:text-white">
                          {item.month} {item.year}
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400">
                          {item.count}
                        </td>
                        <td className="py-3 text-zinc-900 dark:text-white">
                          S/ {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {monthlyIncomeData.length > 0 && (
                      <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 font-semibold">
                        <td className="py-3 text-zinc-900 dark:text-white">
                          Total
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400">
                          {totalPayments}
                        </td>
                        <td className="py-3 text-zinc-900 dark:text-white">
                          S/ {totalIncome.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {monthlyIncomeData.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          No hay ingresos registrados
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
                  placeholder="Buscar por nombre, código o DNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                        <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                          Código
                        </th>
                        <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                          Nombre
                        </th>
                        <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                          Teléfono
                        </th>
                        <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                          Tipo
                        </th>
                        <th className="pb-3 font-medium text-zinc-500 dark:text-zinc-400">
                          Vencimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => {
                        const activeMembership = client.memberships[0];
                        return (
                          <tr
                            key={client.id}
                            className="border-b border-zinc-100 dark:border-zinc-700/50"
                          >
                            <td className="py-3 text-zinc-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                {client.code}
                                <Copy
                                  className="h-3 w-3 text-zinc-400 hover:text-zinc-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(client.code);
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-3 text-zinc-900 dark:text-white">
                              {client.name}
                            </td>
                            <td className="py-3 text-zinc-500 dark:text-zinc-400">
                              {client.phone || "-"}
                            </td>
                            <td className="py-3">
                              {activeMembership ? (
                                <span className="text-zinc-900 dark:text-white">
                                  {activeMembership.type?.name || "Custom"}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              {activeMembership ? (
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(activeMembership.endDate, warningDays).className}`}
                                >
                                  {new Date(
                                    activeMembership.endDate
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredClients.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                          >
                            No hay clientes en esta categoría
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
          onDelete={handleDeleteClient}
          onAssignMembership={(clientId) => {
            setMembershipModal({
              mode: "assign",
              clientId,
              clientName: selectedClient.name,
            });
          }}
          onRenewMembership={(clientId) => {
            const membership = selectedClient.memberships.find(
              (m) => m.status === "active"
            );
            setMembershipModal({
              mode: "renew",
              clientId,
              clientName: selectedClient.name,
            });
          }}
          onRefresh={loadData}
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
    </SidebarLayout>
  );
}
