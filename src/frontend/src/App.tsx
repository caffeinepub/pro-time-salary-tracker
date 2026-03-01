import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/Layout/AppLayout";
import { Calendar } from "./pages/Calendar";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { Leave } from "./pages/Leave";
import { Settings } from "./pages/Settings";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppLayout />
    </ThemeProvider>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: Calendar,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: History,
});

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leave",
  component: Leave,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  calendarRoute,
  historyRoute,
  leaveRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
