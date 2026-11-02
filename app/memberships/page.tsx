"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import MembershipTypeModal from "../components/MembershipTypeModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastStack, { useToasts } from "../components/Toast";
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
  dni: string;
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
  const [pendingDeleteType, setPendingDeleteType] =
    useState<MembershipType | null>(null);
  const [pendingDeleteMembership, setPendingDeleteMembership] =
    useState<Membership | null>(null);
  const [warningDays, setWarningDays] = useState(7);
  const { toasts, push, dismiss } = useToasts();

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
      push("error", "No se pudo cargar la información. Recarga la página.");
    }
  }

  async function handleSaveType(data: Omit<MembershipType, "id">) {
    try {
      if (editingTypeId) {
        await apiFetch(`/membership-types/${editingTypeId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        push("success", "Plan actualizado");
      } else {
        await apiFetch("/membership-types", {
          method: "POST",
          body: JSON.stringify(data),
        });
        push("success", "Plan creado");
      }
      setShowTypeModal(false);
      setEditingTypeId(null);
      loadData();
    } catch (error) {
      console.error("Error saving membership type:", error);
      push("error", "No se pudo guardar el plan. Intenta de nuevo.");
    }
  }

  async function confirmDeleteType() {
    if (!pendingDeleteType) return;
    try {
      await apiFetch(`/membership-types/${pendingDeleteType.id}`, {
        method: "DELETE",
      });
      push("success", `El plan ${pendingDeleteType.name} fue eliminado`);
      setPendingDeleteType(null);
      loadData();
    } catch {
      push(
        "error",
        "No se pudo eliminar el plan. Puede que aún tenga membresías asociadas."
      );
    }
  }

  async function confirmDeleteMembership() {
    if (!pendingDeleteMembership) return;

    try {
      await apiFetch(`/memberships/${pendingDeleteMembership.id}`, {
        method: "DELETE",
      });
      push("success", "La membresía fue eliminada");
      setPendingDeleteMembership(null);
      loadData();
    } catch {
      push("error", "No se pudo eliminar la membresía. Intenta de nuevo.");
    }
  }

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <h1 className="page-title">Membresías</h1>

        <div className="card">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-4">
            <h2 className="text-base font-semibold text-ink">
              Planes disponibles
            </h2>
            <button
              onClick={() => {
                setEditingTypeId(null);
                setShowTypeModal(true);
              }}
              className="btn btn-primary !py-1.5"
            >
              <Plus className="h-4 w-4" />
              Nuevo plan
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {membershipTypes.map((type) => (
                <div
                  key={type.id}
                  className="group relative rounded-lg border border-[var(--line)] p-4 transition-colors hover:border-[var(--muted)]"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <h3 className="font-medium text-ink">{type.name}</h3>
                    <span className="num text-xl" style={{ color: "var(--ember)" }}>
                      S/ {type.price}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    {type.durationDays} días
                  </p>
                  {type.description && (
                    <p className="mt-2 text-sm text-muted">{type.description}</p>
                  )}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      aria-label={`Editar plan ${type.name}`}
                      onClick={() => {
                        setEditingTypeId(type.id);
                        setShowTypeModal(true);
                      }}
                      className="btn btn-ghost rounded !p-1.5"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Eliminar plan ${type.name}`}
                      onClick={() => setPendingDeleteType(type)}
                      className="btn btn-danger rounded !p-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {membershipTypes.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-muted">
                  No hay planes todavía.{" "}
                  <button
                    onClick={() => {
                      setEditingTypeId(null);
                      setShowTypeModal(true);
                    }}
                    className="font-medium text-ember underline underline-offset-2"
                  >
                    Crea el primero
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="border-b border-[var(--line-soft)] px-6 py-4">
            <h2 className="text-base font-semibold text-ink">
              Membresías registradas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left">
                  <th className="px-6 py-3 font-medium text-muted">Cliente</th>
                  <th className="px-6 py-3 font-medium text-muted">Plan</th>
                  <th className="px-6 py-3 font-medium text-muted">Inicio</th>
                  <th className="px-6 py-3 font-medium text-muted">Fin</th>
                  <th className="px-6 py-3 font-medium text-muted">Estado</th>
                  <th className="px-6 py-3 text-right font-medium text-muted">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-muted">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="border-b border-[var(--line-soft)] hover:bg-[var(--line-soft)]/60"
                  >
                    <td className="px-6 py-2.5 text-ink">
                      <span className="code-chip mr-2">
                        {membership.client.dni}
                      </span>
                      {membership.client.name}
                    </td>
                    <td className="px-6 py-2.5 text-ink">
                      {membership.type?.name || "Personalizado"}
                    </td>
                    <td className="px-6 py-2.5 font-mono text-xs text-muted">
                      {new Date(membership.startDate).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-6 py-2.5 font-mono text-xs text-muted">
                      {new Date(membership.endDate).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-6 py-2.5">
                      <span
                        className={
                          getMembershipStatus(
                            membership.endDate,
                            warningDays
                          ).className
                        }
                      >
                        {
                          getMembershipStatus(membership.endDate, warningDays)
                            .label
                        }
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-right font-mono text-ink">
                      {membership.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-2.5 text-right">
                      <button
                        aria-label={`Eliminar membresía de ${membership.client.name}`}
                        title="Eliminar membresía"
                        onClick={() => setPendingDeleteMembership(membership)}
                        className="btn btn-danger rounded !p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {memberships.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-muted"
                    >
                      Nadie tiene membresía aún. Asígnale una a tu primer
                      cliente desde la pantalla de Clientes.
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

      {pendingDeleteType && (
        <ConfirmDialog
          title="Eliminar plan"
          confirmLabel="Eliminar plan"
          message={`Se eliminará el plan “${pendingDeleteType.name}” (${pendingDeleteType.durationDays} días). Esta acción no se puede deshacer.`}
          onConfirm={confirmDeleteType}
          onCancel={() => setPendingDeleteType(null)}
        />
      )}

      {pendingDeleteMembership && (
        <ConfirmDialog
          title="Eliminar membresía"
          confirmLabel="Eliminar membresía"
          message={`Se eliminará la membresía de ${pendingDeleteMembership.client.name}, incluyendo sus pagos asociados. Esta acción no se puede deshacer.`}
          onConfirm={confirmDeleteMembership}
          onCancel={() => setPendingDeleteMembership(null)}
        />
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </SidebarLayout>
  );
}
