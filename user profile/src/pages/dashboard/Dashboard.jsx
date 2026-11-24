import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import DashboardSidebar, { SECTIONS } from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import Placeholder from "../../components/dashboard/Placeholder";
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

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dashboardApi.getCurrentUser().then(setUser);
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
        <DashboardHeader user={user} onBurger={() => setSidebarOpen(true)} />
        <div className="hv-content">
          {Page ? (
            <Page />
          ) : (
            <Placeholder icon={meta?.icon} title={meta?.label} />
          )}
        </div>
      </div>
    </div>
  );
}
