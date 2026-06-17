"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import MembershipTypeModal from "../components/MembershipTypeModal";
import MembershipModal from "../components/MembershipModal";
import { apiFetch } from "../lib/api";

interface MembershipType {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  description: string | null;
}

interface Client {
  id: number;
  code: string;
  name: string;
}

interface Membership {
  id: number;
  clientId: number;
  typeId: number;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  client: Client;
  type: MembershipType | null;
}

function getMembershipStatus(endDate: string): {
  label: string;
  className: string;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return { label: "Vencida", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  } else if (diff <= 7) {
    return { label: "Por vencer", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }
  return { label: "Activa", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

export default function MembershipsPage() {
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [newMembership, setNewMembership] = useState({
    clientId: "",
    typeId: "",
    startDate: new Date().toISOString().split("T")[0],
    price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [typesRes, membershipsRes, clientsRes] = await Promise.all([
        apiFetch<MembershipType[]>("/membership-types"),
        apiFetch<Membership[]>("/memberships"),
        apiFetch<Client[]>("/clients"),
      ]);
      setMembershipTypes(typesRes);
      setMemberships(membershipsRes);
      setClients(clientsRes);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function handleSaveType(data: Omit<MembershipType, "id">) {
    try {
      if (editingTypeId) {
        await apiFetch(`/membership-types/${editingTypeId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch("/membership-types", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      setShowTypeModal(false);
      setEditingTypeId(null);
      loadData();
    } catch (error) {
      console.error("Error saving membership type:", error);
      alert("Error al guardar tipo de membresía");
    }
  }

  async function handleDeleteType(id: number) {
    if (!confirm("¿Estás seguro de eliminar este tipo de membresía?")) return;
    try {
      await apiFetch(`/membership-types/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting membership type:", error);
      alert("Error al eliminar tipo de membresía");
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
      setShowMembershipModal(false);
      setSelectedClient(null);
      setNewMembership({
        clientId: "",
        typeId: "",
        startDate: new Date().toISOString().split("T")[0],
        price: 0,
      });
      loadData();
    } catch (error) {
      console.error("Error saving membership:", error);
      alert("Error al guardar membresía");
    }
  }

  const handleClientChange = (clientId: string) => {
    setNewMembership((prev) => ({
      ...prev,
      clientId,
      typeId: "",
      price: 0,
    }));
  };

  const handleTypeChange = (typeId: string) => {
    const type = membershipTypes.find((t) => t.id === parseInt(typeId));
    setNewMembership((prev) => ({
      ...prev,
      typeId,
      price: type?.price || 0,
    }));
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMembership.clientId || !newMembership.typeId) {
      alert("Selecciona un cliente y un plan");
      return;
    }

    const type = membershipTypes.find((t) => t.id === parseInt(newMembership.typeId));
    const startDate = new Date(newMembership.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (type?.durationDays || 0));

    try {
      await apiFetch("/memberships", {
        method: "POST",
        body: JSON.stringify({
          clientId: parseInt(newMembership.clientId),
          typeId: parseInt(newMembership.typeId),
          startDate: newMembership.startDate,
          price: newMembership.price,
        }),
      });
      setNewMembership({
        clientId: "",
        typeId: "",
        startDate: new Date().toISOString().split("T")[0],
        price: 0,
      });
      loadData();
    } catch (error) {
      console.error("Error creating membership:", error);
      alert("Error al crear membresía");
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Membresías
          </h1>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                Tipos de Membresía
              </h2>
              <button
                onClick={() => {
                  setEditingTypeId(null);
                  setShowTypeModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nuevo Plan
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {membershipTypes.map((type) => (
                <div
                  key={type.id}
                  className="group relative rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:border-blue-300 dark:hover:border-blue-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        {type.name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {type.durationDays} días
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      ${type.price}
                    </span>
                  </div>
                  {type.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {type.description}
                    </p>
                  )}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTypeId(type.id);
                        setShowTypeModal(true);
                      }}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(type.id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
              Registrar Membresía
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleInlineSubmit} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cliente
                </label>
                <select
                  value={newMembership.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.code} - {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Plan
                </label>
                <select
                  value={newMembership.typeId}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  required
                  disabled={!newMembership.clientId}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Seleccionar plan</option>
                  {membershipTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - ${type.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-[180px]">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={newMembership.startDate}
                  onChange={(e) =>
                    setNewMembership((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="w-[120px]">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  value={newMembership.price}
                  onChange={(e) =>
                    setNewMembership((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                  }
                  required
                  step="0.01"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4" />
                Registrar
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
              Membresías Registradas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Cliente
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Plan
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Inicio
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Fin
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Estado
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/20"
                  >
                    <td className="px-6 py-3 text-zinc-900 dark:text-white">
                      {membership.client.code} - {membership.client.name}
                    </td>
                    <td className="px-6 py-3 text-zinc-900 dark:text-white">
                      {membership.type?.name || "Custom"}
                    </td>
                    <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400">
                      {new Date(membership.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400">
                      {new Date(membership.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(membership.endDate).className}`}
                      >
                        {getMembershipStatus(membership.endDate).label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-900 dark:text-white">
                      ${membership.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {memberships.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No hay membresías registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTypeModal && (
        <MembershipTypeModal
          typeId={editingTypeId}
          onClose={() => {
            setShowTypeModal(false);
            setEditingTypeId(null);
          }}
          onSave={handleSaveType}
        />
      )}

      {showMembershipModal && selectedClient && (
        <MembershipModal
          mode="assign"
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          membershipTypes={membershipTypes}
          onClose={() => {
            setShowMembershipModal(false);
            setSelectedClient(null);
          }}
          onSave={handleSaveMembership}
        />
      )}
    </SidebarLayout>
  );
}
