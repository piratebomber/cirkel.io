'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { validateEmail, validateUsername, validatePassword } from '@/lib/utils'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading, createGuestSession } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    bio: '',
    pronouns: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    // Update password validation in real-time
    const { password } = formData
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }, [formData.password])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    } else {
      // Check email domain
      const domain = formData.email.split('@')[1]
      const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'wemail.go']
      
      if (!allowedDomains.includes(domain)) {
        newErrors.email = 'Email domain not supported. Please use Gmail, Outlook, Yahoo, or wemail.go'
      } else if (domain === 'wemail.go' && formData.email !== 'cirkelio@wemail.go') {
        newErrors.email = 'Only cirkelio@wemail.go is allowed for wemail.go domain'
      }
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
    }

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters'
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters'
    }

    // Password validation
    const passwordCheck = validatePassword(formData.password)
    if (!passwordCheck.isValid) {
      newErrors.password = passwordCheck.errors[0]
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Bio validation (optional)
    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = 'Bio must be less than 160 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await register(formData.email, formData.password, {
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio || undefined,
        pronouns: formData.pronouns || undefined,
      })
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleGuestMode = () => {
    createGuestSession()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cirkel-50 to-cirkel-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-cirkel-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold cirkel-text-gradient">cirkel.io</h1>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Join Cirkel</h2>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Registration Form */}
        <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`
                    input-field pl-10
                    ${errors.email ? 'border-destructive focus:ring-destructive' : ''}
                  `}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="error-message">{errors.email}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Supported: Gmail, Outlook, Yahoo, wemail.go (cirkelio@wemail.go only)
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`
                    input-field pl-8
                    ${errors.username ? 'border-destructive focus:ring-destructive' : ''}
                  `}
                  placeholder="Choose a username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="error-message">{errors.username}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                Display Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`
                    input-field pl-10
                    ${errors.displayName ? 'border-destructive focus:ring-destructive' : ''}
                  `}
                  placeholder="Your display name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.displayName && (
                <p className="error-message">{errors.displayName}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`
                    input-field pl-10 pr-10
                    ${errors.password ? 'border-destructive focus:ring-destructive' : ''}
                  `}
                  placeholder="Create a password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {Object.entries({
                    length: 'At least 8 characters',
                    uppercase: 'One uppercase letter',
                    lowercase: 'One lowercase letter',
                    number: 'One number',
                    special: 'One special character',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {passwordValidation[key as keyof typeof passwordValidation] ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={
                        passwordValidation[key as keyof typeof passwordValidation] 
                          ? 'text-green-600' 
                          : 'text-muted-foreground'
                      }>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`
                    input-field pl-10 pr-10
                    ${errors.confirmPassword ? 'border-destructive focus:ring-destructive' : ''}
                  `}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Bio (Optional) */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className={`
                  input-field resize-none
                  ${errors.bio ? 'border-destructive focus:ring-destructive' : ''}
                `}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={160}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && (
                  <p className="error-message">{errors.bio}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {formData.bio.length}/160
                </p>
              </div>
            </div>

            {/* Pronouns (Optional) */}
            <div>
              <label htmlFor="pronouns" className="block text-sm font-medium mb-2">
                Pronouns (Optional)
              </label>
              <input
                id="pronouns"
                name="pronouns"
                type="text"
                value={formData.pronouns}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., they/them, she/her, he/him"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isPasswordValid}
              loading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          {/* Guest Mode */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGuestMode}
            disabled={isSubmitting}
          >
            Continue as Guest
          </Button>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-cirkel-500 hover:text-cirkel-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}