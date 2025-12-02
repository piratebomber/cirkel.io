import { create } from 'zustand'
import { MediaItem } from '@/types'
import { uploadToFirebase, deleteFromFirebase } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface MediaStore {
  uploads: Record<string, { progress: number; status: 'uploading' | 'processing' | 'complete' | 'error' }>
  mediaLibrary: MediaItem[]
  isLoading: boolean
  
  // Actions
  uploadMedia: (files: File[], onProgress?: (progress: number) => void) => Promise<MediaItem[]>
  deleteMedia: (mediaId: string) => Promise<void>
  fetchMediaLibrary: (userId: string) => Promise<void>
  
  // Audio/Video processing
  processAudio: (file: File) => Promise<MediaItem>
  processVideo: (file: File) => Promise<MediaItem>
  generateThumbnail: (videoFile: File) => Promise<string>
  
  // Live streaming
  startLiveStream: (title: string, description: string) => Promise<string>
  endLiveStream: (streamId: string) => Promise<void>
  
  // Stories
  createStory: (media: MediaItem[], duration: number) => Promise<string>
  deleteStory: (storyId: string) => Promise<void>
  
  // Polls
  createPoll: (question: string, options: string[], duration: number) => Promise<string>
  votePoll: (pollId: string, optionIndex: number) => Promise<void>
  
  // GIF integration
  searchGifs: (query: string) => Promise<any[]>
  uploadGif: (gifUrl: string) => Promise<MediaItem>
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  uploads: {},
  mediaLibrary: [],
  isLoading: false,

  uploadMedia: async (files: File[], onProgress?: (progress: number) => void) => {
    const uploadedMedia: MediaItem[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadId = `upload_${Date.now()}_${i}`
      
      // Initialize upload tracking
      set(state => ({
        uploads: {
          ...state.uploads,
          [uploadId]: { progress: 0, status: 'uploading' }
        }
      }))

      try {
        // Validate file
        if (!validateFile(file)) {
          throw new Error(`Invalid file: ${file.name}`)
        }

        // Upload to Firebase Storage
        const path = `media/${Date.now()}_${file.name}`
        const uploadResult = await uploadToFirebase(file, path)

        // Update progress
        set(state => ({
          uploads: {
            ...state.uploads,
            [uploadId]: { progress: 50, status: 'processing' }
          }
        }))

        // Process media based on type
        let mediaItem: MediaItem
        
        if (file.type.startsWith('image/')) {
          mediaItem = await processImage(file, uploadResult.url)
        } else if (file.type.startsWith('video/')) {
          mediaItem = await get().processVideo(file)
          mediaItem.url = uploadResult.url
        } else if (file.type.startsWith('audio/')) {
          mediaItem = await get().processAudio(file)
          mediaItem.url = uploadResult.url
        } else {
          throw new Error('Unsupported file type')
        }

        // Save to database
        const { data } = await supabase
          .from('media_items')
          .insert({
            ...mediaItem,
            storage_path: path,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        uploadedMedia.push(data)

        // Update progress
        set(state => ({
          uploads: {
            ...state.uploads,
            [uploadId]: { progress: 100, status: 'complete' }
          }
        }))

        onProgress?.(((i + 1) / files.length) * 100)
      } catch (error) {
        console.error('Upload error:', error)
        set(state => ({
          uploads: {
            ...state.uploads,
            [uploadId]: { progress: 0, status: 'error' }
          }
        }))
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    // Clean up upload tracking after delay
    setTimeout(() => {
      set(state => {
        const newUploads = { ...state.uploads }
        Object.keys(newUploads).forEach(key => {
          if (newUploads[key].status === 'complete' || newUploads[key].status === 'error') {
            delete newUploads[key]
          }
        })
        return { uploads: newUploads }
      })
    }, 3000)

    return uploadedMedia
  },

  deleteMedia: async (mediaId: string) => {
    try {
      // Get media info
      const { data: media } = await supabase
        .from('media_items')
        .select('storage_path')
        .eq('id', mediaId)
        .single()

      if (media?.storage_path) {
        // Delete from storage
        await deleteFromFirebase(media.storage_path)
      }

      // Delete from database
      await supabase
        .from('media_items')
        .delete()
        .eq('id', mediaId)

      // Update local state
      set(state => ({
        mediaLibrary: state.mediaLibrary.filter(item => item.id !== mediaId)
      }))

      toast.success('Media deleted successfully')
    } catch (error) {
      console.error('Error deleting media:', error)
      toast.error('Failed to delete media')
    }
  },

  fetchMediaLibrary: async (userId: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('media_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      set({ mediaLibrary: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching media library:', error)
      set({ isLoading: false })
    }
  },

  processAudio: async (file: File) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve({
          id: '',
          type: 'audio',
          url: '',
          width: 0,
          height: 0,
          size: file.size,
          duration: audio.duration,
          altText: file.name
        })
      }
      audio.onerror = reject
      audio.src = URL.createObjectURL(file)
    })
  },

  processVideo: async (file: File) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.onloadedmetadata = async () => {
        const thumbnailUrl = await get().generateThumbnail(file)
        
        resolve({
          id: '',
          type: 'video',
          url: '',
          thumbnailUrl,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          duration: video.duration,
          altText: file.name
        })
      }
      video.onerror = reject
      video.src = URL.createObjectURL(file)
    })
  },

  generateThumbnail: async (videoFile: File) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadeddata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx?.drawImage(video, 0, 0)
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
            const path = `thumbnails/${Date.now()}_thumbnail.jpg`
            const result = await uploadToFirebase(thumbnailFile, path)
            resolve(result.url)
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
        }, 'image/jpeg', 0.8)
      }

      video.onerror = reject
      video.src = URL.createObjectURL(videoFile)
      video.currentTime = 1 // Seek to 1 second for thumbnail
    })
  },

  startLiveStream: async (title: string, description: string) => {
    try {
      const { data } = await supabase
        .from('live_streams')
        .insert({
          title,
          description,
          status: 'live',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      toast.success('Live stream started!')
      return data.id
    } catch (error) {
      console.error('Error starting live stream:', error)
      toast.error('Failed to start live stream')
      throw error
    }
  },

  endLiveStream: async (streamId: string) => {
    try {
      await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId)

      toast.success('Live stream ended')
    } catch (error) {
      console.error('Error ending live stream:', error)
      toast.error('Failed to end live stream')
    }
  },

  createStory: async (media: MediaItem[], duration: number) => {
    try {
      const { data } = await supabase
        .from('stories')
        .insert({
          media,
          duration,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      toast.success('Story created!')
      return data.id
    } catch (error) {
      console.error('Error creating story:', error)
      toast.error('Failed to create story')
      throw error
    }
  },

  deleteStory: async (storyId: string) => {
    try {
      await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      toast.success('Story deleted')
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    }
  },

  createPoll: async (question: string, options: string[], duration: number) => {
    try {
      const { data } = await supabase
        .from('polls')
        .insert({
          question,
          options: options.map(option => ({ text: option, votes: 0 })),
          expires_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      toast.success('Poll created!')
      return data.id
    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error('Failed to create poll')
      throw error
    }
  },

  votePoll: async (pollId: string, optionIndex: number) => {
    try {
      await supabase.rpc('vote_poll', {
        poll_id: pollId,
        option_index: optionIndex
      })

      toast.success('Vote recorded!')
    } catch (error) {
      console.error('Error voting on poll:', error)
      toast.error('Failed to vote')
    }
  },

  searchGifs: async (query: string) => {
    try {
      // Using Giphy API (you'll need to add your API key)
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=YOUR_GIPHY_API_KEY&q=${encodeURIComponent(query)}&limit=20`
      )
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error searching GIFs:', error)
      return []
    }
  },

  uploadGif: async (gifUrl: string) => {
    try {
      // Download and re-upload GIF to our storage
      const response = await fetch(gifUrl)
      const blob = await response.blob()
      const file = new File([blob], 'gif.gif', { type: 'image/gif' })
      
      const path = `gifs/${Date.now()}_gif.gif`
      const result = await uploadToFirebase(file, path)

      const mediaItem: MediaItem = {
        id: '',
        type: 'gif',
        url: result.url,
        width: 0,
        height: 0,
        size: blob.size
      }

      // Save to database
      const { data } = await supabase
        .from('media_items')
        .insert({
          ...mediaItem,
          storage_path: path,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      return data
    } catch (error) {
      console.error('Error uploading GIF:', error)
      throw error
    }
  }
}))

function validateFile(file: File): boolean {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg'
  ]

  if (file.size > maxSize) {
    toast.error('File too large. Maximum size is 100MB.')
    return false
  }

  if (!allowedTypes.includes(file.type)) {
    toast.error('Unsupported file type.')
    return false
  }

  return true
}

async function processImage(file: File, url: string): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        id: '',
        type: 'image',
        url,
        width: img.width,
        height: img.height,
        size: file.size,
        altText: file.name
      })
    }
    img.onerror = reject
    img.src = url
  })
}