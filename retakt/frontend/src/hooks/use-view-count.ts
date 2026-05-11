import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureValidSession } from '@/lib/auth-guard'

type ContentTable = 'posts' | 'tutorials' | 'music'

/**
 * Increments view_count once per browser session, then returns the live count.
 * Uses sessionStorage so refreshing the same page doesn't spam the counter.
 */
export function useViewCount(id: string | undefined, table: ContentTable, initialCount: number = 0) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    if (initialCount > 0) setCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    if (!id) return
    
    // Ensure session is valid before querying
    const run = async () => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        console.error('[useViewCount] Session invalid, bailing');
        return;
      }

      const key = `viewed_${table}_${id}`

      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')

      const { error } = await supabase
        .rpc('increment_view_count', { p_table: table, p_id: id })
      
      if (error) { 
        console.error('[viewCount] rpc error', error); 
        return; 
      }
      
      const { data, error: e2 } = await supabase
        .from(table)
        .select('view_count')
        .eq('id', id)
        .single()
      
      if (e2) { 
        console.error('[viewCount] select error', e2); 
        return; 
      }
      
      if (data) setCount(data.view_count)
    };
    
    void run();
  }, [id, table])

  return count
}

/** Format a raw number into a compact display string: 1200 → "1.2k" */
export function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}
