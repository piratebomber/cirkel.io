'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { usePostStore } from '@/store/postStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { MediaUpload } from './MediaUpload'
import { VisibilitySelector } from './VisibilitySelector'
import { CommunitySelector } from './CommunitySelector'
import { MediaItem } from '@/types'
import { 
  Image as ImageIcon, 
  Video, 
  Smile, 
  MapPin, 
  Calendar,
  Hash,
  AtSign
} from 'lucide-react'

interface CreatePostFormProps {
  replyToId?: string
  communityId?: string
  onSuccess?: () => void
}

export function CreatePostForm({ replyToId, communityId, onSuccess }: CreatePostFormProps) {
  const { user, isGuest } = useAuth()
  const { createPost, isLoading } = usePostStore()
  
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public')
  const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>(communityId)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const maxLength = 280

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && media.length === 0) return
    if (isGuest) return

    try {
      await createPost(content.trim(), media, visibility, selectedCommunity)
      
      // Reset form
      setContent('')
      setMedia([])
      setVisibility('public')
      setSelectedCommunity(communityId)
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setContent(value)
      
      // Auto-resize textarea
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  const handleMediaAdd = (newMedia: MediaItem[]) => {
    setMedia(prev => [...prev, ...newMedia])
    setShowMediaUpload(false)
  }

  const handleMediaRemove = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const insertAtCursor = (text: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newContent = content.substring(0, start) + text + content.substring(end)
      
      if (newContent.length <= maxLength) {
        setContent(newContent)
        
        // Set cursor position after inserted text
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + text.length
            textareaRef.current.selectionEnd = start + text.length
            textareaRef.current.focus()
          }
        }, 0)
      }
    }
  }

  const handleHashtagClick = () => {
    insertAtCursor('#')
  }

  const handleMentionClick = () => {
    insertAtCursor('@')
  }

  const canPost = (content.trim() || media.length > 0) && !isLoading && !isGuest
  const remainingChars = maxLength - content.length
  const isOverLimit = remainingChars < 0

  if (isGuest) {
    return (
      <div className="p-4 border-b border-border">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Sign in to create posts and join the conversation</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/auth/register'}>
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-border">
      <div className="flex gap-3">
        <Avatar
          src={user?.profilePicture}
          alt={user?.displayName || ''}
          size="md"
          verified={user?.isVerified}
        />

        <div className="flex-1 space-y-3">
          {/* Community selector */}
          {!replyToId && (
            <CommunitySelector
              value={selectedCommunity}
              onChange={setSelectedCommunity}
            />
          )}

          {/* Text input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder={replyToId ? "Post your reply" : "What's happening?"}
              className="w-full resize-none border-none outline-none bg-transparent text-xl placeholder:text-muted-foreground min-h-[120px]"
              rows={3}
            />
            
            {/* Character count */}
            <div className={`
              absolute bottom-2 right-2 text-sm
              ${isOverLimit ? 'text-destructive' : remainingChars < 20 ? 'text-yellow-600' : 'text-muted-foreground'}
            `}>
              {remainingChars}
            </div>
          </div>

          {/* Media preview */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {media.map((item, index) => (
                <div key={index} className="relative group">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.altText || ''}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleMediaRemove(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media upload */}
          {showMediaUpload && (
            <MediaUpload
              onUpload={handleMediaAdd}
              onClose={() => setShowMediaUpload(false)}
              maxFiles={4 - media.length}
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              {/* Media upload button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                disabled={media.length >= 4}
                className="text-cirkel-500 hover:bg-cirkel-50"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>

              {/* Video upload button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                disabled={media.length >= 4}
                className="text-cirkel-500 hover:bg-cirkel-50"
              >
                <Video className="w-5 h-5" />
              </Button>

              {/* Emoji button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-cirkel-500 hover:bg-cirkel-50"
              >
                <Smile className="w-5 h-5" />
              </Button>

              {/* Hashtag button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleHashtagClick}
                className="text-cirkel-500 hover:bg-cirkel-50"
              >
                <Hash className="w-5 h-5" />
              </Button>

              {/* Mention button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMentionClick}
                className="text-cirkel-500 hover:bg-cirkel-50"
              >
                <AtSign className="w-5 h-5" />
              </Button>

              {/* Location button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-cirkel-500 hover:bg-cirkel-50"
                disabled
              >
                <MapPin className="w-5 h-5" />
              </Button>

              {/* Schedule button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-cirkel-500 hover:bg-cirkel-50"
                disabled
              >
                <Calendar className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* Visibility selector */}
              <VisibilitySelector
                value={visibility}
                onChange={setVisibility}
              />

              {/* Post button */}
              <Button
                type="submit"
                disabled={!canPost || isOverLimit}
                loading={isLoading}
                className="px-6"
              >
                {replyToId ? 'Reply' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}