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
            "dark:border-white/5 dark:bg-[#191919]",
            "border-black/5 bg-[#e8e4d9]",
            className
          )}
        >
          <div className="w-full overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
