import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Badge, Achievement, GamificationData } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface GamificationStore {
  userGamification: GamificationData | null
  achievements: Achievement[]
  badges: Badge[]
  leaderboard: any[]
  
  // Actions
  addXP: (amount: number, reason: string) => Promise<void>
  unlockAchievement: (achievementId: string) => Promise<void>
  awardBadge: (badgeId: string) => Promise<void>
  updateStreak: () => Promise<void>
  checkLevelUp: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
  
  // Achievement checks
  checkPostMilestones: (postCount: number) => Promise<void>
  checkEngagementMilestones: (likes: number, reposts: number) => Promise<void>
  checkFollowerMilestones: (followers: number) => Promise<void>
}

const ACHIEVEMENTS = {
  FIRST_POST: { id: 'first_post', name: 'First Steps', xp: 10, icon: '📝' },
  POST_MILESTONE_10: { id: 'post_10', name: 'Getting Started', xp: 50, icon: '📈' },
  POST_MILESTONE_100: { id: 'post_100', name: 'Content Creator', xp: 200, icon: '🎯' },
  LIKE_MILESTONE_100: { id: 'like_100', name: 'Popular', xp: 100, icon: '❤️' },
  LIKE_MILESTONE_1000: { id: 'like_1000', name: 'Viral', xp: 500, icon: '🔥' },
  FOLLOWER_MILESTONE_100: { id: 'follower_100', name: 'Influencer', xp: 300, icon: '👥' },
  FOLLOWER_MILESTONE_1000: { id: 'follower_1000', name: 'Celebrity', xp: 1000, icon: '⭐' },
  STREAK_7: { id: 'streak_7', name: 'Week Warrior', xp: 70, icon: '🔥' },
  STREAK_30: { id: 'streak_30', name: 'Monthly Master', xp: 300, icon: '💪' },
  VERIFIED: { id: 'verified', name: 'Verified User', xp: 1000, icon: '✅' }
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      userGamification: null,
      achievements: [],
      badges: [],
      leaderboard: [],

      addXP: async (amount: number, reason: string) => {
        const { userGamification } = get()
        if (!userGamification) return

        const newXP = userGamification.xp + amount
        const newLevel = Math.floor(newXP / 1000) + 1

        try {
          await supabase
            .from('user_gamification')
            .update({ 
              xp: newXP,
              level: newLevel,
              last_activity: new Date().toISOString()
            })
            .eq('user_id', userGamification.userId)

          set(state => ({
            userGamification: state.userGamification ? {
              ...state.userGamification,
              xp: newXP,
              level: newLevel,
              lastActivity: new Date()
            } : null
          }))

          if (newLevel > userGamification.level) {
            toast.success(`🎊 Level up! You're now level ${newLevel}!`)
            get().checkLevelUp()
          }

          toast.success(`+${amount} XP: ${reason}`)
        } catch (error) {
          console.error('Error adding XP:', error)
        }
      },

      unlockAchievement: async (achievementId: string) => {
        const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS]
        if (!achievement) return

        try {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: get().userGamification?.userId,
              achievement_id: achievementId,
              unlocked_at: new Date().toISOString()
            })

          set(state => ({
            achievements: [...state.achievements, {
              ...achievement,
              isCompleted: true,
              unlockedAt: new Date()
            }]
          }))

          await get().addXP(achievement.xp, `Achievement: ${achievement.name}`)
          toast.success(`🏆 Achievement unlocked: ${achievement.name}!`)
        } catch (error) {
          console.error('Error unlocking achievement:', error)
        }
      },

      awardBadge: async (badgeId: string) => {
        try {
          const { data } = await supabase
            .from('badges')
            .select('*')
            .eq('id', badgeId)
            .single()

          if (data) {
            await supabase
              .from('user_badges')
              .insert({
                user_id: get().userGamification?.userId,
                badge_id: badgeId,
                awarded_at: new Date().toISOString()
              })

            set(state => ({
              badges: [...state.badges, { ...data, unlockedAt: new Date() }]
            }))

            toast.success(`🎖️ Badge earned: ${data.name}!`)
          }
        } catch (error) {
          console.error('Error awarding badge:', error)
        }
      },

      updateStreak: async () => {
        const { userGamification } = get()
        if (!userGamification) return

        const today = new Date().toDateString()
        const lastActivity = new Date(userGamification.lastActivity).toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        let newStreak = userGamification.streak

        if (lastActivity === today) {
          return // Already updated today
        } else if (lastActivity === yesterday) {
          newStreak += 1
        } else {
          newStreak = 1 // Reset streak
        }

        try {
          await supabase
            .from('user_gamification')
            .update({ 
              streak: newStreak,
              last_activity: new Date().toISOString()
            })
            .eq('user_id', userGamification.userId)

          set(state => ({
            userGamification: state.userGamification ? {
              ...state.userGamification,
              streak: newStreak,
              lastActivity: new Date()
            } : null
          }))

          // Check streak achievements
          if (newStreak === 7) {
            get().unlockAchievement('STREAK_7')
          } else if (newStreak === 30) {
            get().unlockAchievement('STREAK_30')
          }
        } catch (error) {
          console.error('Error updating streak:', error)
        }
      },

      checkLevelUp: async () => {
        const { userGamification } = get()
        if (!userGamification) return

        // Award level-based badges
        if (userGamification.level === 5) {
          get().awardBadge('level_5')
        } else if (userGamification.level === 10) {
          get().awardBadge('level_10')
        } else if (userGamification.level === 25) {
          get().awardBadge('level_25')
        }
      },

      fetchLeaderboard: async () => {
        try {
          const { data } = await supabase
            .from('user_gamification')
            .select(`
              *,
              user:users(username, display_name, profile_picture, is_verified)
            `)
            .order('xp', { ascending: false })
            .limit(50)

          set({ leaderboard: data || [] })
        } catch (error) {
          console.error('Error fetching leaderboard:', error)
        }
      },

      checkPostMilestones: async (postCount: number) => {
        if (postCount === 1) {
          get().unlockAchievement('FIRST_POST')
        } else if (postCount === 10) {
          get().unlockAchievement('POST_MILESTONE_10')
        } else if (postCount === 100) {
          get().unlockAchievement('POST_MILESTONE_100')
        }
      },

      checkEngagementMilestones: async (likes: number, reposts: number) => {
        if (likes >= 100) {
          get().unlockAchievement('LIKE_MILESTONE_100')
        }
        if (likes >= 1000) {
          get().unlockAchievement('LIKE_MILESTONE_1000')
        }
      },

      checkFollowerMilestones: async (followers: number) => {
        if (followers >= 100) {
          get().unlockAchievement('FOLLOWER_MILESTONE_100')
        }
        if (followers >= 1000) {
          get().unlockAchievement('FOLLOWER_MILESTONE_1000')
        }
        if (followers >= 5000) {
          get().unlockAchievement('VERIFIED')
        }
      }
    }),
    { name: 'cirkel-gamification' }
  )
)