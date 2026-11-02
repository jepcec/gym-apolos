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
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../context/theme";
import { branding } from "../lib/branding";

interface SidebarLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/checkin/", label: "Check-in", icon: ClipboardCheck },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients/", label: "Clientes", icon: Users },
  { href: "/memberships/", label: "Membresías", icon: CreditCard },
  { href: "/reports/", label: "Reportes", icon: FileBarChart },
  { href: "/settings/", label: "Configuración", icon: Settings },
];

/** El monograma F en placa de hierro — mismo dibujo que el favicon. */
function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="96" fill="#212327" />
      <rect x="158" y="118" width="66" height="286" fill="#f2f1ee" />
      <rect x="158" y="118" width="206" height="60" fill="#f2f1ee" />
      <rect x="158" y="230" width="158" height="56" fill="#f2f1ee" />
      <rect x="158" y="424" width="20" height="12" rx="2" fill="#ef7a45" />
      <rect x="188" y="424" width="20" height="12" rx="2" fill="#ef7a45" />
      <rect x="218" y="424" width="20" height="12" rx="2" fill="#ef7a45" />
    </svg>
  );
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const current = pathname.replace(/\/+$/, "") || "/";

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="iron-forge sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col border-r border-iron-line">
        {/* Marca */}
        <div className="px-5 pb-4 pt-5">
          <div className="flex items-center gap-3.5">
            <Monogram className="h-12 w-12 flex-shrink-0" />
            <div className="min-w-0">
              <span className="block font-display text-[1.75rem] font-bold leading-none tracking-[0.14em] text-[#f2f1ee]">
                {branding.name}
              </span>
              <p className="mt-1.5 text-[11px] text-[#8d8f95]">
                {branding.tagline}
              </p>
            </div>
          </div>
        </div>
        <div className="knurl-rule mx-5 mb-2" aria-hidden="true" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const target = item.href.replace(/\/+$/, "") || "/";
              const isActive =
                target === "/"
                  ? current === "/"
                  : current === target || current.startsWith(`${target}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`nav-link ${isActive ? "is-active" : ""}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Discos: ocupan el vacío con identidad de gimnasio */}
        <div className="disc-stack" aria-hidden="true">
          <span className="disc disc-outer" />
          <span className="disc disc-mid" />
          <span className="disc disc-inner" />
          <span className="disc disc-hub" />
        </div>

        <div className="border-t border-iron-line px-3 py-3">
          <button
            onClick={toggleTheme}
            className="nav-link w-full"
            aria-label={
              theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
