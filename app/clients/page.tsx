"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Trash2, CreditCard, RefreshCw, Copy } from "lucide-react";
import { ClientFormValues } from "../components/ClientForm";
import SidebarLayout from "../components/SidebarLayout";
import ClientDetailModal from "../components/ClientDetailModal";
import MembershipModal from "../components/MembershipModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastStack, { useToasts } from "../components/Toast";
import { apiFetch } from "../lib/api";
import { getMembershipStatus } from "../lib/membershipStatus";

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
    membership?: Client["memberships"][0];
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [warningDays, setWarningDays] = useState(7);
  const { toasts, push, dismiss } = useToasts();

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
      push("error", "No se pudo cargar la lista de clientes.");
    } finally {
      setLoading(false);
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

  async function confirmDeleteClient() {
    if (!pendingDelete) return;
    try {
      await apiFetch(`/clients/${pendingDelete.id}`, { method: "DELETE" });
      push("success", `${pendingDelete.name} fue eliminado`);
      setPendingDelete(null);
      setSelectedClient(null);
      loadClients();
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
      setClients((list) =>
        list.map((c) => (c.id === id ? { ...c, ...updated } : c))
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
      loadClients();
    } catch {
      push("error", "No se pudo guardar la membresía. Intenta de nuevo.");
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.dni.includes(searchQuery)
  );

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Clientes</h1>
          <Link href="/clients/new/" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </div>

        <div className="card">
          <div className="p-4 pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left">
                  <th className="px-4 py-3 font-medium text-muted">DNI</th>
                  <th className="px-4 py-3 font-medium text-muted">Nombre</th>
                  <th className="px-4 py-3 font-medium text-muted">Teléfono</th>
                  <th className="px-4 py-3 font-medium text-muted">Membresía</th>
                  <th className="px-4 py-3 font-medium text-muted">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-2">
                        <div className="h-8 animate-pulse rounded bg-[var(--line-soft)]" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  filteredClients.map((client) => {
                    const currentMembership = client.memberships[0];
                    const st = currentMembership
                      ? getMembershipStatus(
                          currentMembership.endDate,
                          warningDays
                        )
                      : null;
                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="cursor-pointer border-b border-[var(--line-soft)] hover:bg-[var(--line-soft)]/60"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="code-chip">{client.dni}</span>
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
                        <td className="px-4 py-2.5 text-ink">{client.name}</td>
                        <td className="px-4 py-2.5 text-muted">
                          {client.phone || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {st ? (
                            <span className={st.className}>{st.label}</span>
                          ) : (
                            <span className="plate plate-none">
                              Sin membresía
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-ink">
                          {currentMembership
                            ? new Date(
                                currentMembership.endDate
                              ).toLocaleDateString("es-PE")
                            : "—"}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {st && st.key !== "active" ? (
                              <button
                                title="Renovar membresía"
                                onClick={() =>
                                  setMembershipModal({
                                    mode: "renew",
                                    clientId: client.id,
                                    clientName: client.name,
                                    membership: currentMembership,
                                  })
                                }
                                className="btn btn-outline !px-2 !py-1 !text-xs"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Renovar
                              </button>
                            ) : !currentMembership ? (
                              <button
                                title="Asignar membresía"
                                onClick={() =>
                                  setMembershipModal({
                                    mode: "assign",
                                    clientId: client.id,
                                    clientName: client.name,
                                  })
                                }
                                className="btn btn-outline !px-2 !py-1 !text-xs"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Asignar
                              </button>
                            ) : null}
                            <button
                              title="Eliminar cliente"
                              aria-label={`Eliminar a ${client.name}`}
                              onClick={() => setPendingDelete(client)}
                              className="btn btn-danger rounded p-1.5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {!loading && filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      {clients.length === 0 ? (
                        <>
                          Aún no hay clientes registrados.{" "}
                          <Link
                            href="/clients/new/"
                            className="font-medium text-ember underline underline-offset-2"
                          >
                            Registra al primero
                          </Link>
                        </>
                      ) : (
                        <>Nada coincide con “{searchQuery}”.</>
                      )}
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
          onDelete={() => setPendingDelete(selectedClient)}
          onAssignMembership={(clientId) => {
            setMembershipModal({
              mode: "assign",
              clientId,
              clientName: selectedClient.name,
            });
          }}
          onSaveEdit={handleEditClient}
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
          membership={membershipModal.membership}
          membershipTypes={membershipTypes}
          onClose={() => setMembershipModal(null)}
          onSave={handleSaveMembership}
        />
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </SidebarLayout>
  );
}
