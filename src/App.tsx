import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Dashboard } from "@/pages/Dashboard";
import { Analytics } from "@/pages/Analytics";
import { Calendar } from "@/pages/Calendar";
import { Reports } from "@/pages/Reports";
import { Accounts } from "@/pages/Accounts";
import { Login } from "@/pages/Login";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const token = useAuthStore((s) => s.token);
  const demoMode = useAuthStore((s) => s.demoMode);

  // Keep the <html> class in sync with the persisted theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // No session and not exploring the demo → sign in (or enter demo) first.
  if (!token && !demoMode) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="print-area mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings/accounts" element={<Accounts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
