import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/navbar.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import BottomNav from "@/components/layout/bottom-nav.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";

export default function AppLayout() {
  return (
    <div className="flex min-h-[var(--app-height)] flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-1 mx-auto flex w-full max-w-6xl gap-0 px-3 sm:px-4 lg:px-6">
        <div className="hidden md:block w-44 shrink-0 border-r border-border/50 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]">
          <Sidebar />
        </div>

        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden py-5 sm:py-8 pb-[76px] md:pb-14 md:pl-6 lg:pl-8"
        >
          <Outlet />
        </main>
      </div>

      <Footer />
      <BottomNav />
      <FloatingPlayer />
    </div>
  );
}
