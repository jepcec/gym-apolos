"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import SidebarLayout from "../../components/SidebarLayout";
import ClientForm, { ClientFormValues } from "../../components/ClientForm";
import MembershipModal from "../../components/MembershipModal";
import ToastStack, { useToasts } from "../../components/Toast";
import { apiFetch } from "../../lib/api";

interface MembershipType {
  id: number;
  name: string;
  durationDays: number;
  price: number;
}

export default function NewClientPage() {
  const router = useRouter();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [membershipModal, setMembershipModal] = useState(false);
  const [createdClient, setCreatedClient] = useState<{
    id: number;
    dni: string;
    name: string;
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    apiFetch<MembershipType[]>("/membership-types")
      .then(setMembershipTypes)
      .catch(console.error);
  }, []);

  const handleCreate = async (values: ClientFormValues): Promise<string | null> => {
    try {
      const client = await apiFetch<{ id: number; dni: string }>("/clients", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setCreatedClient({ ...client, name: values.name.trim() });
      setShowAssignDialog(true);
      return null;
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof Error && error.message.includes("registrado")) {
        return error.message;
      }
      push("error", "No se pudo crear el cliente. Intenta de nuevo.");
      return null;
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
      push("success", "Membresía asignada");
      router.push("/clients/");
    } catch (error) {
      console.error("Error assigning membership:", error);
      push(
        "error",
        "El cliente quedó creado, pero no se pudo asignar la membresía."
      );
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl">
        <div className="mb-5">
          <Link
            href="/clients/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </Link>
        </div>

        <div className="card">
          <div className="border-b border-[var(--line-soft)] px-6 py-4">
            <h1 className="text-lg font-semibold text-ink">Nuevo cliente</h1>
            <p className="mt-0.5 text-xs text-muted">
              El DNI es el código de verificación del cliente en recepción.
            </p>
          </div>

          <div className="p-6">
            <ClientForm
              submitLabel="Guardar cliente"
              onSubmit={handleCreate}
              onCancel={() => router.push("/clients/")}
            />
          </div>
        </div>
      </div>

      {showAssignDialog && createdClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="card w-full max-w-sm p-6 text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: "var(--st-active-bg)",
                color: "var(--st-active-fg)",
              }}
            >
              <CreditCard className="h-6 w-6" />
            </div>
            <h2 className="mb-1 text-base font-semibold text-ink">
              {createdClient.name} registrado
            </h2>
            <p className="mb-1 text-sm text-muted">
              DNI{" "}
              <span className="code-chip">{createdClient.dni}</span>
            </p>
            <p className="mb-5 text-sm text-muted">
              ¿Le asignas una membresía ahora?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/clients/")}
                className="btn btn-outline flex-1"
              >
                Más adelante
              </button>
              <button
                onClick={() => {
                  setShowAssignDialog(false);
                  setMembershipModal(true);
                }}
                className="btn btn-primary flex-1"
              >
                Asignar membresía
              </button>
            </div>
          </div>
        </div>
      )}

      {membershipModal && createdClient && (
        <MembershipModal
          mode="assign"
          clientId={createdClient.id}
          clientName={createdClient.name}
          membershipTypes={membershipTypes}
          onClose={() => {
            setMembershipModal(false);
            router.push("/clients/");
          }}
          onSave={handleAssignMembership}
        />
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </SidebarLayout>
  );
}
