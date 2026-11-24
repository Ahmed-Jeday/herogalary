import { SiteUiProvider } from "../components/SiteUi";
import { StoreGrid } from "../components/StoreGrid";

export default function StorePage() {
  return (
    <SiteUiProvider>
      <StoreGrid />
    </SiteUiProvider>
  );
}
