'use client'

import { useState } from 'react'
import { useSecurityStore } from '@/store/securityStore'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Shield, Smartphone, Key, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TwoFactorAuth() {
  const { 
    twoFactorEnabled, 
    enableTwoFactor, 
    verifyTwoFactor, 
    disableTwoFactor 
  } = useSecurityStore()
  
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [qrCode, setQrCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEnable2FA = async () => {
    setIsLoading(true)
    try {
      const qrCodeUrl = await enableTwoFactor()
      setQrCode(qrCodeUrl)
      setStep('verify')
    } catch (error) {
      toast.error('Failed to enable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      const isValid = await verifyTwoFactor(verificationCode)
      if (isValid) {
        setStep('complete')
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!verificationCode) {
      toast.error('Please enter your 2FA code')
      return
    }

    setIsLoading(true)
    try {
      await disableTwoFactor(verificationCode)
      setStep('setup')
      setVerificationCode('')
    } catch (error) {
      toast.error('Failed to disable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  if (twoFactorEnabled && step !== 'complete') {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">Two-Factor Authentication Enabled</h3>
            <p className="text-sm text-muted-foreground">Your account is protected with 2FA</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Two-factor authentication adds an extra layer of security to your account. 
              You'll need to enter a code from your authenticator app when signing in.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter 2FA code to disable
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              className="input-field"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleDisable2FA}
            variant="destructive"
            disabled={isLoading || !verificationCode}
            loading={isLoading}
          >
            Disable 2FA
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {step === 'setup' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cirkel-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-cirkel-600" />
            </div>
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How it works:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code with your app</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
            </div>

            <Button
              onClick={handleEnable2FA}
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cirkel-100 rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-cirkel-600" />
            </div>
            <div>
              <h3 className="font-semibold">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground">Use your authenticator app</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="input-field text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('setup')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                loading={isLoading}
                className="flex-1"
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 'complete' && (
        <>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">2FA Enabled Successfully!</h3>
              <p className="text-muted-foreground">
                Your account is now protected with two-factor authentication
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg text-left">
              <h4 className="font-medium text-green-800 mb-2">Important:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Keep your authenticator app safe and backed up</li>
                <li>• You'll need it every time you sign in</li>
                <li>• Save backup codes in a secure location</li>
              </ul>
            </div>

            <Button
              onClick={() => setStep('setup')}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </>
      )}
    </div>
  )
}