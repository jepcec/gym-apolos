"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
} from "lucide-react";
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

interface ClientDetailModalProps {
  client: Client;
  membershipTypes: MembershipType[];
  warningDays: number;
  onClose: () => void;
  onDelete: (id: number) => void;
  onAssignMembership: (clientId: number) => void;
  onRenewMembership: (clientId: number, membershipId: number) => void;
  onRefresh: () => void;
}

export default function ClientDetailModal({
  client,
  membershipTypes,
  warningDays,
  onClose,
  onDelete,
  onAssignMembership,
  onRenewMembership,
  onRefresh,
}: ClientDetailModalProps) {
  const [showMoreCheckins, setShowMoreCheckins] = useState(false);
  const [showMoreMemberships, setShowMoreMemberships] = useState(false);

  const activeMembership = client.memberships.find((m) => m.status === "active");
  const displayedMemberships = showMoreMemberships
    ? client.memberships
    : client.memberships.slice(0, 5);
  const displayedCheckins = showMoreCheckins
    ? client.checkins
    : client.checkins.slice(0, 10);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-zinc-800 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
              <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {client.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {client.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Información personal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {client.dni && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">DNI:</span>
                  <span className="text-zinc-900 dark:text-white">{client.dni}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 dark:text-white">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 dark:text-white">{client.email}</span>
                </div>
              )}
              {client.birthDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 dark:text-white">
                    {new Date(client.birthDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {client.address && (
                <div className="col-span-2 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 dark:text-white">{client.address}</span>
                </div>
              )}
              {client.lastCheckin && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 dark:text-white">
                    Último check-in: {new Date(client.lastCheckin).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Membresía actual
              </h3>
            </div>
            {activeMembership ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {activeMembership.type?.name || "Duración personalizada"}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatus(activeMembership.endDate, warningDays).className}`}
                  >
                    {getMembershipStatus(activeMembership.endDate, warningDays).label}
                  </span>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
                  <p>Inicio: {new Date(activeMembership.startDate).toLocaleDateString()}</p>
                  <p>Vence: {new Date(activeMembership.endDate).toLocaleDateString()}</p>
                  <p>Precio: S/ {activeMembership.price.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 p-4 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Sin membresía activa
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Historial de membresías
              </h3>
              {client.memberships.length > 5 && (
                <button
                  onClick={() => setShowMoreMemberships(!showMoreMemberships)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showMoreMemberships ? "Mostrar menos" : "Mostrar más"}
                </button>
              )}
            </div>
            {displayedMemberships.length > 0 ? (
              <div className="space-y-2">
                {displayedMemberships.map((membership) => {
                  const status = getMembershipStatus(membership.endDate, warningDays);
                  return (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="text-zinc-900 dark:text-white">
                          {membership.type?.name || "Custom"}
                        </span>
                        <span className="mx-2 text-zinc-400">·</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {new Date(membership.startDate).toLocaleDateString()} -{" "}
                          {new Date(membership.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin historial</p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Historial de check-ins
              </h3>
              {client.checkins.length > 10 && (
                <button
                  onClick={() => setShowMoreCheckins(!showMoreCheckins)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showMoreCheckins ? "Mostrar menos" : "Mostrar más"}
                </button>
              )}
            </div>
            {Object.keys(groupedCheckins).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedCheckins).map(([month, checkins]) => (
                  <div key={month}>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1">
                      {month}
                    </p>
                    <div className="space-y-1">
                      {checkins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          {new Date(checkin.checkinDate).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin check-ins</p>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-6 py-4">
          <button
            onClick={() => onDelete(client.id)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
          <div className="flex items-center gap-2">
            {!activeMembership ? (
              <button
                onClick={() => onAssignMembership(client.id)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4" />
                Asignar Membresía
              </button>
            ) : (
              <button
                onClick={() => onRenewMembership(client.id, activeMembership.id)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Renovar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
