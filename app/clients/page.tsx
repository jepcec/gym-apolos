"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  RefreshCw,
  Copy,
} from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import ClientDetailModal from "../components/ClientDetailModal";
import MembershipModal from "../components/MembershipModal";
import { apiFetch } from "../lib/api";
import { getMembershipStatus } from "../lib/membershipStatus";

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
    membership?: Client["memberships"][0];
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [warningDays, setWarningDays] = useState(7);

  useEffect(() => {
    loadClients();
    loadMembershipTypes();
  }, []);

  async function loadClients() {
    try {
      const [clientsData, settingsData] = await Promise.all([
        apiFetch<Client[]>("/clients"),
        apiFetch<Record<string, string>>("/settings"),
      ]);
      setClients(clientsData);
      setWarningDays(parseInt(settingsData.warning_days || "7", 10));
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  }

  async function loadMembershipTypes() {
    try {
      const data = await apiFetch<MembershipType[]>("/membership-types");
      setMembershipTypes(data);
    } catch (error) {
      console.error("Error loading membership types:", error);
    }
  }

  async function handleDeleteClient(id: number) {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      await apiFetch(`/clients/${id}`, { method: "DELETE" });
      setSelectedClient(null);
      loadClients();
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
      loadClients();
    } catch (error) {
      console.error("Error saving membership:", error);
      alert("Error al guardar membresía");
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.dni && client.dni.includes(searchQuery))
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Clientes
          </h1>
          <Link
            href="/clients/new/"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 pl-10 pr-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-zinc-200 dark:border-zinc-700 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Código
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    DNI
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Membresía
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const currentMembership = client.memberships[0];
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="border-b border-zinc-100 dark:border-zinc-700/50 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/20"
                    >
                      <td className="px-4 py-3 text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {client.code}
                          <Copy
                            className="h-3 w-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(client.code);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-white">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {client.dni || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {client.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {currentMembership ? (
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(currentMembership.endDate, warningDays).className}`}
                          >
                            {getMembershipStatus(currentMembership.endDate, warningDays).label}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                            Sin membresía
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {currentMembership ? (
                          <span className="text-zinc-900 dark:text-white">
                            {new Date(
                              currentMembership.endDate
                            ).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {!currentMembership ? (
                            <button
                              onClick={() =>
                                setMembershipModal({
                                  mode: "assign",
                                  clientId: client.id,
                                  clientName: client.name,
                                })
                              }
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              title="Asignar membresía"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          ) : getMembershipStatus(currentMembership.endDate, warningDays).label === "Vencida" || getMembershipStatus(currentMembership.endDate, warningDays).label === "Por vencer" ? (
                            <button
                              onClick={() =>
                                setMembershipModal({
                                  mode: "renew",
                                  clientId: client.id,
                                  clientName: client.name,
                                  membership: currentMembership,
                                })
                              }
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              title="Renovar membresía"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            onClick={() =>
                              setSelectedClient(client)
                            }
                            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            title="Ver detalles"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No se encontraron clientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
              membership,
            });
          }}
          onRefresh={loadClients}
        />
      )}

      {membershipModal && (
        <MembershipModal
          mode={membershipModal.mode}
          clientId={membershipModal.clientId}
          clientName={membershipModal.clientName}
          membership={membershipModal.membership}
          membershipTypes={membershipTypes}
          onClose={() => setMembershipModal(null)}
          onSave={handleSaveMembership}
        />
      )}
    </SidebarLayout>
  );
}
