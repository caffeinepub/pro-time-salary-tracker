import { cn } from "@/lib/utils";
import { useLocation, useRouter } from "@tanstack/react-router";
import {
  Calendar,
  History,
  LayoutDashboard,
  Palmtree,
  Settings,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/history", label: "History", icon: History },
  { path: "/leave", label: "Leave", icon: Palmtree },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNavigation() {
  const router = useRouter();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              type="button"
              key={path}
              onClick={() => router.navigate({ to: path })}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 transition-colors min-h-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                size={20}
                className={cn("transition-transform", isActive && "scale-110")}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
