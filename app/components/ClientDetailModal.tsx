"use client";

import { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Trash2,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { getMembershipStatus } from "../lib/membershipStatus";
import ClientForm, { ClientFormValues } from "./ClientForm";

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

interface ClientDetailModalProps {
  client: Client;
  membershipTypes: MembershipType[];
  warningDays: number;
  onClose: () => void;
  onDelete: (id: number) => void;
  onAssignMembership: (clientId: number) => void;
  onRenewMembership: (clientId: number, membershipId: number) => void;
  onRefresh: () => void;
  /** Edición de datos. Devuelve un mensaje de error o null si se guardó. */
  onSaveEdit?: (id: number, values: ClientFormValues) => Promise<string | null>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

export default function ClientDetailModal({
  client,
  warningDays,
  onClose,
  onDelete,
  onAssignMembership,
  onRenewMembership,
  onSaveEdit,
}: ClientDetailModalProps) {
  const [showMoreCheckins, setShowMoreCheckins] = useState(false);
  const [showMoreMemberships, setShowMoreMemberships] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeMembership = client.memberships.find((m) => m.status === "active");
  const checkins = client.checkins ?? [];
  const displayedMemberships = showMoreMemberships
    ? client.memberships
    : client.memberships.slice(0, 5);
  const displayedCheckins = showMoreCheckins
    ? checkins
    : checkins.slice(0, 10);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-PE");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card flex max-h-[90vh] w-full max-w-2xl flex-col">
        {/* Cabecera tipo ficha */}
        <div className="flex items-center gap-4 border-b border-[var(--line-soft)] px-6 py-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-display text-lg font-bold tracking-wide"
            style={{ background: "var(--line-soft)", color: "var(--ink)" }}
          >
            {initials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-ink">
              {client.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
              <span className="code-chip">DNI {client.dni}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-ghost rounded !p-2"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        {editing ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="mb-1 text-base font-semibold text-ink">
              Editar datos del cliente
            </h3>
            <p className="mb-5 text-sm text-muted">
              Los cambios se guardan al instante en este computador.
            </p>
            <ClientForm
              includeStatus
              submitLabel="Guardar cambios"
              initial={{
                name: client.name,
                dni: client.dni,
                phone: client.phone ?? "",
                email: client.email ?? "",
                birthDate: client.birthDate
                  ? client.birthDate.slice(0, 10)
                  : "",
                address: client.address ?? "",
                status: client.status,
              }}
              onSubmit={async (values) => {
                const err = (await onSaveEdit?.(client.id, values)) ?? null;
                if (!err) setEditing(false);
                return err;
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Información personal
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {client.phone && (
                <p className="flex items-center gap-2 text-ink">
                  <Phone className="h-4 w-4 text-muted" />
                  {client.phone}
                </p>
              )}
              {client.email && (
                <p className="flex items-center gap-2 text-ink">
                  <Mail className="h-4 w-4 text-muted" />
                  {client.email}
                </p>
              )}
              {client.birthDate && (
                <p className="flex items-center gap-2 text-ink">
                  <Calendar className="h-4 w-4 text-muted" />
                  {fmtDate(client.birthDate)}
                </p>
              )}
              {client.lastCheckin && (
                <p className="flex items-center gap-2 text-ink">
                  <Clock className="h-4 w-4 text-muted" />
                  Último ingreso: {fmtDate(client.lastCheckin)}
                </p>
              )}
              {client.address && (
                <p className="col-span-2 flex items-center gap-2 text-ink">
                  <MapPin className="h-4 w-4 text-muted" />
                  {client.address}
                </p>
              )}
              {!client.phone &&
                !client.email &&
                !client.birthDate &&
                !client.address && (
                  <p className="col-span-2 text-muted">
                    Solo tiene el nombre por ahora. Los datos de contacto ayudan
                    a avisarle antes del vencimiento.
                  </p>
                )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Membresía actual
            </h3>
            {activeMembership ? (
              <div className="rounded-lg border border-[var(--line)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-ink">
                    {activeMembership.type?.name || "Duración personalizada"}
                  </span>
                  <span
                    className={
                      getMembershipStatus(activeMembership.endDate, warningDays)
                        .className
                    }
                  >
                    {getMembershipStatus(activeMembership.endDate, warningDays)
                      .label}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-xs text-muted">
                  {fmtDate(activeMembership.startDate)} →{" "}
                  {fmtDate(activeMembership.endDate)} · S/{" "}
                  {activeMembership.price.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-4 text-center text-sm text-muted">
                Sin membresía activa.{" "}
                <button
                  onClick={() => onAssignMembership(client.id)}
                  className="font-medium text-ember underline underline-offset-2"
                >
                  Asignar ahora
                </button>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                Historial de membresías
              </h3>
              {client.memberships.length > 5 && (
                <button
                  onClick={() => setShowMoreMemberships(!showMoreMemberships)}
                  className="text-xs text-ember hover:underline"
                >
                  {showMoreMemberships ? "Mostrar menos" : "Mostrar más"}
                </button>
              )}
            </div>
            {displayedMemberships.length > 0 ? (
              <div className="space-y-2">
                {displayedMemberships.map((membership) => {
                  const status = getMembershipStatus(
                    membership.endDate,
                    warningDays
                  );
                  return (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink">
                        {membership.type?.name || "Personalizado"}
                        <span className="ml-2 font-mono text-xs text-muted">
                          {fmtDate(membership.startDate)} →{" "}
                          {fmtDate(membership.endDate)}
                        </span>
                      </span>
                      <span className={status.className}>{status.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Sin historial todavía.</p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                Historial de ingresos
              </h3>
              {client.checkins.length > 10 && (
                <button
                  onClick={() => setShowMoreCheckins(!showMoreCheckins)}
                  className="text-xs text-ember hover:underline"
                >
                  {showMoreCheckins ? "Mostrar menos" : "Mostrar más"}
                </button>
              )}
            </div>
            {Object.keys(groupedCheckins).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedCheckins).map(([month, checkins]) => (
                  <div key={month}>
                    <p className="mb-1.5 text-xs text-muted">
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
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Sin ingresos registrados.</p>
            )}
          </section>
        </div>
        )}

        {!editing && (
        <div className="flex items-center justify-between border-t border-[var(--line-soft)] px-6 py-4">
          <div className="flex items-center gap-2">
            {onSaveEdit && (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-outline"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            )}
            <button
              onClick={() => onDelete(client.id)}
              className="btn btn-danger"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
          {!activeMembership ? (
            <button
              onClick={() => onAssignMembership(client.id)}
              className="btn btn-primary"
            >
              <CreditCard className="h-4 w-4" />
              Asignar membresía
            </button>
          ) : (
            <button
              onClick={() =>
                onRenewMembership(client.id, activeMembership.id)
              }
              className="btn btn-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Renovar
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
