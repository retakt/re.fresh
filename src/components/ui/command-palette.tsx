import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Search, BookOpen, GraduationCap, Music2, Home, User, FolderOpen, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "motion/react";

type SearchResult = {
  id: string;
  title: string;
  type: "post" | "tutorial" | "music" | "page";
  href: string;
  excerpt?: string;
  tags?: string[];
};

const TYPE_ICON = {
  post: BookOpen,
  tutorial: GraduationCap,
  music: Music2,
  page: (href: string) => {
    const navPage = NAV_PAGES.find(p => p.href === href);
    return navPage ? navPage.icon : Home;
  },
};

const TYPE_COLOR = {
  post: "text-sky-500",
  tutorial: "text-amber-500",
  music: "text-cyan-500",
  page: "text-green-500",
} as const;

const TYPE_BG = {
  post: "bg-sky-500/10",
  tutorial: "bg-amber-500/10",
  music: "bg-cyan-500/10",
  page: "bg-green-500/10",
} as const;

// Navigation pages that can be searched
const NAV_PAGES = [
  { href: "/whats-new", icon: Sparkles, label: "What's New", description: "Updates" },
  { href: "/", icon: Home, label: "Home", description: "Overview" },
  { href: "/blog", icon: BookOpen, label: "Blog", description: "Articles" },
  { href: "/music", icon: Music2, label: "Music", description: "Tracks" },
  { href: "/tutorials", icon: GraduationCap, label: "Tutorials", description: "Guides" },
  { href: "/about", icon: User, label: "About", description: "Info" },
  { href: "/files", icon: FolderOpen, label: "Files", description: "Downloads" },
  { href: "/chat", icon: MessageSquare, label: "Chat", description: "Ai Chat" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search logic - reusing your existing search + adding navigation pages
  useEffect(() => {
    const searchPages = () => {
      if (!query.trim()) return [];
      
      return NAV_PAGES
        .filter(page => 
          page.label.toLowerCase().includes(query.toLowerCase()) ||
          page.description.toLowerCase().includes(query.toLowerCase())
        )
        .map(page => ({
          id: `page-${page.href}`,
          title: page.label,
          type: "page" as const,
          href: page.href,
          excerpt: page.description,
          tags: [],
        }));
    };

    if (!debouncedQuery.trim()) {
      // Show navigation pages when no query
      const allPages = NAV_PAGES.map(page => ({
        id: `page-${page.href}`,
        title: page.label,
        type: "page" as const,
        href: page.href,
        excerpt: page.description,
        tags: [],
      }));
      setResults(allPages);
      return;
    }

    const search = async () => {
      setLoading(true);
      const q = `%${debouncedQuery.trim()}%`;
      
      // Search pages first
      const pageResults = searchPages();
      
      // Search content
      const [posts, tutorials, music] = await Promise.all([
        supabase.from("posts").select("id,title,slug,excerpt,tags").ilike("title", q).eq("published", true).limit(5),
        supabase.from("tutorials").select("id,title,slug,excerpt,tags,difficulty").ilike("title", q).eq("published", true).limit(5),
        supabase.from("music").select("id,title,genre,tags,release_type,album").ilike("title", q).eq("published", true).limit(5),
      ]);

      const contentResults: SearchResult[] = [
        ...(posts.data ?? []).map((p) => ({
          id: p.id, title: p.title, type: "post" as const,
          href: `/blog/${p.slug}`, excerpt: "Article", tags: p.tags,
        })),
        ...(tutorials.data ?? []).map((t) => ({
          id: t.id, title: t.title, type: "tutorial" as const,
          href: `/tutorials/${t.slug}`, excerpt: t.difficulty || "Guide", tags: t.tags,
        })),
        ...(music.data ?? []).map((m) => ({
          id: m.id, title: m.title, type: "music" as const,
          href: (m.release_type === "album" || m.release_type === "ep") && m.album
            ? `/music/album/${encodeURIComponent(m.album)}`
            : `/music/song/${m.id}`,
          excerpt: m.genre || "Track", // Add consistent excerpt
          tags: m.tags,
        })),
      ];

      // Combine pages and content, pages first
      setResults([...pageResults, ...contentResults]);
      setSelectedIndex(0);
      setLoading(false);
    };

    void search();
  }, [debouncedQuery, query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          // Calculate total items (parents + children)
          const grouped = results.reduce((acc, result) => {
            if (!acc[result.type]) acc[result.type] = [];
            acc[result.type].push(result);
            return acc;
          }, {} as Record<string, SearchResult[]>);
          
          const typeOrder = ['page', 'post', 'tutorial', 'music'];
          const totalItems = typeOrder.reduce((total, type) => {
            if (grouped[type] && grouped[type].length > 0) {
              return total + 1 + grouped[type].length; // 1 parent + children
            }
            return total;
          }, 0);
          
          setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          // Find the selected item (parent or child)
          const groupedForEnter = results.reduce((acc, result) => {
            if (!acc[result.type]) acc[result.type] = [];
            acc[result.type].push(result);
            return acc;
          }, {} as Record<string, SearchResult[]>);
          
          const typeOrderForEnter = ['page', 'post', 'tutorial', 'music'];
          const typeHrefs = {
            page: '/',
            post: '/blog', 
            tutorial: '/tutorials',
            music: '/music'
          };
          
          let currentIdx = 0;
          let targetHref = '';
          
          for (const type of typeOrderForEnter) {
            if (groupedForEnter[type] && groupedForEnter[type].length > 0) {
              // Check if parent is selected
              if (currentIdx === selectedIndex) {
                targetHref = typeHrefs[type as keyof typeof typeHrefs];
                break;
              }
              currentIdx++;
              
              // Check children
              for (const result of groupedForEnter[type]) {
                if (currentIdx === selectedIndex) {
                  targetHref = result.href;
                  break;
                }
                currentIdx++;
              }
              
              if (targetHref) break;
            }
          }
          
          if (targetHref) {
            window.location.href = targetHref;
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="absolute inset-x-0 bottom-0 top-14 z-[9998] flex items-start justify-center pt-[15vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Command Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-background/95 backdrop-blur-xl rounded-2xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everything..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="px-2 py-1 text-base font-bold uppercase bg-transparent text-muted-foreground/40">ESC</kbd>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="p-3 space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded-md bg-muted/30 animate-pulse" />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && debouncedQuery && results.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No results for "{debouncedQuery}"
                </p>
              </div>
            )}

            {/* Results - Tree Structure */}
            {!loading && results.length > 0 && (
              <div className="p-1">
                {(() => {
                  // Group results by type
                  const grouped = results.reduce((acc, result) => {
                    if (!acc[result.type]) acc[result.type] = [];
                    acc[result.type].push(result);
                    return acc;
                  }, {} as Record<string, SearchResult[]>);

                  // Define order: pages first, then content
                  const typeOrder = ['page', 'post', 'tutorial', 'music'];
                  const typeLabels = {
                    page: 'Navigation',
                    post: 'Blog', 
                    tutorial: 'Tutorials',
                    music: 'Music'
                  };

                  const typeHrefs = {
                    page: '/',
                    post: '/blog', 
                    tutorial: '/tutorials',
                    music: '/music'
                  };

                  let currentIndex = 0;

                  return typeOrder.map(type => {
                    if (!grouped[type] || grouped[type].length === 0) return null;
                    
                    const parentIndex = currentIndex;
                    currentIndex++;
                    const isParentSelected = parentIndex === selectedIndex;
                    
                    return (
                      <div key={type} className="mb-1 last:mb-0">
                        {/* Parent Category - Clickable */}
                        <Link
                          to={typeHrefs[type as keyof typeof typeHrefs]}
                          onClick={onClose}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors text-sm ${
                            isParentSelected ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                          onMouseEnter={() => setSelectedIndex(parentIndex)}
                        >
                          <div className={`shrink-0 w-5 h-5 rounded-sm flex items-center justify-center ${TYPE_BG[type as keyof typeof TYPE_BG]}`}>
                            {(() => {
                              const ParentIcon = type === 'page' ? Home : TYPE_ICON[type as keyof typeof TYPE_ICON] as any;
                              return <ParentIcon size={11} className={TYPE_COLOR[type as keyof typeof TYPE_COLOR]} />;
                            })()}
                          </div>
                          <span className="font-medium text-sm">{typeLabels[type as keyof typeof typeLabels]}</span>
                          <span className="text-xs text-muted-foreground ml-auto">({grouped[type].length})</span>
                        </Link>
                        
                        {/* Children with Tree Lines */}
                        <div className="ml-2 border-l border-border/30 pl-3 space-y-0.5 mt-0.5">
                          {grouped[type].map((result, groupIndex) => {
                            const childIndex = currentIndex;
                            currentIndex++;
                            const isChildSelected = childIndex === selectedIndex;
                            
                            const IconComponent = result.type === 'page' 
                              ? (TYPE_ICON[result.type] as (href: string) => any)(result.href)
                              : TYPE_ICON[result.type] as any;
                            
                            return (
                              <div key={result.id} className="relative">
                                {/* Tree branch line */}
                                <div className="absolute -left-3 top-2 w-2 h-px bg-border/30" />
                                
                                <Link
                                  to={result.href}
                                  onClick={onClose}
                                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors text-sm ${
                                    isChildSelected ? "bg-accent" : "hover:bg-accent/50"
                                  }`}
                                  onMouseEnter={() => setSelectedIndex(childIndex)}
                                >
                                  <div className={`shrink-0 w-4 h-4 rounded-sm flex items-center justify-center ${TYPE_BG[result.type]}`}>
                                    <IconComponent size={10} className={TYPE_COLOR[result.type]} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs truncate leading-tight">{result.title}</p>
                                  </div>
                                  {/* Consistent right-side metadata for all types */}
                                  <div className="shrink-0 flex items-center gap-1">
                                    {result.tags && result.tags.length > 0 ? (
                                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">
                                        #{result.tags[0]}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 capitalize">
                                        {result.type}
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}