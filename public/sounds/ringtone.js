// Generate ringtone programmatically using Web Audio API
export function createRingtone() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  const createTone = (frequency, duration, startTime) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(frequency, startTime)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }
  
  // Create iPhone-style ringtone pattern
  const now = audioContext.currentTime
  createTone(523.25, 0.5, now) // C5
  createTone(659.25, 0.5, now + 0.6) // E5
  createTone(783.99, 0.5, now + 1.2) // G5
  createTone(1046.50, 0.8, now + 1.8) // C6
  
  return audioContext
}