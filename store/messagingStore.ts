import { create } from 'zustand'
import { Message, Conversation, User } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface MessagingStore {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  typingUsers: string[]
  
  // Actions
  fetchConversations: (userId: string) => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string, media?: any[]) => Promise<void>
  createConversation: (participantIds: string[]) => Promise<string>
  markAsRead: (conversationId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  
  // Real-time
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setTyping: (userId: string, isTyping: boolean) => void
  
  // Group chats
  addParticipant: (conversationId: string, userId: string) => Promise<void>
  removeParticipant: (conversationId: string, userId: string) => Promise<void>
  updateGroupName: (conversationId: string, name: string) => Promise<void>
}

export const useMessagingStore = create<MessagingStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  typingUsers: [],

  fetchConversations: async (userId: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:users(*)
          ),
          last_message:messages(*)
        `)
        .contains('participant_ids', [userId])
        .order('last_activity', { ascending: false })

      set({ conversations: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching conversations:', error)
      set({ isLoading: false })
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(*),
          reply_to:messages(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      set({ messages: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching messages:', error)
      set({ isLoading: false })
    }
  },

  sendMessage: async (conversationId: string, content: string, media = []) => {
    try {
      const { data } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          media,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:users(*)
        `)
        .single()

      // Update conversation last activity
      await supabase
        .from('conversations')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', conversationId)

      get().addMessage(data)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  },

  createConversation: async (participantIds: string[]) => {
    try {
      const { data } = await supabase
        .from('conversations')
        .insert({
          participant_ids: participantIds,
          is_group: participantIds.length > 2,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select()
        .single()

      // Add participants
      const participants = participantIds.map(userId => ({
        conversation_id: data.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      }))

      await supabase
        .from('conversation_participants')
        .insert(participants)

      return data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }))
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  },

  editMessage: async (messageId: string, content: string) => {
    try {
      await supabase
        .from('messages')
        .update({ 
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      get().updateMessage(messageId, { content, isEdited: true })
    } catch (error) {
      console.error('Error editing message:', error)
      toast.error('Failed to edit message')
    }
  },

  addMessage: (message: Message) => {
    set(state => ({
      messages: [...state.messages, message]
    }))
  },

  updateMessage: (messageId: string, updates: Partial<Message>) => {
    set(state => ({
      messages: state.messages.map(m => 
        m.id === messageId ? { ...m, ...updates } : m
      )
    }))
  },

  setTyping: (userId: string, isTyping: boolean) => {
    set(state => ({
      typingUsers: isTyping 
        ? [...state.typingUsers.filter(id => id !== userId), userId]
        : state.typingUsers.filter(id => id !== userId)
    }))
  },

  addParticipant: async (conversationId: string, userId: string) => {
    try {
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          joined_at: new Date().toISOString()
        })

      // Update participant_ids array
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single()

      if (conversation) {
        await supabase
          .from('conversations')
          .update({
            participant_ids: [...conversation.participant_ids, userId]
          })
          .eq('id', conversationId)
      }
    } catch (error) {
      console.error('Error adding participant:', error)
    }
  },

  removeParticipant: async (conversationId: string, userId: string) => {
    try {
      await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      // Update participant_ids array
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single()

      if (conversation) {
        await supabase
          .from('conversations')
          .update({
            participant_ids: conversation.participant_ids.filter((id: string) => id !== userId)
          })
          .eq('id', conversationId)
      }
    } catch (error) {
      console.error('Error removing participant:', error)
    }
  },

  updateGroupName: async (conversationId: string, name: string) => {
    try {
      await supabase
        .from('conversations')
        .update({ name })
        .eq('id', conversationId)

      set(state => ({
        activeConversation: state.activeConversation?.id === conversationId
          ? { ...state.activeConversation, name }
          : state.activeConversation
      }))
    } catch (error) {
      console.error('Error updating group name:', error)
    }
  }
}))