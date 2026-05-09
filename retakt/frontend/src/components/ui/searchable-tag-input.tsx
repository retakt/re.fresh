import { useState, useRef, useEffect } from "react";
import { X, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchableTagInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  availableTags: string[];
  selectedTags: string[];
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchableTagInput({
  value,
  onChange,
  onAdd,
  onRemove,
  availableTags,
  selectedTags,
  placeholder = "Type a tag...",
  onKeyDown,
}: SearchableTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on input and exclude already selected tags
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(value.toLowerCase()) &&
      !selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );

  // Show dropdown when there's input and filtered results
  useEffect(() => {
    setIsOpen(value.length > 0 && filteredTags.length > 0);
    setHighlightedIndex(0);
  }, [value, filteredTags.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && filteredTags.length > 0) {
        // Select highlighted tag
        onAdd(filteredTags[highlightedIndex]);
        onChange("");
        setIsOpen(false);
      } else if (value.trim()) {
        // Create new tag
        onAdd(value.trim());
        onChange("");
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }

    onKeyDown?.(e);
  };

  const handleSelectTag = (tag: string) => {
    onAdd(tag);
    onChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(tag);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length > 0 && filteredTags.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {isOpen && filteredTags.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <div className="max-h-[200px] overflow-y-auto">
            {filteredTags.map((tag, index) => (
              <div
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <span className="flex-1">{tag}</span>
                {availableTags.includes(tag) && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(tag, e)}
                    className="ml-2 rounded-full p-0.5 hover:bg-background opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {value.trim() &&
            !filteredTags.some((t) => t.toLowerCase() === value.toLowerCase()) && (
              <div className="border-t mt-1 pt-1">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Press Enter to create "{value}"
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
