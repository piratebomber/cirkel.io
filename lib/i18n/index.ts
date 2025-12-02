import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { rtlDetect } from 'rtl-detect';

export const supportedLanguages = {
  en: { name: 'English', nativeName: 'English', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false },
  ja: { name: 'Japanese', nativeName: '日本語', rtl: false },
  ko: { name: 'Korean', nativeName: '한국어', rtl: false },
  zh: { name: 'Chinese', nativeName: '中文', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  he: { name: 'Hebrew', nativeName: 'עברית', rtl: true },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  th: { name: 'Thai', nativeName: 'ไทย', rtl: false },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
  tr: { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  pl: { name: 'Polish', nativeName: 'Polski', rtl: false },
  nl: { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  sv: { name: 'Swedish', nativeName: 'Svenska', rtl: false },
  da: { name: 'Danish', nativeName: 'Dansk', rtl: false },
  no: { name: 'Norwegian', nativeName: 'Norsk', rtl: false },
  fi: { name: 'Finnish', nativeName: 'Suomi', rtl: false }
};

export const defaultTranslations = {
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
      comment: 'Comment',
      follow: 'Follow',
      unfollow: 'Unfollow',
      post: 'Post',
      posts: 'Posts',
      user: 'User',
      users: 'Users',
      community: 'Community',
      communities: 'Communities',
      search: 'Search',
      settings: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      messages: 'Messages',
      home: 'Home',
      explore: 'Explore',
      trending: 'Trending',
      popular: 'Popular',
      recent: 'Recent',
      all: 'All'
    },
    navigation: {
      home: 'Home',
      explore: 'Explore',
      notifications: 'Notifications',
      messages: 'Messages',
      profile: 'Profile',
      settings: 'Settings',
      communities: 'Communities',
      bookmarks: 'Bookmarks',
      lists: 'Lists',
      logout: 'Logout'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      username: 'Username',
      displayName: 'Display Name',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      loginWithGoogle: 'Login with Google',
      loginWithTwitter: 'Login with Twitter',
      loginWithGitHub: 'Login with GitHub',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      termsAndConditions: 'Terms and Conditions',
      privacyPolicy: 'Privacy Policy',
      agreeToTerms: 'I agree to the Terms and Conditions'
    },
    posts: {
      whatsHappening: "What's happening?",
      postButton: 'Post',
      replyButton: 'Reply',
      repost: 'Repost',
      quote: 'Quote',
      bookmark: 'Bookmark',
      copyLink: 'Copy Link',
      deletePost: 'Delete Post',
      editPost: 'Edit Post',
      reportPost: 'Report Post',
      muteUser: 'Mute User',
      blockUser: 'Block User',
      showThread: 'Show Thread',
      hideThread: 'Hide Thread',
      pinPost: 'Pin Post',
      unpinPost: 'Unpin Post',
      addToList: 'Add to List',
      removeFromList: 'Remove from List'
    },
    profile: {
      editProfile: 'Edit Profile',
      followers: 'Followers',
      following: 'Following',
      joinedDate: 'Joined {{date}}',
      bio: 'Bio',
      location: 'Location',
      website: 'Website',
      birthday: 'Birthday',
      profilePicture: 'Profile Picture',
      bannerImage: 'Banner Image',
      changeAvatar: 'Change Avatar',
      changeBanner: 'Change Banner',
      verifiedAccount: 'Verified Account',
      protectedAccount: 'Protected Account'
    },
    communities: {
      createCommunity: 'Create Community',
      joinCommunity: 'Join Community',
      leaveCommunity: 'Leave Community',
      communityName: 'Community Name',
      communityDescription: 'Community Description',
      communityRules: 'Community Rules',
      communityMembers: 'Members',
      communityModerators: 'Moderators',
      communitySettings: 'Community Settings',
      publicCommunity: 'Public Community',
      privateCommunity: 'Private Community',
      restrictedCommunity: 'Restricted Community'
    },
    messages: {
      newMessage: 'New Message',
      sendMessage: 'Send Message',
      messageUser: 'Message {{username}}',
      startConversation: 'Start Conversation',
      searchMessages: 'Search Messages',
      markAsRead: 'Mark as Read',
      markAsUnread: 'Mark as Unread',
      deleteConversation: 'Delete Conversation',
      muteConversation: 'Mute Conversation',
      unmuteConversation: 'Unmute Conversation'
    },
    notifications: {
      allNotifications: 'All Notifications',
      mentions: 'Mentions',
      likes: 'Likes',
      reposts: 'Reposts',
      follows: 'Follows',
      messages: 'Messages',
      markAllAsRead: 'Mark All as Read',
      clearAll: 'Clear All',
      notificationSettings: 'Notification Settings',
      pushNotifications: 'Push Notifications',
      emailNotifications: 'Email Notifications',
      smsNotifications: 'SMS Notifications'
    },
    settings: {
      accountSettings: 'Account Settings',
      privacySettings: 'Privacy Settings',
      securitySettings: 'Security Settings',
      notificationSettings: 'Notification Settings',
      displaySettings: 'Display Settings',
      languageSettings: 'Language Settings',
      accessibilitySettings: 'Accessibility Settings',
      dataSettings: 'Data Settings',
      helpCenter: 'Help Center',
      contactSupport: 'Contact Support',
      aboutUs: 'About Us',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      cookiePolicy: 'Cookie Policy'
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      notFound: 'Page not found.',
      unauthorized: 'You are not authorized to access this page.',
      forbidden: 'Access forbidden.',
      validationError: 'Please check your input and try again.',
      rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
      fileUploadError: 'File upload failed. Please try again.',
      fileTooLarge: 'File is too large. Maximum size is {{maxSize}}.',
      invalidFileType: 'Invalid file type. Allowed types: {{allowedTypes}}.'
    },
    time: {
      now: 'now',
      secondsAgo: '{{count}}s',
      minutesAgo: '{{count}}m',
      hoursAgo: '{{count}}h',
      daysAgo: '{{count}}d',
      weeksAgo: '{{count}}w',
      monthsAgo: '{{count}}mo',
      yearsAgo: '{{count}}y',
      yesterday: 'yesterday',
      tomorrow: 'tomorrow'
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}'
    },

    resources: {
      en: {
        translation: defaultTranslations.en
      }
    }
  });

export class I18nManager {
  static getCurrentLanguage(): string {
    return i18n.language;
  }

  static getSupportedLanguages(): typeof supportedLanguages {
    return supportedLanguages;
  }

  static async changeLanguage(language: string): Promise<void> {
    await i18n.changeLanguage(language);
    this.updateDocumentDirection(language);
    this.updateDocumentLanguage(language);
  }

  static isRTL(language?: string): boolean {
    const lang = language || i18n.language;
    return supportedLanguages[lang as keyof typeof supportedLanguages]?.rtl || false;
  }

  static getLanguageInfo(language: string) {
    return supportedLanguages[language as keyof typeof supportedLanguages];
  }

  static updateDocumentDirection(language?: string): void {
    const lang = language || i18n.language;
    const isRTL = this.isRTL(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-rtl', isRTL.toString());
  }

  static updateDocumentLanguage(language?: string): void {
    const lang = language || i18n.language;
    document.documentElement.lang = lang;
  }

  static formatNumber(number: number, language?: string): string {
    const lang = language || i18n.language;
    return new Intl.NumberFormat(lang).format(number);
  }

  static formatCurrency(amount: number, currency: string = 'USD', language?: string): string {
    const lang = language || i18n.language;
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency
    }).format(amount);
  }

  static formatDate(date: Date, options?: Intl.DateTimeFormatOptions, language?: string): string {
    const lang = language || i18n.language;
    return new Intl.DateTimeFormat(lang, options).format(date);
  }

  static formatRelativeTime(date: Date, language?: string): string {
    const lang = language || i18n.language;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return i18n.t('time.now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return i18n.t('time.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return i18n.t('time.hoursAgo', { count: hours });
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return i18n.t('time.daysAgo', { count: days });
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return i18n.t('time.weeksAgo', { count: weeks });
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return i18n.t('time.monthsAgo', { count: months });
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return i18n.t('time.yearsAgo', { count: years });
    }
  }

  static pluralize(key: string, count: number, options?: any): string {
    return i18n.t(key, { count, ...options });
  }

  static detectUserLanguage(): string {
    const browserLang = navigator.language.split('-')[0];
    return Object.keys(supportedLanguages).includes(browserLang) ? browserLang : 'en';
  }

  static async loadLanguageResources(language: string): Promise<void> {
    if (!i18n.hasResourceBundle(language, 'translation')) {
      try {
        const response = await fetch(`/locales/${language}/translation.json`);
        const resources = await response.json();
        i18n.addResourceBundle(language, 'translation', resources);
      } catch (error) {
        console.error(`Failed to load language resources for ${language}:`, error);
      }
    }
  }

  static getAvailableNamespaces(): string[] {
    return ['translation', 'common', 'auth', 'posts', 'profile', 'communities', 'messages', 'notifications', 'settings', 'errors'];
  }

  static async preloadLanguages(languages: string[]): Promise<void> {
    await Promise.all(languages.map(lang => this.loadLanguageResources(lang)));
  }
}

// Initialize document direction and language on load
if (typeof document !== 'undefined') {
  I18nManager.updateDocumentDirection();
  I18nManager.updateDocumentLanguage();
}

export default i18n;