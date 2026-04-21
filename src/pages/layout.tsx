import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/navbar.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import BottomNav from "@/components/layout/bottom-nav.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Navbar />

      <div className="flex-1 mx-auto flex w-full max-w-6xl gap-6 px-3 sm:px-4 lg:px-6">
        <Sidebar />

        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden py-5 sm:py-8 pb-[76px] md:border-l md:border-border/60 md:pb-14 md:pl-5 lg:pl-6"
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
