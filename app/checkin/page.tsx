"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle, AlertCircle, XCircle, User, CreditCard } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import MembershipModal from "../components/MembershipModal";
import { apiFetch } from "../lib/api";

interface Client {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  lastCheckin: string | null;
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

interface Toast {
  id: number;
  type: "success" | "warning" | "error";
  message: string;
}

function getMembershipStatus(endDate: string): {
  label: string;
  className: string;
  borderClass: string;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      label: "Vencida",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      borderClass: "border-red-500",
    };
  } else if (diff <= 7) {
    return {
      label: "Por vencer",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      borderClass: "border-amber-500",
    };
  }
  return {
    label: "Activa",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    borderClass: "border-green-500",
  };
}

export default function CheckinPage() {
  const [searchCode, setSearchCode] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showMoreCheckins, setShowMoreCheckins] = useState(false);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    loadMembershipTypes();
  }, []);

  async function loadMembershipTypes() {
    try {
      const data = await apiFetch<MembershipType[]>("/membership-types");
      setMembershipTypes(data);
    } catch (error) {
      console.error("Error loading membership types:", error);
    }
  }

  function addToast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  async function handleSearch() {
    if (!searchCode.trim()) return;

    setLoading(true);
    setError(null);
    setClient(null);

    try {
      const data = await apiFetch<Client>(`/checkins/${encodeURIComponent(searchCode.trim())}`);
      setClient(data);
    } catch (err) {
      setError("Cliente no encontrado");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin() {
    if (!client || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      await apiFetch("/checkins", {
        method: "POST",
        body: JSON.stringify({ clientId: client.id }),
      });

      addToast("success", "Check-in registrado exitosamente");

      const updatedClient = await apiFetch<Client>(`/checkins/${encodeURIComponent(client.code)}`);
      setClient(updatedClient);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("already exists")) {
        addToast("warning", "Ya fue registrado hoy");
      } else {
        addToast("error", "Error al registrar check-in");
      }
    } finally {
      setIsCheckingIn(false);
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
      if (client) {
        const updatedClient = await apiFetch<Client>(`/checkins/${encodeURIComponent(client.code)}`);
        setClient(updatedClient);
      }
    } catch (error) {
      addToast("error", "Error al guardar membresía");
    }
  }

  const activeMembership = client?.memberships.find((m) => m.status === "active");
  const displayedCheckins = showMoreCheckins
    ? client?.checkins || []
    : client?.checkins.slice(0, 10) || [];

  const groupedCheckins = displayedCheckins.reduce(
    (acc, checkin) => {
      const date = new Date(checkin.checkinDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(checkin);
      return acc;
    },
    {} as Record<string, typeof displayedCheckins>
  );

  const ToastIcon = ({ type }: { type: Toast["type"] }) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Check-in
        </h1>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por código de cliente (ej: GYM-001)..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {client && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              className={`rounded-xl border-2 bg-white dark:bg-zinc-800 p-6 ${
                activeMembership
                  ? getMembershipStatus(activeMembership.endDate).borderClass
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                  <User className="h-7 w-7 text-zinc-600 dark:text-zinc-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {client.name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {client.code}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {client.phone && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Teléfono: {client.phone}
                  </p>
                )}
                {client.email && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Email: {client.email}
                  </p>
                )}
              </div>

              {activeMembership ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Membresía:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(activeMembership.endDate).className}`}
                    >
                      {getMembershipStatus(activeMembership.endDate).label}
                    </span>
                  </div>
                  <p className="text-zinc-900 dark:text-white">
                    {activeMembership.type?.name || "Duración personalizada"}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Vence: {new Date(activeMembership.endDate).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 p-4 text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                    Sin membresía activa
                  </p>
                  <button
                    onClick={() =>
                      setMembershipModal({
                        mode: "assign",
                        clientId: client.id,
                        clientName: client.name,
                      })
                    }
                    className="flex items-center gap-2 mx-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <CreditCard className="h-4 w-4" />
                    Asignar Membresía
                  </button>
                </div>
              )}

              <button
                onClick={handleCheckin}
                disabled={isCheckingIn}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                {isCheckingIn ? "Registrando..." : "Registrar Asistencia"}
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  Historial de Check-ins
                </h3>
                {client.checkins.length > 10 && (
                  <button
                    onClick={() => setShowMoreCheckins(!showMoreCheckins)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {showMoreCheckins ? "Mostrar menos" : "Mostrar más"}
                  </button>
                )}
              </div>

              {Object.keys(groupedCheckins).length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {Object.entries(groupedCheckins).map(([month, checkins]) => (
                    <div key={month}>
                      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mb-2">
                        {month}
                      </p>
                      <div className="space-y-1">
                        {checkins.map((checkin) => (
                          <div
                            key={checkin.id}
                            className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            {new Date(checkin.checkinDate).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                  Sin check-ins registrados
                </p>
              )}
            </div>
          </div>
        )}

        {!client && !error && !loading && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">
              Ingresa el código del cliente para buscar
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800"
                : toast.type === "warning"
                ? "bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800"
            }`}
          >
            <ToastIcon type={toast.type} />
            <p
              className={`text-sm font-medium ${
                toast.type === "success"
                  ? "text-green-700 dark:text-green-300"
                  : toast.type === "warning"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {toast.message}
            </p>
          </div>
        ))}
      </div>

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
