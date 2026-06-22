export function getMembershipStatus(
  endDate: string,
  warningDays: number = 7
): {
  label: string;
  className: string;
  borderClass: string;
} {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      label: "Vencida",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      borderClass: "border-red-500",
    };
  } else if (diff <= warningDays) {
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
