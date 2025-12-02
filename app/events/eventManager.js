class EventManager {
  constructor() {
    this.events = new Map()
    this.userLocation = null
    this.initEvents()
  }

  async getUserLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      this.userLocation = data
      return data
    } catch (error) {
      console.error('Failed to get location:', error)
      return null
    }
  }

  initEvents() {
    // July 4th - Independence Day (US only)
    this.events.set('july4th', {
      name: 'Independence Day',
      check: (date, location) => {
        const isJuly4th = date.getMonth() === 6 && date.getDate() === 4
        const isUS = location?.country_code === 'US'
        return isJuly4th && isUS
      },
      effect: 'fireworks',
      duration: 8000
    })

    // Christmas - December 25th (Global)
    this.events.set('christmas', {
      name: 'Christmas',
      check: (date) => date.getMonth() === 11 && date.getDate() === 25,
      effect: 'snow',
      duration: 12000
    })

    // New Year - January 1st (Global)
    this.events.set('newyear', {
      name: 'New Year',
      check: (date) => date.getMonth() === 0 && date.getDate() === 1,
      effect: 'confetti',
      duration: 10000
    })

    // Halloween - October 31st (Global)
    this.events.set('halloween', {
      name: 'Halloween',
      check: (date) => date.getMonth() === 9 && date.getDate() === 31,
      effect: 'spooky',
      duration: 6000
    })

    // Valentine's Day - February 14th (Global)
    this.events.set('valentines', {
      name: "Valentine's Day",
      check: (date) => date.getMonth() === 1 && date.getDate() === 14,
      effect: 'hearts',
      duration: 7000
    })

    // St. Patrick's Day - March 17th (Global)
    this.events.set('stpatricks', {
      name: "St. Patrick's Day",
      check: (date) => date.getMonth() === 2 && date.getDate() === 17,
      effect: 'shamrocks',
      duration: 5000
    })
  }

  async checkActiveEvents() {
    const now = new Date()
    const location = await this.getUserLocation()
    const activeEvents = []

    for (const [key, event] of this.events) {
      if (event.check(now, location)) {
        activeEvents.push({ key, ...event })
      }
    }

    return activeEvents
  }

  createParticleSystem(effect, duration) {
    const container = document.createElement('div')
    container.className = 'event-particles'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `
    document.body.appendChild(container)

    switch (effect) {
      case 'fireworks':
        this.createFireworks(container)
        break
      case 'snow':
        this.createSnow(container)
        break
      case 'confetti':
        this.createConfetti(container)
        break
      case 'spooky':
        this.createSpooky(container)
        break
      case 'hearts':
        this.createHearts(container)
        break
      case 'shamrocks':
        this.createShamrocks(container)
        break
    }

    setTimeout(() => {
      container.remove()
    }, duration)
  }

  createFireworks(container) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const firework = document.createElement('div')
        firework.style.cssText = `
          position: absolute;
          left: ${Math.random() * 100}%;
          top: ${60 + Math.random() * 30}%;
          width: 4px;
          height: 4px;
          background: #ff${Math.floor(Math.random() * 16).toString(16)}${Math.floor(Math.random() * 16).toString(16)}${Math.floor(Math.random() * 16).toString(16)};
          border-radius: 50%;
          animation: firework 2s ease-out forwards;
        `
        container.appendChild(firework)

        // Create burst particles
        setTimeout(() => {
          for (let j = 0; j < 20; j++) {
            const particle = document.createElement('div')
            particle.style.cssText = `
              position: absolute;
              left: ${firework.offsetLeft}px;
              top: ${firework.offsetTop}px;
              width: 3px;
              height: 3px;
              background: ${firework.style.background};
              border-radius: 50%;
              animation: burst 1.5s ease-out forwards;
              transform: rotate(${j * 18}deg);
            `
            container.appendChild(particle)
          }
          firework.remove()
        }, 1000)
      }, i * 300)
    }
  }

  createSnow(container) {
    for (let i = 0; i < 100; i++) {
      const snowflake = document.createElement('div')
      snowflake.innerHTML = '❄'
      snowflake.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -10px;
        color: white;
        font-size: ${8 + Math.random() * 12}px;
        animation: snow ${3 + Math.random() * 4}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(snowflake)
    }
  }

  createConfetti(container) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd']
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -10px;
        width: ${4 + Math.random() * 6}px;
        height: ${4 + Math.random() * 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation: confetti ${2 + Math.random() * 3}s ease-out forwards;
        animation-delay: ${Math.random() * 3}s;
      `
      container.appendChild(confetti)
    }
  }

  createSpooky(container) {
    const spookyEmojis = ['🎃', '👻', '🦇', '🕷️', '🕸️']
    for (let i = 0; i < 30; i++) {
      const spooky = document.createElement('div')
      spooky.innerHTML = spookyEmojis[Math.floor(Math.random() * spookyEmojis.length)]
      spooky.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -50px;
        font-size: ${16 + Math.random() * 20}px;
        animation: spookyFloat ${4 + Math.random() * 3}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(spooky)
    }
  }

  createHearts(container) {
    for (let i = 0; i < 50; i++) {
      const heart = document.createElement('div')
      heart.innerHTML = '💖'
      heart.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: 100vh;
        font-size: ${12 + Math.random() * 16}px;
        animation: heartsFloat ${3 + Math.random() * 2}s ease-out forwards;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(heart)
    }
  }

  createShamrocks(container) {
    for (let i = 0; i < 40; i++) {
      const shamrock = document.createElement('div')
      shamrock.innerHTML = '🍀'
      shamrock.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -30px;
        font-size: ${10 + Math.random() * 14}px;
        animation: shamrockFall ${2.5 + Math.random() * 2}s linear forwards;
        animation-delay: ${Math.random() * 1.5}s;
      `
      container.appendChild(shamrock)
    }
  }

  async triggerLoginEvent() {
    const activeEvents = await this.checkActiveEvents()
    
    if (activeEvents.length > 0) {
      const event = activeEvents[0] // Use first active event
      console.log(`🎉 ${event.name} event triggered!`)
      
      // Add CSS animations if not already present
      this.addEventStyles()
      
      // Trigger particle effect
      this.createParticleSystem(event.effect, event.duration)
      
      return event
    }
    
    return null
  }

  addEventStyles() {
    if (document.getElementById('event-styles')) return

    const style = document.createElement('style')
    style.id = 'event-styles'
    style.textContent = `
      @keyframes firework {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-200px); opacity: 0; }
      }
      
      @keyframes burst {
        0% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
        100% { transform: translateX(100px) translateY(100px) scale(0); opacity: 0; }
      }
      
      @keyframes snow {
        0% { transform: translateY(-10px) translateX(0px); opacity: 1; }
        100% { transform: translateY(100vh) translateX(50px); opacity: 0; }
      }
      
      @keyframes confetti {
        0% { transform: translateY(-10px) rotateZ(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotateZ(720deg); opacity: 0; }
      }
      
      @keyframes spookyFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      
      @keyframes heartsFloat {
        0% { transform: translateY(0px) scale(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-100vh) scale(1); opacity: 0; }
      }
      
      @keyframes shamrockFall {
        0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

// Export for use in React components
window.EventManager = EventManager
export default EventManager