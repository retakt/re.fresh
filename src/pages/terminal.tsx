import ProtectedRoute from "@/components/ProtectedRoute";
import { SharedTerminal } from "@/components/terminal/shared-terminal";
import { PageMeta } from "@/components/seo/page-meta";

export default function TerminalPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "editor", "member"]}>
      <PageMeta
        title="Terminal — re.Takt"
        description="Shared live terminal session. Admins can type; all authenticated users watch live output."
        url="https://retakt.com/terminal"
        type="website"
      />
      {/* Terminal fills available space with proper overflow constraint */}
      <SharedTerminal className="w-full h-full flex-1 min-h-0" />
    </ProtectedRoute>
  );
}
