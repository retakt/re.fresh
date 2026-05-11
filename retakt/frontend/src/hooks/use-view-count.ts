import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type ContentTable = 'posts' | 'projects' | 'tutorials' | 'music'

export function useViewCount(id: string | undefined, table: ContentTable, initialCount: number = 0) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    if (initialCount > 0) setCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    if (!id) return
    
    const run = async () => {
      const key = `viewed_${table}_${id}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')

      // Try to increment. If auth fails, the global listener in main.tsx 
      // will handle the logout automatically.
      const { error } = await supabase.rpc('increment_view_count', { p_table: table, p_id: id })
      
      // Silently ignore RPC errors (user might be offline or permission denied)
      // We don't stop the app, we just don't count the view.
      if (error) { 
        // Optional: uncomment next line to see errors in console
        // console.warn('[viewCount] rpc skipped', error.message)
        return
      }
      
      const { data, error: e2 } = await supabase
        .from(table)
        .select('view_count')
        .eq('id', id)
        .single()
      
      if (e2) return
      if (data) setCount(data.view_count)
    };
    
    void run();
  }, [id, table])

  return count
}

export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}