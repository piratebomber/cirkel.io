'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useSocket } from '@/components/providers/SocketProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { MediaGrid } from './MediaGrid'
import { PostEngagement } from './PostEngagement'
import { Post } from '@/types'
import { formatDate, formatNumber, generatePostUrl } from '@/lib/utils'
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  MoreHorizontal,
  Eye,
  Bookmark,
  Flag,
  Trash2,
  Edit,
  Lock,
  Globe,
  EyeOff
} from 'lucide-react'

interface PostCardProps {
  post: Post
  showThread?: boolean
  isReply?: boolean
}

export function PostCard({ post, showThread = false, isReply = false }: PostCardProps) {
  const { user, isGuest } = useAuth()
  const { emit } = useSocket()
  const router = useRouter()
  const [hasViewed, setHasViewed] = useState(false)

  useEffect(() => {
    // Track view after 2 seconds of being visible
    const timer = setTimeout(() => {
      if (!hasViewed) {
        setHasViewed(true)
        emit('post_viewed', { postId: post.id, userId: user?.id })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [post.id, user?.id, hasViewed, emit])

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) {
      return
    }
    
    router.push(generatePostUrl(post.id))
  }

  const handleShare = async () => {
    const url = `${window.location.origin}${generatePostUrl(post.id)}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.displayName}`,
          text: post.content.substring(0, 100) + '...',
          url,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      // toast.success('Link copied to clipboard')
    }
  }

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <Globe className="w-3 h-3" />
      case 'unlisted':
        return <EyeOff className="w-3 h-3" />
      case 'private':
        return <Lock className="w-3 h-3" />
      default:
        return <Globe className="w-3 h-3" />
    }
  }

  const getVisibilityColor = () => {
    switch (post.visibility) {
      case 'public':
        return 'text-green-600'
      case 'unlisted':
        return 'text-yellow-600'
      case 'private':
        return 'text-red-600'
      default:
        return 'text-green-600'
    }
  }

  const canEdit = user?.id === post.authorId && !isGuest
  const canDelete = user?.id === post.authorId && !isGuest

  const dropdownItems = [
    ...(canEdit ? [{
      label: 'Edit Post',
      icon: Edit,
      onClick: () => router.push(`/post/${post.id}/edit`),
    }] : []),
    ...(canDelete ? [{
      label: 'Delete Post',
      icon: Trash2,
      onClick: () => {
        // Handle delete
      },
      variant: 'destructive' as const,
    }] : []),
    ...(!isGuest ? [{
      label: 'Bookmark',
      icon: Bookmark,
      onClick: () => {
        // Handle bookmark
      },
    }] : []),
    {
      label: 'Share',
      icon: Share,
      onClick: handleShare,
    },
    ...(!isGuest && user?.id !== post.authorId ? [{
      label: 'Report',
      icon: Flag,
      onClick: () => {
        // Handle report
      },
      variant: 'destructive' as const,
    }] : []),
  ]

  return (
    <article 
      className={`
        border-b border-border hover:bg-accent/30 transition-colors cursor-pointer
        ${isReply ? 'pl-12' : ''}
      `}
      onClick={handlePostClick}
    >
      <div className="p-4">
        {/* Repost indicator */}
        {post.reposts && post.reposts.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Repeat2 className="w-4 h-4" />
            <span>
              {post.reposts[0].user?.displayName} reposted
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {/* Avatar */}
          <Link href={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
            <Avatar
              src={post.author.profilePicture}
              alt={post.author.displayName}
              size="md"
              verified={post.author.isVerified}
            />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/profile/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                <span className="font-semibold">{post.author.displayName}</span>
              </Link>
              
              <Link 
                href={`/profile/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:underline"
              >
                <span>@{post.author.username}</span>
              </Link>

              <span className="text-muted-foreground">·</span>
              
              <time 
                className="text-muted-foreground hover:underline"
                dateTime={post.createdAt.toISOString()}
                title={post.createdAt.toLocaleString()}
              >
                {formatDate(post.createdAt)}
              </time>

              {/* Visibility indicator */}
              <div className={`flex items-center gap-1 ${getVisibilityColor()}`}>
                {getVisibilityIcon()}
              </div>

              {/* Edit indicator */}
              {post.isEdited && (
                <span className="text-xs text-muted-foreground">edited</span>
              )}

              {/* More options */}
              <div className="ml-auto">
                <DropdownMenu
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 hover:bg-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  }
                  items={dropdownItems}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {/* Text content */}
              <div 
                className="text-foreground whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: post.content.replace(
                    /#(\w+)/g, 
                    '<a href="/hashtag/$1" class="hashtag">#$1</a>'
                  ).replace(
                    /@(\w+)/g,
                    '<a href="/profile/$1" class="mention">@$1</a>'
                  )
                }}
              />

              {/* Media */}
              {post.media && post.media.length > 0 && (
                <MediaGrid media={post.media} />
              )}

              {/* Community context */}
              {post.community && (
                <Link 
                  href={`/community/${post.community.name}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm text-cirkel-500 hover:underline"
                >
                  in {post.community.displayName}
                </Link>
              )}
            </div>

            {/* Engagement */}
            <PostEngagement post={post} />

            {/* Analytics for author */}
            {user?.id === post.authorId && (
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatNumber(post.views)} views</span>
                </div>
                {post.engagement && (
                  <div>
                    {post.engagement.engagementRate.toFixed(1)}% engagement
                  </div>
                )}
              </div>
            )}

            {/* Thread indicator */}
            {showThread && post.replyToId && (
              <div className="mt-2">
                <Link 
                  href={generatePostUrl(post.replyToId)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-cirkel-500 hover:underline"
                >
                  Show this thread
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}