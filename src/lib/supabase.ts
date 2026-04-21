import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Post = {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  cover_image: string | null
  published: boolean
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
  published: boolean
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
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  cover_image: string | null
  published: boolean
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
  created_at: string
}
