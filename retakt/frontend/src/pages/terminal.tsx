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
      {/* Fixed-height container — mirrors chat page pattern, no page scroll */}
      <div
        data-terminal-page="true"
        className="flex flex-col flex-1 min-h-0 max-h-full w-full overflow-hidden"
      >
        <SharedTerminal className="flex-1 min-h-0 w-full" />
      </div>
    </ProtectedRoute>
  );
}
