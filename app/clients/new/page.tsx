"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CreditCard } from "lucide-react";
import Link from "next/link";
import SidebarLayout from "../../components/SidebarLayout";
import MembershipModal from "../../components/MembershipModal";
import { apiFetch } from "../../lib/api";

interface MembershipType {
  id: number;
  name: string;
  durationDays: number;
  price: number;
}

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    email: "",
    birthDate: "",
    address: "",
  });
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [membershipModal, setMembershipModal] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<number | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<MembershipType[]>("/membership-types")
      .then(setMembershipTypes)
      .catch(console.error);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const client = await apiFetch<{ id: number }>("/clients", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setCreatedClientId(client.id);
      setShowAssignDialog(true);
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Error al crear cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignMembership = async (data: {
    clientId: number;
    typeId?: number;
    startDate: string;
    durationDays?: number;
    price: number;
  }) => {
    try {
      await apiFetch("/memberships", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push("/clients/");
    } catch (error) {
      console.error("Error assigning membership:", error);
      alert("Error al asignar membresía");
    }
  };

  const handleSkipAssign = () => {
    router.push("/clients/");
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            href="/clients/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Nuevo Cliente
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="DNI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Teléfono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Dirección
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Dirección"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/clients/")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAssignDialog && createdClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white dark:bg-zinc-800 shadow-xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Cliente creado exitosamente
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                ¿Desea asignar una membresía ahora?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSkipAssign}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Omitir
                </button>
                <button
                  onClick={() => {
                    setShowAssignDialog(false);
                    setMembershipModal(true);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Asignar Membresía
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {membershipModal && createdClientId && (
        <MembershipModal
          mode="assign"
          clientId={createdClientId}
          clientName={formData.name}
          membershipTypes={membershipTypes}
          onClose={() => {
            setMembershipModal(false);
            router.push("/clients/");
          }}
          onSave={handleAssignMembership}
        />
      )}
    </SidebarLayout>
  );
}
