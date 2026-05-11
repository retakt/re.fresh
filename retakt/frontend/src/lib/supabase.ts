import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "retakt-auth",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // Better for SPAs - prevents token exchange issues
  },
  global: {
    headers: {
      'x-client-info': 'retakt-web',
    },
  },
})

/**
 * Validate and recover from corrupted session on startup.
 * This runs once when the app loads to ensure we don't start with a bad session.
 */
async function validateSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // No session exists, that's OK for public pages
      return;
    }
    
    // Test that we can actually use the session by attempting a refresh
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('[AUTH] Session validation failed - clearing corrupted session:', error.message);
      await supabase.auth.signOut();
    } else {
      console.log('[AUTH] Session validated successfully');
    }
  } catch (err) {
    console.error('[AUTH] Session recovery failed:', err instanceof Error ? err.message : err);
  }
}

// Run session validation on startup (browser only)
if (typeof window !== 'undefined') {
  void validateSession();
}

export type Post = {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  cover_image: string | null
  cover_image_position: string | null
  cover_image_opacity: number | null
  tags: string[]
  published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export type Music = {
  id: string
  title: string
  artist: string | null
  album: string | null
  genre: string | null
  tags: string[]
  year: number | null
  release_type: 'single' | 'album' | 'ep'
  spotify_url: string | null
  soundcloud_url: string | null
  youtube_url: string | null
  audio_url: string | null
  cover_image: string | null
  description: string | null
  album_description: string | null
  published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export type Tutorial = {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  category: string | null
  difficulty: string | null
  cover_image: string | null
  tags: string[]
  published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export type FileItem = {
  id: string
  name: string
  description: string | null
  file_url: string | null
  file_type: string | null
  file_size: string | null
  category: string | null
  published: boolean
  created_at: string
}

export type Profile = {
  id: string
  email: string | null
  username?: string | null
  avatar_url?: string | null
  role: 'admin' | 'editor' | 'member'
  terminal_key?: string | null
  created_at: string
}

export type ProfileAvatarHistory = {
  id: string
  user_id: string
  avatar_url: string
  storage_path: string
  is_active: boolean
  created_at: string
}

export type CommentAttachment = {
  name: string
  url: string
  mimeType: string
  size: number
}

export type CommentVote = {
  id: string
  comment_id: string
  user_id: string
  vote: 1 | -1
  created_at: string
}

export type PostComment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  anchor_id: string | null
  anchor_label: string | null
  body: string
  attachments: CommentAttachment[]
  created_at: string
  updated_at: string
}
