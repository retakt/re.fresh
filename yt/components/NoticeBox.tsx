import { cn } from "@/lib/utils";

interface NoticeBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function NoticeBox({ children, className }: NoticeBoxProps) {
  return (
    <div className="px-4 pb-6">
      <div className="w-full max-w-[640px] mx-auto">
        <div
          className={cn(
            "rounded-[11px] border px-4 py-3 w-full",
            className
          )}
          style={{
            backgroundColor: document.documentElement.classList.contains('dark') ? '#191919' : '#f4f4f5',
            borderColor: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : '#e4e4e7'
          }}
        >
          <div className="w-full overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
