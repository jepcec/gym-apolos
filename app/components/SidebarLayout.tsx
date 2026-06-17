"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  FileBarChart,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/theme";

interface SidebarLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients/", label: "Clientes", icon: Users },
  { href: "/memberships/", label: "Membresías", icon: CreditCard },
  { href: "/checkin/", label: "Check-in", icon: ClipboardCheck },
  { href: "/reports/", label: "Reportes", icon: FileBarChart },
  { href: "/settings/", label: "Configuración", icon: Settings },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800">
        <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-700 px-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Apolos Gym
          </h1>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 w-64 p-4">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-white transition-colors"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
