import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import Placeholder from "../../components/dashboard/Placeholder";
import { SECTIONS } from "../../components/dashboard/sections";
import Overview from "./Overview";
import Profile from "./Profile";
import MyFavorites from "./MyFavorites";
import MyWatchlist from "./MyWatchlist";
import MyComics from "./MyComics";
import "../../styles/dashboard.css";

const PAGES = {
  overview: Overview,
  profile: Profile,
  favorites: MyFavorites,
  watchlist: MyWatchlist,
  comics: MyComics,
};

export default function Dashboard({ onExit }) {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dashboardApi.getCurrentUser().then(setUser);
    const handleUserUpdate = (e) => {
      if (e?.detail) setUser(e.detail);
      else dashboardApi.getCurrentUser().then(setUser);
    };
    window.addEventListener("heroverse:user-updated", handleUserUpdate);
    return () => window.removeEventListener("heroverse:user-updated", handleUserUpdate);
  }, []);

  function select(key) {
    setActive(key);
    setSidebarOpen(false);
  }

  const Page = PAGES[active];
  const meta = SECTIONS.find((s) => s.key === active);

  return (
    <div className="hv-dash">
      {sidebarOpen && <div className="hv-scrim" onClick={() => setSidebarOpen(false)} />}

      <DashboardSidebar user={user} active={active} onSelect={select} open={sidebarOpen} />

      <div className="hv-main">
        <DashboardHeader
          user={user}
          onBurger={() => setSidebarOpen(true)}
          onExit={onExit}
        />
        <div className="hv-content">
          {Page ? (
            <Page user={user} />
          ) : (
            <Placeholder icon={meta?.icon} title={meta?.label} />
          )}
        </div>
      </div>
    </div>
  );
}
