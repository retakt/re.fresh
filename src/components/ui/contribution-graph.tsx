import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ContributionData {
  date: string; // YYYY-MM-DD format
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style levels
}

interface ContributionGraphProps {
  data: ContributionData[];
  year?: number;
  className?: string;
  colorScheme?: 'green' | 'blue' | 'purple' | 'orange';
}

const COLOR_SCHEMES = {
  green: {
    0: 'bg-gray-100 dark:bg-gray-800',
    1: 'bg-green-100 dark:bg-green-900/30',
    2: 'bg-green-300 dark:bg-green-700/50',
    3: 'bg-green-500 dark:bg-green-600/70',
    4: 'bg-green-700 dark:bg-green-500',
  },
  blue: {
    0: 'bg-gray-100 dark:bg-gray-800',
    1: 'bg-blue-100 dark:bg-blue-900/30',
    2: 'bg-blue-300 dark:bg-blue-700/50',
    3: 'bg-blue-500 dark:bg-blue-600/70',
    4: 'bg-blue-700 dark:bg-blue-500',
  },
  purple: {
    0: 'bg-gray-100 dark:bg-gray-800',
    1: 'bg-purple-100 dark:bg-purple-900/30',
    2: 'bg-purple-300 dark:bg-purple-700/50',
    3: 'bg-purple-500 dark:bg-purple-600/70',
    4: 'bg-purple-700 dark:bg-purple-500',
  },
  orange: {
    0: 'bg-gray-100 dark:bg-gray-800',
    1: 'bg-orange-100 dark:bg-orange-900/30',
    2: 'bg-orange-300 dark:bg-orange-700/50',
    3: 'bg-orange-500 dark:bg-orange-600/70',
    4: 'bg-orange-700 dark:bg-orange-500',
  },
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ContributionGraph({ 
  data, 
  year = new Date().getFullYear(), 
  className,
  colorScheme = 'green' 
}: ContributionGraphProps) {
  const shouldReduceMotion = useReducedMotion();
  const colors = COLOR_SCHEMES[colorScheme];

  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Find the first Sunday of the year or before
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());
    
    const weeks: Array<Array<{ date: Date; data?: ContributionData }>> = [];
    const monthLabels: Array<{ month: string; colIndex: number }> = [];
    
    let currentDate = new Date(firstSunday);
    let weekIndex = 0;
    let lastMonth = -1;
    
    while (currentDate <= endDate || weeks[weekIndex]?.length < 7) {
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = [];
      }
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = data.find(d => d.date === dateStr);
      
      weeks[weekIndex].push({
        date: new Date(currentDate),
        data: dayData
      });
      
      // Track month labels
      if (currentDate.getMonth() !== lastMonth && currentDate.getDate() <= 7) {
        monthLabels.push({
          month: MONTHS[currentDate.getMonth()],
          colIndex: weekIndex
        });
        lastMonth = currentDate.getMonth();
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (weeks[weekIndex].length === 7) {
        weekIndex++;
      }
    }
    
    return { weeks, monthLabels };
  }, [data, year]);

  const formatTooltip = (date: Date, count?: number) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (count === undefined) {
      return `No contributions on ${dateStr}`;
    }
    
    return `${count} contribution${count !== 1 ? 's' : ''} on ${dateStr}`;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <table className="contribution-graph">
          <caption className="sr-only">
            Contribution Graph for {year}
          </caption>
          
          <thead>
            <tr>
              <td className="w-8"></td>
              {monthLabels.map((label, index) => (
                <th
                  key={`${label.month}-${index}`}
                  className="text-xs font-normal text-gray-600 dark:text-gray-400 text-left px-0"
                  style={{
                    gridColumnStart: label.colIndex + 2,
                    gridColumnEnd: 'span 4'
                  }}
                >
                  {label.month}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {DAYS.map((day, dayIndex) => (
              <tr key={day}>
                <th className="text-xs font-normal text-gray-600 dark:text-gray-400 text-right pr-2 w-8">
                  {dayIndex % 2 === 0 ? day : ''}
                </th>
                {weeks.map((week, weekIndex) => {
                  const dayData = week[dayIndex];
                  if (!dayData) return <td key={`empty-${weekIndex}`} />;
                  
                  const level = dayData.data?.level ?? 0;
                  const count = dayData.data?.count ?? 0;
                  
                  return (
                    <td key={`${weekIndex}-${dayIndex}`} className="p-0">
                      <motion.div
                        className={cn(
                          'w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700',
                          colors[level],
                          'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 cursor-pointer'
                        )}
                        title={formatTooltip(dayData.date, dayData.data?.count)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.2,
                          delay: shouldReduceMotion ? 0 : (weekIndex * 0.01),
                        }}
                        whileHover={shouldReduceMotion ? {} : { scale: 1.2 }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700',
                colors[level as keyof typeof colors]
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// Utility function to generate sample data
export function generateSampleContributionData(year: number = new Date().getFullYear()): ContributionData[] {
  const data: ContributionData[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate random contribution data (you can replace this with real data)
    const random = Math.random();
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    
    if (random > 0.7) {
      count = Math.floor(Math.random() * 20) + 1;
      if (count >= 15) level = 4;
      else if (count >= 10) level = 3;
      else if (count >= 5) level = 2;
      else level = 1;
    }
    
    if (count > 0) {
      data.push({
        date: dateStr,
        count,
        level
      });
    }
  }
  
  return data;
}