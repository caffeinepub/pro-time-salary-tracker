import { Toaster } from "@/components/ui/sonner";
import { Outlet } from "@tanstack/react-router";
import { BottomNavigation } from "./BottomNavigation";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <img
            src="/assets/generated/app-logo.dim_256x256.png"
            alt="Pro Time Tracker"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">
              Pro Time Tracker
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Salary & Attendance
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      <BottomNavigation />
      <Toaster richColors position="top-center" />
    </div>
  );
}
