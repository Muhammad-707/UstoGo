"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/LucideIcons";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common");

  const navItems = [
    { href: "/home", icon: "Home", label: t("home") },
    { href: "/search", icon: "Search", label: t("searchMasters") },
    { href: "/messages", icon: "MessageSquare", label: t("messages") },
    { href: "/dashboard/client", icon: "User", label: t("clientDashboard") },
  ];

  // Do not show bottom nav on landing page or auth pages
  if (pathname === "/" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <div className="relative flex items-center justify-center z-10 w-8 h-8">
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  name={item.icon as any} 
                  size={20} 
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive 
                      ? "text-blue-600 dark:text-sky-400 stroke-[2.5]" 
                      : "text-slate-500 dark:text-slate-400 stroke-2"
                  }`} 
                />
              </div>
              <span 
                className={`text-[10px] font-semibold transition-colors duration-200 line-clamp-1 text-center w-full px-1 ${
                  isActive 
                    ? "text-blue-600 dark:text-sky-400" 
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
