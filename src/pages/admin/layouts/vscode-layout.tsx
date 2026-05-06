import React, { useState, useEffect } from 'react';
import { Allotment } from 'allotment';
import { SimpleTerminal } from '@/components/admin/simple-terminal';
import { AdminTilesSimple } from './admin-tiles-simple';

// Notes Panel Component
function NotesPanel() {
  return (
    <div className="w-full h-full p-2">
      <div className="w-full h-full rounded-lg border border-yellow-600/60 shadow-[0_0_10px_rgba(202,138,4,0.2)] bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-center relative overflow-hidden">
        {/* Diagonal lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20 transform rotate-45 origin-left translate-y-12"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20 transform rotate-45 origin-left translate-y-24"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20 transform rotate-45 origin-left translate-y-36"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20 transform -rotate-45 origin-left translate-y-12 translate-x-12"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20 transform -rotate-45 origin-left translate-y-24 translate-x-24"></div>
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm sm:text-lg font-medium z-10">
          Notes Area
        </div>
      </div>
    </div>
  );
}

// Main VSCode Layout Component
export function VSCodeLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('🔍 VSCode Layout - Window width:', window.innerWidth, 'isMobile:', mobile); // Debug log
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  console.log('🎨 VSCode Layout rendering - isMobile:', isMobile); // Debug render

  if (isMobile) {
    // Mobile: Vertical layout - Terminal (50%), Grid (30%), Notes (20%)
    return (
      <div className="w-full h-full">
        <Allotment key="mobile-layout-v2" vertical defaultSizes={[50, 30, 20]}>
          {/* Terminal - Top 50% */}
          <Allotment.Pane minSize={200}>
            <div className="w-full h-full p-1 sm:p-2">
              <div className="w-full h-full rounded-lg overflow-hidden border border-yellow-600/60 shadow-[0_0_10px_rgba(202,138,4,0.2)]">
                <SimpleTerminal />
              </div>
            </div>
          </Allotment.Pane>

          {/* Admin Tiles Grid - Middle 30% */}
          <Allotment.Pane minSize={100}>
            <div className="w-full h-full bg-gray-50/50 dark:bg-gray-900/20">
              <AdminTilesSimple />
            </div>
          </Allotment.Pane>

          {/* Notes - Bottom 20% */}
          <Allotment.Pane minSize={60}>
            <NotesPanel />
          </Allotment.Pane>
        </Allotment>
      </div>
    );
  }

  // Desktop: Original layout - Tiles (35%), Terminal+Notes (65%)
  return (
    <div className="w-full h-full">
      <Allotment vertical defaultSizes={[35, 65]}>
        {/* Top: Admin Tiles Bento Grid */}
        <Allotment.Pane minSize={150}>
          <div className="w-full h-full bg-gray-50/50 dark:bg-gray-900/20">
            <AdminTilesSimple />
          </div>
        </Allotment.Pane>

        {/* Bottom: Terminal (left) + Notes (right) */}
        <Allotment.Pane minSize={200}>
          <Allotment vertical={false} defaultSizes={[75, 25]}>
            {/* Terminal - Bottom Left (75%) */}
            <Allotment.Pane minSize={200}>
              <div className="w-full h-full p-2">
                <div className="w-full h-full rounded-lg overflow-hidden border border-yellow-600/60 shadow-[0_0_10px_rgba(202,138,4,0.2)]">
                  <SimpleTerminal />
                </div>
              </div>
            </Allotment.Pane>

            {/* Notes - Bottom Right (25%) */}
            <Allotment.Pane minSize={150}>
              <NotesPanel />
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
