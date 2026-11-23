import type { Metadata } from "next";
import { SiteUiProvider } from "../components/SiteUi";
import { StoreGrid } from "../components/StoreGrid";

export const metadata: Metadata = {
  title: "The Store",
};

export default function StorePage() {
  return (
    <SiteUiProvider>
      <StoreGrid />
    </SiteUiProvider>
  );
}
