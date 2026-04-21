import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/navbar.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import BottomNav from "@/components/layout/bottom-nav.tsx";
import Footer from "@/components/layout/footer.tsx";
import FloatingPlayer from "@/components/player/FloatingPlayer.tsx";

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-svh bg-background text-foreground">
      <Navbar />

      <div className="flex-1 mx-auto flex w-full max-w-6xl gap-6 px-4 lg:px-6">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-x-hidden py-8 pb-28 md:border-l md:border-border/60 md:pb-10 md:pl-5 lg:pl-6">
          <Outlet />
        </main>
      </div>

      <Footer />
      <BottomNav />
      <FloatingPlayer />
    </div>
  );
}
