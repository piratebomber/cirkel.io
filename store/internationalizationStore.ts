import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Translation {
  [key: string]: string | Translation
}

interface InternationalizationStore {
  currentLanguage: string
  availableLanguages: string[]
  translations: Record<string, Translation>
  isRTL: boolean
  
  // Actions
  setLanguage: (language: string) => void
  translate: (key: string, params?: Record<string, string>) => string
  loadTranslations: (language: string) => Promise<void>
  detectLanguage: () => string
  
  // Regional content
  getRegionalTrending: (country: string) => Promise<any[]>
  getLocalizedContent: (language: string) => Promise<any>
}

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']

const TRANSLATIONS = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      like: 'Like',
      unlike: 'Unlike',
      repost: 'Repost',
      comment: 'Comment',
      follow: 'Follow',
      unfollow: 'Unfollow',
      post: 'Post',
      reply: 'Reply'
    },
    navigation: {
      home: 'Home',
      explore: 'Explore',
      notifications: 'Notifications',
      messages: 'Messages',
      profile: 'Profile',
      settings: 'Settings',
      communities: 'Communities',
      trending: 'Trending'
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      displayName: 'Display Name',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?"
    },
    posts: {
      whatsHappening: "What's happening?",
      postYourReply: 'Post your reply',
      charactersRemaining: 'characters remaining',
      addMedia: 'Add media',
      addPoll: 'Add poll',
      schedulePost: 'Schedule post',
      visibility: 'Visibility',
      public: 'Public',
      unlisted: 'Unlisted',
      private: 'Private'
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      share: 'Compartir',
      like: 'Me gusta',
      unlike: 'No me gusta',
      repost: 'Repostear',
      comment: 'Comentar',
      follow: 'Seguir',
      unfollow: 'Dejar de seguir',
      post: 'Publicar',
      reply: 'Responder'
    },
    navigation: {
      home: 'Inicio',
      explore: 'Explorar',
      notifications: 'Notificaciones',
      messages: 'Mensajes',
      profile: 'Perfil',
      settings: 'Configuración',
      communities: 'Comunidades',
      trending: 'Tendencias'
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar Sesión',
      email: 'Correo',
      password: 'Contraseña',
      username: 'Usuario',
      displayName: 'Nombre',
      forgotPassword: '¿Olvidaste tu contraseña?',
      createAccount: 'Crear Cuenta',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      dontHaveAccount: '¿No tienes una cuenta?'
    },
    posts: {
      whatsHappening: '¿Qué está pasando?',
      postYourReply: 'Publica tu respuesta',
      charactersRemaining: 'caracteres restantes',
      addMedia: 'Agregar media',
      addPoll: 'Agregar encuesta',
      schedulePost: 'Programar publicación',
      visibility: 'Visibilidad',
      public: 'Público',
      unlisted: 'No listado',
      private: 'Privado'
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Sauvegarder',
      delete: 'Supprimer',
      edit: 'Modifier',
      share: 'Partager',
      like: 'Aimer',
      unlike: 'Ne plus aimer',
      repost: 'Republier',
      comment: 'Commenter',
      follow: 'Suivre',
      unfollow: 'Ne plus suivre',
      post: 'Publier',
      reply: 'Répondre'
    },
    navigation: {
      home: 'Accueil',
      explore: 'Explorer',
      notifications: 'Notifications',
      messages: 'Messages',
      profile: 'Profil',
      settings: 'Paramètres',
      communities: 'Communautés',
      trending: 'Tendances'
    }
  },
  de: {
    common: {
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      share: 'Teilen',
      like: 'Gefällt mir',
      unlike: 'Gefällt mir nicht mehr',
      repost: 'Erneut posten',
      comment: 'Kommentieren',
      follow: 'Folgen',
      unfollow: 'Entfolgen',
      post: 'Posten',
      reply: 'Antworten'
    }
  },
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      share: '共有',
      like: 'いいね',
      unlike: 'いいねを取り消す',
      repost: 'リポスト',
      comment: 'コメント',
      follow: 'フォロー',
      unfollow: 'フォロー解除',
      post: '投稿',
      reply: '返信'
    }
  },
  ar: {
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      share: 'مشاركة',
      like: 'إعجاب',
      unlike: 'إلغاء الإعجاب',
      repost: 'إعادة نشر',
      comment: 'تعليق',
      follow: 'متابعة',
      unfollow: 'إلغاء المتابعة',
      post: 'نشر',
      reply: 'رد'
    }
  }
}

export const useInternationalizationStore = create<InternationalizationStore>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      availableLanguages: ['en', 'es', 'fr', 'de', 'ja', 'ar', 'zh', 'ko', 'pt', 'it', 'ru', 'hi'],
      translations: TRANSLATIONS,
      isRTL: false,

      setLanguage: (language: string) => {
        const isRTL = RTL_LANGUAGES.includes(language)
        
        set({ 
          currentLanguage: language, 
          isRTL 
        })

        // Update document direction
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
        document.documentElement.lang = language

        // Load translations if not already loaded
        if (!get().translations[language]) {
          get().loadTranslations(language)
        }
      },

      translate: (key: string, params?: Record<string, string>) => {
        const { currentLanguage, translations } = get()
        const keys = key.split('.')
        
        let translation: any = translations[currentLanguage]
        
        for (const k of keys) {
          if (translation && typeof translation === 'object') {
            translation = translation[k]
          } else {
            // Fallback to English
            translation = translations.en
            for (const fallbackKey of keys) {
              if (translation && typeof translation === 'object') {
                translation = translation[fallbackKey]
              } else {
                return key // Return key if no translation found
              }
            }
            break
          }
        }

        if (typeof translation !== 'string') {
          return key
        }

        // Replace parameters
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(`{{${param}}}`, value)
          })
        }

        return translation
      },

      loadTranslations: async (language: string) => {
        try {
          // In a real app, you'd load from an API or translation service
          const response = await fetch(`/api/translations/${language}`)
          if (response.ok) {
            const translations = await response.json()
            
            set(state => ({
              translations: {
                ...state.translations,
                [language]: translations
              }
            }))
          }
        } catch (error) {
          console.error('Error loading translations:', error)
        }
      },

      detectLanguage: () => {
        // Detect from browser
        const browserLang = navigator.language.split('-')[0]
        const { availableLanguages } = get()
        
        if (availableLanguages.includes(browserLang)) {
          return browserLang
        }
        
        return 'en' // Default fallback
      },

      getRegionalTrending: async (country: string) => {
        try {
          const response = await fetch(`/api/trending?country=${country}`)
          const data = await response.json()
          return data.trending || []
        } catch (error) {
          console.error('Error fetching regional trending:', error)
          return []
        }
      },

      getLocalizedContent: async (language: string) => {
        try {
          const response = await fetch(`/api/content/localized?lang=${language}`)
          const data = await response.json()
          return data
        } catch (error) {
          console.error('Error fetching localized content:', error)
          return null
        }
      }
    }),
    {
      name: 'cirkel-i18n',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        isRTL: state.isRTL
      })
    }
  )
)

// Initialize language on app start
if (typeof window !== 'undefined') {
  const store = useInternationalizationStore.getState()
  const savedLanguage = store.currentLanguage
  const detectedLanguage = store.detectLanguage()
  
  // Use saved language or detect from browser
  const languageToUse = savedLanguage !== 'en' ? savedLanguage : detectedLanguage
  
  if (languageToUse !== store.currentLanguage) {
    store.setLanguage(languageToUse)
  } else {
    // Set initial direction
    document.documentElement.dir = store.isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = store.currentLanguage
  }
}

// Hook for easy translation access
export const useTranslation = () => {
  const { translate, currentLanguage, isRTL } = useInternationalizationStore()
  
  return {
    t: translate,
    language: currentLanguage,
    isRTL
  }
}