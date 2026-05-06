import { VSCodeLayout } from "./layouts/vscode-layout";

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header - using same pattern as other pages */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          panel settings:
        </p>
      </div>

      {/* VS Code Layout - takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <VSCodeLayout />
      </div>
    </div>
  );
}
