import { create } from 'zustand'
import { Post, User, MediaItem, EngagementStats } from '@/types'
import { 
  supabase, 
  createPost, 
  getFeedPosts, 
  likePost, 
  unlikePost, 
  repostPost,
  getPostById 
} from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { generateId, processPostContent } from '@/lib/utils'

interface PostStore {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  page: number
  currentPost: Post | null

  // Actions
  fetchFeed: (userId: string, reset?: boolean, algorithm?: string) => Promise<void>
  fetchTrendingPosts: (reset?: boolean) => Promise<void>
  fetchFollowingPosts: (userId: string, reset?: boolean) => Promise<void>
  refreshFeed: (userId: string) => Promise<void>
  createPost: (content: string, media: MediaItem[], visibility: 'public' | 'unlisted' | 'private', communityId?: string) => Promise<void>
  updatePost: (postId: string, updates: Partial<Post>) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  likePost: (postId: string, userId: string) => Promise<void>
  unlikePost: (postId: string, userId: string) => Promise<void>
  repostPost: (postId: string, userId: string, comment?: string) => Promise<void>
  unrepostPost: (postId: string, userId: string) => Promise<void>
  fetchPost: (postId: string) => Promise<void>
  
  // Local state updates
  addPost: (post: Post) => void
  updatePostInStore: (postId: string, updates: Partial<Post>) => void
  removePost: (postId: string) => void
  
  // Engagement
  incrementViews: (postId: string) => void
  updateEngagement: (postId: string, engagement: Partial<EngagementStats>) => void
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  page: 0,
  currentPost: null,

  fetchFeed: async (userId: string, reset = false, algorithm = 'algorithm') => {
    const { isLoading, page } = get()
    if (isLoading) return

    set({ isLoading: true })

    try {
      const currentPage = reset ? 0 : page
      
      // Fetch posts based on algorithm
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          likes:post_likes(count),
          reposts:post_reposts(count),
          comments:post_comments(count),
          media:post_media(*),
          user_like:post_likes!inner(user_id),
          user_repost:post_reposts!inner(user_id)
        `)
        .eq('visibility', 'public')
        .neq('is_deleted', true)

      // Apply algorithm-specific filtering
      if (algorithm === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else if (algorithm === 'trending') {
        query = query
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('engagement_score', { ascending: false })
      } else {
        // Default algorithm - mix of recency and engagement
        query = query.order('algorithm_score', { ascending: false })
      }

      const { data, error } = await query
        .range(currentPage * 20, (currentPage + 1) * 20 - 1)

      if (error) throw error

      // Process posts
      const processedPosts = data.map(post => ({
        ...post,
        isLiked: post.user_like?.some((like: any) => like.user_id === userId) || false,
        isReposted: post.user_repost?.some((repost: any) => repost.user_id === userId) || false,
      }))

      set(state => ({
        posts: reset ? processedPosts : [...state.posts, ...processedPosts],
        hasMore: data.length === 20,
        page: currentPage + 1,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error fetching feed:', error)
      toast.error('Failed to load posts')
      set({ isLoading: false })
    }
  },

  fetchTrendingPosts: async (reset = false) => {
    const { isLoading, page } = get()
    if (isLoading) return

    set({ isLoading: true })

    try {
      const currentPage = reset ? 0 : page
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

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
        .eq('visibility', 'public')
        .neq('is_deleted', true)
        .gte('created_at', twentyFourHoursAgo)
        .order('engagement_score', { ascending: false })
        .range(currentPage * 20, (currentPage + 1) * 20 - 1)

      if (error) throw error

      set(state => ({
        posts: reset ? data : [...state.posts, ...data],
        hasMore: data.length === 20,
        page: currentPage + 1,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error fetching trending posts:', error)
      toast.error('Failed to load trending posts')
      set({ isLoading: false })
    }
  },

  fetchFollowingPosts: async (userId: string, reset = false) => {
    const { isLoading, page } = get()
    if (isLoading) return

    set({ isLoading: true })

    try {
      const currentPage = reset ? 0 : page

      // Get posts from followed users
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          likes:post_likes(count),
          reposts:post_reposts(count),
          comments:post_comments(count),
          media:post_media(*),
          user_like:post_likes!inner(user_id),
          user_repost:post_reposts!inner(user_id)
        `)
        .in('author_id', 
          supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId)
        )
        .eq('visibility', 'public')
        .neq('is_deleted', true)
        .order('created_at', { ascending: false })
        .range(currentPage * 20, (currentPage + 1) * 20 - 1)

      if (error) throw error

      const processedPosts = data.map(post => ({
        ...post,
        isLiked: post.user_like?.some((like: any) => like.user_id === userId) || false,
        isReposted: post.user_repost?.some((repost: any) => repost.user_id === userId) || false,
      }))

      set(state => ({
        posts: reset ? processedPosts : [...state.posts, ...processedPosts],
        hasMore: data.length === 20,
        page: currentPage + 1,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error fetching following posts:', error)
      toast.error('Failed to load posts from following')
      set({ isLoading: false })
    }
  },

  refreshFeed: async (userId: string) => {
    set({ posts: [], page: 0, hasMore: true })
    await get().fetchFeed(userId, true)
  },

  createPost: async (content: string, media: MediaItem[], visibility: 'public' | 'unlisted' | 'private', communityId?: string) => {
    try {
      const { hashtags, mentions } = processPostContent(content)
      
      const postData = {
        id: generateId(),
        content,
        media,
        visibility,
        hashtags,
        mentions,
        community_id: communityId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        views: 0,
        engagement: {
          likes: 0,
          reposts: 0,
          comments: 0,
          views: 0,
          shares: 0,
          saves: 0,
          clickThroughRate: 0,
          engagementRate: 0,
        },
      }

      const newPost = await createPost(postData)
      
      // Add to local state if public
      if (visibility === 'public') {
        get().addPost(newPost)
      }

      toast.success('Post created successfully!')
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast.error(error.message || 'Failed to create post')
      throw error
    }
  },

  updatePost: async (postId: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          is_edited: true,
        })
        .eq('id', postId)

      if (error) throw error

      get().updatePostInStore(postId, { ...updates, isEdited: true })
      toast.success('Post updated successfully!')
    } catch (error: any) {
      console.error('Error updating post:', error)
      toast.error(error.message || 'Failed to update post')
      throw error
    }
  },

  deletePost: async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId)

      if (error) throw error

      get().removePost(postId)
      toast.success('Post deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting post:', error)
      toast.error(error.message || 'Failed to delete post')
      throw error
    }
  },

  likePost: async (postId: string, userId: string) => {
    try {
      await likePost(postId, userId)
      
      // Update local state optimistically
      get().updatePostInStore(postId, {
        likes: [...(get().posts.find(p => p.id === postId)?.likes || []), { 
          id: generateId(), 
          userId, 
          postId, 
          createdAt: new Date() 
        }],
      })
    } catch (error: any) {
      console.error('Error liking post:', error)
      toast.error('Failed to like post')
    }
  },

  unlikePost: async (postId: string, userId: string) => {
    try {
      await unlikePost(postId, userId)
      
      // Update local state optimistically
      const post = get().posts.find(p => p.id === postId)
      if (post) {
        get().updatePostInStore(postId, {
          likes: post.likes.filter(like => like.userId !== userId),
        })
      }
    } catch (error: any) {
      console.error('Error unliking post:', error)
      toast.error('Failed to unlike post')
    }
  },

  repostPost: async (postId: string, userId: string, comment?: string) => {
    try {
      await repostPost(postId, userId, comment)
      
      // Update local state optimistically
      get().updatePostInStore(postId, {
        reposts: [...(get().posts.find(p => p.id === postId)?.reposts || []), {
          id: generateId(),
          userId,
          postId,
          comment,
          createdAt: new Date(),
        }],
      })

      toast.success('Post reposted!')
    } catch (error: any) {
      console.error('Error reposting:', error)
      toast.error('Failed to repost')
    }
  },

  unrepostPost: async (postId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('post_reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) throw error

      // Update local state optimistically
      const post = get().posts.find(p => p.id === postId)
      if (post) {
        get().updatePostInStore(postId, {
          reposts: post.reposts.filter(repost => repost.userId !== userId),
        })
      }
    } catch (error: any) {
      console.error('Error unreposting:', error)
      toast.error('Failed to unrepost')
    }
  },

  fetchPost: async (postId: string) => {
    try {
      const post = await getPostById(postId)
      set({ currentPost: post })
    } catch (error: any) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load post')
    }
  },

  addPost: (post: Post) => {
    set(state => ({
      posts: [post, ...state.posts],
    }))
  },

  updatePostInStore: (postId: string, updates: Partial<Post>) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      ),
      currentPost: state.currentPost?.id === postId 
        ? { ...state.currentPost, ...updates }
        : state.currentPost,
    }))
  },

  removePost: (postId: string) => {
    set(state => ({
      posts: state.posts.filter(post => post.id !== postId),
      currentPost: state.currentPost?.id === postId ? null : state.currentPost,
    }))
  },

  incrementViews: (postId: string) => {
    // Increment views optimistically
    get().updatePostInStore(postId, {
      views: (get().posts.find(p => p.id === postId)?.views || 0) + 1,
    })

    // Update in database (fire and forget)
    supabase
      .from('posts')
      .update({ views: supabase.sql`views + 1` })
      .eq('id', postId)
      .then()
  },

  updateEngagement: (postId: string, engagement: Partial<EngagementStats>) => {
    const post = get().posts.find(p => p.id === postId)
    if (post) {
      get().updatePostInStore(postId, {
        engagement: { ...post.engagement, ...engagement },
      })
    }
  },
}))