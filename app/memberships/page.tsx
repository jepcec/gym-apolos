"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import MembershipTypeModal from "../components/MembershipTypeModal";
import { apiFetch } from "../lib/api";
import { getMembershipStatus } from "../lib/membershipStatus";

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

export default function MembershipsPage() {
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [warningDays, setWarningDays] = useState(7);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [typesRes, membershipsRes, settingsRes] = await Promise.all([
        apiFetch<MembershipType[]>("/membership-types"),
        apiFetch<Membership[]>("/memberships"),
        apiFetch<Record<string, string>>("/settings"),
      ]);
      setMembershipTypes(typesRes);
      setMemberships(membershipsRes);
      setWarningDays(parseInt(settingsRes.warning_days || "7", 10));
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
                      S/ {type.price}
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
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(membership.endDate, warningDays).className}`}
                      >
                        {getMembershipStatus(membership.endDate, warningDays).label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-900 dark:text-white">
                      S/ {membership.price.toFixed(2)}
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
    </SidebarLayout>
  );
}
