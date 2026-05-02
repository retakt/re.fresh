import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SmoothUIContextMenu, { type ContextMenuItemConfig } from '@/components/ui/smoothui/context-menu';
import { Copy, RotateCcw, ArrowLeft, ArrowRight, Share, MoreHorizontal, FileText, Download } from 'lucide-react';
import { toast } from '@/lib/toast';

const globalContextMenuItems: ContextMenuItemConfig[] = [
  {
    key: 'back',
    label: 'Back',
    icon: <ArrowLeft size={16} />,
    shortcut: 'Alt+←',
    onSelect: () => window.history.back(),
  },
  {
    key: 'forward',
    label: 'Forward', 
    icon: <ArrowRight size={16} />,
    shortcut: 'Alt+→',
    onSelect: () => window.history.forward(),
  },
  {
    key: 'reload',
    label: 'Reload',
    icon: <RotateCcw size={16} />,
    shortcut: 'Ctrl+R',
    onSelect: () => window.location.reload(),
  },
  {
    key: 'separator1',
    separator: true,
  },
  {
    key: 'share',
    label: 'Share Page',
    icon: <Share size={16} />,
    onSelect: async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
        } catch (err) {
          // User cancelled
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("URL copied to clipboard");
      }
    },
  },
  {
    key: 'separator2',
    separator: true,
  },
  {
    key: 'more-tools',
    label: 'More Tools',
    icon: <MoreHorizontal size={16} />,
    children: [
      {
        key: 'copy-url',
        label: 'URL',
        icon: <Copy size={16} />,
        shortcut: 'Ctrl+L',
        onSelect: () => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("URL copied to clipboard");
        },
      },
      {
        key: 'save-page',
        label: 'save As',
        icon: <Download size={16} />,
        shortcut: 'Ctrl+S',
        onSelect: () => {
          const htmlContent = document.documentElement.outerHTML;
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `${document.title || 'page'}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
      },
      {
        key: 'view-source',
        label: 'Source',
        icon: <FileText size={16} />,
        shortcut: 'Ctrl+U',
        onSelect: () => {
          window.open(`view-source:${window.location.href}`, '_blank');
        },
      },
    ],
  },
];

// Global context menu provider that covers the whole page
export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  useEffect(() => {
    if (isChat) return; // Let browser handle context menu on chat page

    // Disable the default browser context menu
    const handleContextMenu = (e: MouseEvent) => {
      // Allow default context menu on form inputs and text areas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]') ||
        target.closest('input') ||
        target.closest('textarea')
      ) {
        return; // Let browser handle these
      }
      
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isChat]);

  // On chat page — render children without the custom context menu wrapper
  if (isChat) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <SmoothUIContextMenu items={globalContextMenuItems}>
      <div className="min-h-screen w-full">
        {children}
      </div>
    </SmoothUIContextMenu>
  );
}

export function useContextMenu() {
  return {
    showContextMenu: () => {},
    hideContextMenu: () => {},
    isOpen: false,
  };
}

export function useCustomContextMenu() {
  return () => {};
}