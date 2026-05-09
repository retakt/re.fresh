import { useState, useEffect } from 'react';
import { Allotment } from 'allotment';
import { SimpleTerminal } from '@/components/admin/simple-terminal';
import { AdminTilesSimple } from './admin-tiles-simple';
import 'allotment/dist/style.css';
import './vscode-layout.css';

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
    // Mobile: Vertical layout - Terminal (65%) and Grid (35%)
    return (
      <div className="w-full h-full">
        <Allotment key="mobile-layout-v2" vertical defaultSizes={[65, 35]} separator={false}>
          {/* Terminal - Top 65% */}
          <Allotment.Pane minSize={200}>
            <div className="w-full h-full p-1 sm:p-2">
              <div className="w-full h-full rounded-lg overflow-hidden border border-yellow-600/60 shadow-[0_0_10px_rgba(202,138,4,0.2)]">
                <SimpleTerminal />
              </div>
            </div>
          </Allotment.Pane>

          {/* Admin Tiles Grid - Bottom 35% */}
          <Allotment.Pane minSize={100}>
            <div className="w-full h-full bg-gray-50/50 dark:bg-gray-900/20">
              <AdminTilesSimple />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    );
  }

  // Desktop: Tiles (35%) and Terminal (65%)
  return (
    <div className="w-full h-full">
      <Allotment vertical defaultSizes={[35, 65]} separator={false}>
        {/* Top: Admin Tiles Bento Grid */}
        <Allotment.Pane minSize={150}>
          <div className="w-full h-full bg-gray-50/50 dark:bg-gray-900/20">
            <AdminTilesSimple />
          </div>
        </Allotment.Pane>

        {/* Bottom: Terminal */}
        <Allotment.Pane minSize={200}>
          <div className="w-full h-full p-2">
            <div className="w-full h-full rounded-lg overflow-hidden border border-yellow-600/60 shadow-[0_0_10px_rgba(202,138,4,0.2)]">
              <SimpleTerminal />
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
