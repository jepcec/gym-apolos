export type MembershipStatusKey = "active" | "warn" | "expired";

export interface MembershipStatusInfo {
  label: string;
  /** Clases de chip: `.plate .plate-*` */
  className: string;
  /** Clase de borde para tarjetas de contexto */
  borderClass: string;
  key: MembershipStatusKey;
  /** Días restantes hasta el vencimiento (negativo si ya venció) */
  daysLeft: number;
}

export function getMembershipStatus(
  endDate: string,
  warningDays: number = 7
): MembershipStatusInfo {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const diff = daysLeft;

  if (diff < 0) {
    return {
      label: "Vencida",
      className: "plate plate-expired",
      borderClass: "border-[var(--st-exp-fg)]",
      key: "expired",
      daysLeft,
    };
  } else if (diff <= warningDays) {
    return {
      label: "Por vencer",
      className: "plate plate-warn",
      borderClass: "border-[var(--st-warn-fg)]",
      key: "warn",
      daysLeft,
    };
  }
  return {
    label: "Activa",
    className: "plate plate-active",
    borderClass: "border-[var(--st-active-fg)]",
    key: "active",
    daysLeft,
  };
}
