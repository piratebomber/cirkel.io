'use client'

import { useState, useEffect } from 'react'
import { useMessagingStore } from '@/store/messagingStore'
import { useAuth } from '@/components/providers/AuthProvider'
import { CallInterface } from './CallInterface'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { X, Send, Smile, Paperclip, Search } from 'lucide-react'

interface MessagingPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function MessagingPanel({ isOpen, onClose }: MessagingPanelProps) {
  const { user } = useAuth()
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    fetchConversations,
    fetchMessages,
    sendMessage
  } = useMessagingStore()

  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && user && !user.isGuest) {
      fetchConversations(user.id)
    }
  }, [isOpen, user])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    try {
      await sendMessage(activeConversation.id, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleConversationSelect = async (conversation: any) => {
    await fetchMessages(conversation.id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[80vh] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : conversations.length > 0 ? (
              conversations
                .filter(conv => 
                  !searchQuery || 
                  conv.participants?.some(p => 
                    p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
                .map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                      activeConversation?.id === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={conversation.participants?.[0]?.profilePicture}
                        alt={conversation.participants?.[0]?.displayName || 'User'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {conversation.name || conversation.participants?.[0]?.displayName || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-cirkel-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={activeConversation.participants?.[0]?.profilePicture}
                    alt={activeConversation.participants?.[0]?.displayName || 'User'}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-semibold">
                      {activeConversation.name || activeConversation.participants?.[0]?.displayName || 'Unknown'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.participants?.length > 2 
                        ? `${activeConversation.participants.length} participants`
                        : 'Direct message'
                      }
                    </p>
                  </div>
                </div>
                
                <CallInterface 
                  conversationId={activeConversation.id}
                  participants={activeConversation.participants || []}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.senderId === user?.id ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar
                      src={message.sender?.profilePicture}
                      alt={message.sender?.displayName || 'User'}
                      size="sm"
                    />
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-cirkel-500 text-white ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user?.id ? 'text-cirkel-100' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}