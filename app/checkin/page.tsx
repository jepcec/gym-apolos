"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, LogIn, RefreshCw, CreditCard } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import MembershipModal from "../components/MembershipModal";
import ToastStack, { useToasts } from "../components/Toast";
import { apiFetch } from "../lib/api";
import { getMembershipStatus } from "../lib/membershipStatus";

interface Client {
  id: number;
  dni: string;
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

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function timeOf(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

export default function CheckinPage() {
  const [searchDni, setSearchDni] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState<string | null>(null);
  const [membershipModal, setMembershipModal] = useState<{
    mode: "assign" | "renew";
    clientId?: number;
    clientName?: string;
  } | null>(null);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [warningDays, setWarningDays] = useState(7);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<number | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function loadTodayCount() {
    try {
      const stats = await apiFetch<{ todayCheckins: number }>("/dashboard");
      setTodayCount(stats.todayCheckins);
    } catch {
      /* silencioso: es un dato de contexto */
    }
  }

  useEffect(() => {
    (async () => {
      focusInput();
      loadTodayCount();
      try {
        const [typesData, settingsData] = await Promise.all([
          apiFetch<MembershipType[]>("/membership-types"),
          apiFetch<Record<string, string>>("/settings"),
        ]);
        setMembershipTypes(typesData);
        setWarningDays(parseInt(settingsData.warning_days || "7", 10));
      } catch (error) {
        console.error("Error loading membership types:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  function resetScreen() {
    setClient(null);
    setSearchDni("");
    setJustCheckedIn(null);
    setError(null);
    focusInput();
  }

  async function handleSearch() {
    if (!searchDni || loading) return;

    setLoading(true);
    setError(null);
    setClient(null);
    setJustCheckedIn(null);

    try {
      const data = await apiFetch<Client>(`/checkins/${encodeURIComponent(searchDni)}`);
      setClient(data);
    } catch {
      setError(
        `No encontramos ningún cliente con el DNI ${searchDni}. Verifica el número e intenta de nuevo.`
      );
    } finally {
      setLoading(false);
      focusInput();
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

      const stamp = new Date().toISOString();
      setJustCheckedIn(stamp);
      push("success", `Ingreso registrado para ${client.name}`);
      loadTodayCount();

      const updatedClient = await apiFetch<Client>(
        `/checkins/${encodeURIComponent(client.dni)}`
      );
      setClient(updatedClient);

      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(resetScreen, 2600);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("already exists")) {
          push("warning", "Esta persona ya ingresó hoy");
        } else if (
          err instanceof Error &&
          err.message.includes("membresía vigente")
        ) {
          push("warning", "No tiene una membresía vigente");
        } else {
          push("error", "No se pudo registrar el ingreso. Intenta de nuevo.");
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
      push("success", "Membresía guardada");
      if (client) {
        const updatedClient = await apiFetch<Client>(
          `/checkins/${encodeURIComponent(client.dni)}`
        );
        setClient(updatedClient);
      }
    } catch {
      push("error", "No se pudo guardar la membresía. Intenta de nuevo.");
    }
  }

  const activeMembership = client?.memberships.find((m) => m.status === "active");
  const status = activeMembership
    ? getMembershipStatus(activeMembership.endDate, warningDays)
    : null;
  const hasValidMembership = Boolean(
    activeMembership && status && status.key !== "expired"
  );
  const alreadyToday = client?.checkins.some((c) => isToday(c.checkinDate));
  const lastTodayEntry = client?.checkins.find((c) => isToday(c.checkinDate));

  // Agrupar historial por mes (últimos 10 visibles, expandible)
  const displayedCheckins = (client?.checkins || []).slice(0, 30);
  const groupedCheckins = displayedCheckins.reduce(
    (acc, checkin) => {
      const date = new Date(checkin.checkinDate);
      const key = date.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(checkin);
      return acc;
    },
    {} as Record<string, typeof displayedCheckins>
  );

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="page-title">Check-in</h1>
          <p className="text-sm text-muted">
            Ingresos hoy:{" "}
            <span className="num text-lg align-middle text-ink">
              {todayCount ?? "—"}
            </span>
          </p>
        </div>

        {/* Búsqueda estilo mostrador */}
        <div className="card p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <label htmlFor="dni" className="sr-only">
                DNI del cliente
              </label>
              <input
                id="dni"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12345678"
                maxLength={8}
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-lg border border-line bg-canvas px-4 py-3 font-mono text-xl tracking-[0.08em] text-ink placeholder:text-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ember"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchDni}
              className="btn btn-primary px-6 text-base"
            >
              <Search className="h-5 w-5" />
              {loading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </div>

        {error && !client && (
          <div
            className="card p-5 text-sm"
            style={{ borderColor: "var(--st-exp-fg)" }}
            role="alert"
          >
            <span style={{ color: "var(--st-exp-fg)" }}>{error}</span>{" "}
            <button
              onClick={() => inputRef.current?.focus()}
              className="underline underline-offset-2 text-muted hover:text-ink"
            >
              Corregir DNI
            </button>
          </div>
        )}

        {client && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* Ficha / confirmación */}
            <div
              className={`card relative overflow-hidden border-2 p-6 ${
                justCheckedIn
                  ? "animate-plate"
                  : ""
              } ${
                status
                  ? status.borderClass
                  : "border-line"
              }`}
            >
              {justCheckedIn && (
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: "var(--st-active-fg)" }}
                />
              )}

              <div className="mb-5 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full font-display text-xl font-bold tracking-wide"
                  style={{
                    background: "var(--line-soft)",
                    color: "var(--ink)",
                  }}
                >
                  {initials(client.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-ink">
                    {client.name}
                  </h2>
                  <p className="mt-1">
                    <span className="code-chip">DNI {client.dni}</span>
                  </p>
                </div>
                <div className="ml-auto text-right">
                  {justCheckedIn && (
                    <>
                      <p className="num text-2xl text-muted">
                        {new Date(justCheckedIn).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-[11px] text-muted">ingresó</p>
                    </>
                  )}
                </div>
              </div>

              {/* Franja de membresía */}
              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-canvas px-4 py-3">
                {activeMembership && status ? (
                  <>
                    <span className="text-sm text-muted">
                      {activeMembership.type?.name ?? "Duración personalizada"}
                    </span>
                    <span className={status.className}>{status.label}</span>
                    <span className="ml-auto font-mono text-xs text-muted">
                      vence{" "}
                      {new Date(activeMembership.endDate).toLocaleDateString(
                        "es-PE"
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="plate plate-none">Sin membresía</span>
                    <button
                      onClick={() =>
                        setMembershipModal({
                          mode: "assign",
                          clientId: client.id,
                          clientName: client.name,
                        })
                      }
                      className="btn btn-outline ml-auto !py-1 text-xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Asignar membresía
                    </button>
                  </>
                )}
              </div>

              {/* Alertas contextuales */}
              {status?.key === "expired" && !justCheckedIn && (
                <div
                  className="mb-5 flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "var(--st-exp-bg)",
                    color: "var(--st-exp-fg)",
                  }}
                >
                  <span>
                    Su membresía venció el{" "}
                    {new Date(activeMembership!.endDate).toLocaleDateString(
                      "es-PE"
                    )}
                    .
                  </span>
                  <button
                    onClick={() =>
                      setMembershipModal({
                        mode: "renew",
                        clientId: client.id,
                        clientName: client.name,
                      })
                    }
                    className="btn ml-auto !bg-[var(--st-exp-fg)] !py-1 !text-xs text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Renovar ahora
                  </button>
                </div>
              )}

              {status?.key === "warn" && !justCheckedIn && (
                <p className="mb-4 text-sm" style={{ color: "var(--st-warn-fg)" }}>
                  {status.daysLeft <= 0
                    ? "Su membresía vence hoy."
                    : `Le quedan ${status.daysLeft} ${status.daysLeft === 1 ? "día" : "días"} de membresía.`}
                </p>
              )}

              {!hasValidMembership && !alreadyToday && !justCheckedIn && (
                <div
                  className="mb-4 rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "var(--st-exp-bg)",
                    color: "var(--st-exp-fg)",
                  }}
                >
                  No se puede registrar el ingreso sin una membresía vigente.
                </div>
              )}

              {/* Acción principal */}
              {justCheckedIn ? (
                <div
                  className="flex items-center justify-center gap-3 rounded-lg py-4 text-base font-semibold"
                  style={{
                    background: "var(--st-active-bg)",
                    color: "var(--st-active-fg)",
                  }}
                >
                  <LogIn className="h-5 w-5" />
                  Ingreso registrado — listo para el siguiente
                </div>
              ) : alreadyToday ? (
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium"
                    style={{
                      background: "var(--st-warn-bg)",
                      color: "var(--st-warn-fg)",
                    }}
                  >
                    Ya ingresó hoy a las {timeOf(lastTodayEntry!.checkinDate)}
                  </div>
                  <button onClick={resetScreen} className="btn btn-outline w-full">
                    Buscar otro cliente
                  </button>
                </div>
              ) : !hasValidMembership ? (
                <button
                  disabled
                  className="btn w-full cursor-not-allowed py-3.5 text-base opacity-60"
                >
                  <LogIn className="h-5 w-5" />
                  Ingreso no permitido
                </button>
              ) : (
                <button
                  onClick={handleCheckin}
                  disabled={isCheckingIn}
                  className="btn btn-primary w-full py-3.5 text-base"
                >
                  <LogIn className="h-5 w-5" />
                  {isCheckingIn
                    ? "Registrando…"
                    : status?.key === "expired"
                      ? "Registrar ingreso de todos modos"
                      : "Registrar ingreso"}
                </button>
              )}
            </div>

            {/* Historial */}
            <div className="card p-6">
              <h3 className="mb-4 text-sm font-semibold text-ink">
                Historial de ingresos
              </h3>
              {Object.keys(groupedCheckins).length > 0 ? (
                <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1">
                  {Object.entries(groupedCheckins).map(([month, checkins]) => (
                    <div key={month}>
                      <p className="mb-2 text-xs text-muted">
                        {month} · {checkins.length}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {checkins.map((checkin) => (
                          <span
                            key={checkin.id}
                            className="code-chip !text-[11px]"
                            title={new Date(
                              checkin.checkinDate
                            ).toLocaleString("es-PE")}
                          >
                            {new Date(
                              checkin.checkinDate
                            ).toLocaleDateString("es-PE", { day: "2-digit" })}
                            <span className="ml-1 opacity-60">
                              {timeOf(checkin.checkinDate)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  Primera visita: aún no tiene ingresos registrados.
                </p>
              )}
            </div>
          </div>
        )}

        {!client && !error && !loading && (
          <div className="card px-6 py-14 text-center">
            <p className="text-sm text-muted">
              Escribe el código del cliente y presiona Enter.
            </p>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} dismiss={dismiss} />

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
