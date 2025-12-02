import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Database schema types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Real-time subscriptions
export const subscribeToUserUpdates = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`,
    }, callback)
    .subscribe()
}

export const subscribeToPostUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('posts')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts',
    }, callback)
    .subscribe()
}

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe()
}

export const subscribeToMessages = (conversationId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, callback)
    .subscribe()
}

// Storage helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

// Auth helpers
export const signUp = async (email: string, password: string, metadata: any = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const updateUserProfile = async (updates: any) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  })

  if (error) throw error
  return data
}

// Database queries
export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const getUserByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error) throw error
  return data
}

export const createPost = async (post: any) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getPostById = async (id: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(*),
      likes:post_likes(count),
      reposts:post_reposts(count),
      comments:post_comments(count),
      media:post_media(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const getFeedPosts = async (userId: string, page = 0, limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(*),
      likes:post_likes(count),
      reposts:post_reposts(count),
      comments:post_comments(count),
      media:post_media(*)
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) throw error
  return data
}

export const likePost = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error
}

export const repostPost = async (postId: string, userId: string, comment?: string) => {
  const { data, error } = await supabase
    .from('post_reposts')
    .insert({ 
      post_id: postId, 
      user_id: userId,
      comment: comment || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()

  if (error) throw error
  return data
}

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}

export const searchUsers = async (query: string, limit = 10) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit)

  if (error) throw error
  return data
}

export const searchPosts = async (query: string, limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(*),
      likes:post_likes(count),
      reposts:post_reposts(count),
      comments:post_comments(count)
    `)
    .textSearch('content', query)
    .limit(limit)

  if (error) throw error
  return data
}

export const getTrendingHashtags = async (limit = 10) => {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .order('trending_score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const createNotification = async (notification: any) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) throw error
  return data
}

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

export const getUserNotifications = async (userId: string, page = 0, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:users(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) throw error
  return data
}