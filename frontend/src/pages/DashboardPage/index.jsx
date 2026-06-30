import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, DashboardSkeleton } from "./components";
import { Dashboard } from "./Dashboard";
import { Analytics } from "./Analytics";
import { PYQs } from "./PYQs";
import { Settings } from "./Settings";
import { InterviewForum } from "./InterviewForum";
import { QuestionView } from "./QuestionView";
import { useUserStore } from "@/store/useUserStore";
import apiClient from "@/api/client";
import { authService } from "@/api/services";

export function DashboardPage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    const path = location.pathname;
    if (path.startsWith("/dashboard/forum")) return "forum";
    if (path.startsWith("/dashboard/analytics")) return "analytics";
    if (path.startsWith("/dashboard/pyqs")) return "pyqs";
    if (path.startsWith("/dashboard/settings")) return "settings";
    return "dashboard";
  });
  const [selectedQuestionSlug, setSelectedQuestionSlug] = useState("two-sum");
  const storeUser = useUserStore((state) => state.user);
  const [firstLoad, setFirstLoad] = useState(!storeUser);

  const setUser = useUserStore((state) => state.setUser);
  const [platforms, setPlatforms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setUser(null);
    localStorage.removeItem("dsabuddy_dashboard_cache");
    window.location.href = "/login";
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/dashboard/forum")) {
      setActiveSection("forum");
    } else if (path.startsWith("/dashboard/analytics")) {
      setActiveSection("analytics");
    } else if (path.startsWith("/dashboard/pyqs")) {
      setActiveSection("pyqs");
    } else if (path.startsWith("/dashboard/settings")) {
      setActiveSection("settings");
    } else {
      setActiveSection("dashboard");
    }
  }, [location.pathname]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [userRes, platRes, analyticsRes, compRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/platform-connections'),
        apiClient.get('/daily-activity/analytics'),
        apiClient.get('/companies'),
      ]);

      const u = userRes.user || userRes;
      setUser(u);

      const p = platRes.platformConnections || platRes;
      setPlatforms(p);

      setAnalytics(analyticsRes);

      const companiesArray = Array.isArray(compRes) ? compRes : compRes.companies || [];
      setCompanies(companiesArray);

      const updatedCache = {
        user: u,
        platforms: p,
        analytics: analyticsRes,
        companies: companiesArray,
      };

      try {
        localStorage.setItem(
          "dsabuddy_dashboard_cache",
          JSON.stringify(updatedCache),
        );
      } catch (e) {
        console.error("Failed to write dashboard cache", e);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
      setError("Failed to fetch some dashboard data. Please try again later.");
    } finally {
      setFirstLoad(false);
    }
  }, [setUser]);

  useEffect(() => {
    // Load from cache immediately so the user has something to see instantly
    try {
      const cachedData = localStorage.getItem("dsabuddy_dashboard_cache");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.user) setUser(parsed.user);
        if (parsed.platforms) setPlatforms(parsed.platforms);
        if (parsed.analytics) setAnalytics(parsed.analytics);
        if (parsed.companies) {
          const companiesArray = Array.isArray(parsed.companies)
            ? parsed.companies
            : parsed.companies.companies || [];
          setCompanies(companiesArray);
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard cache", e);
    }

    fetchData();
  }, [fetchData, setUser]);

  const handleSelectQuestion = (slug) => {
    setSelectedQuestionSlug(slug);
    setActiveSection("problems");
  };

  const renderSection = () => {
    if (firstLoad && !storeUser) {
      return <DashboardSkeleton />;
    }
    switch (activeSection) {
      case "dashboard":
        return (
          <Dashboard
            user={storeUser}
            platforms={platforms}
            analytics={analytics}
            onUpdate={fetchData}
          />
        );
      case "problems":
        return <QuestionView titleSlug={selectedQuestionSlug} />;
      case "analytics":
        return <Analytics analytics={analytics} />;
      case "pyqs":
        return (
          <PYQs companies={companies} onSelectQuestion={handleSelectQuestion} />
        );
      case "settings":
        return <Settings platforms={platforms} onUpdate={fetchData} />;
      case "forum":
        return <InterviewForum />;
      default:
        return (
          <Dashboard
            user={storeUser}
            platforms={platforms}
            analytics={analytics}
            onUpdate={fetchData}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#000000]">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={storeUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 ml-0 md:ml-20 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-400 font-bold"
                >
                  ×
                </button>
              </div>
            )}
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
