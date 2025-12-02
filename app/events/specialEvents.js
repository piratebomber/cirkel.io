// Special event configurations for different regions and occasions

export const SPECIAL_EVENTS = {
  // Regional Events
  CANADA_DAY: {
    date: { month: 6, day: 1 },
    countries: ['CA'],
    effect: 'maple_leaves',
    colors: ['#ff0000', '#ffffff'],
    duration: 6000
  },
  
  BASTILLE_DAY: {
    date: { month: 6, day: 14 },
    countries: ['FR'],
    effect: 'tricolor_confetti',
    colors: ['#0055a4', '#ffffff', '#ef4135'],
    duration: 7000
  },
  
  DIWALI: {
    // Varies by year, approximate
    date: { month: 9, day: 24 }, // October/November
    countries: ['IN', 'NP', 'LK'],
    effect: 'lanterns',
    colors: ['#ffd700', '#ff6b35', '#f7931e'],
    duration: 8000
  },
  
  CHINESE_NEW_YEAR: {
    // Varies by year, approximate
    date: { month: 1, day: 12 }, // Late January/February
    countries: ['CN', 'TW', 'HK', 'SG', 'MY'],
    effect: 'dragons',
    colors: ['#dc143c', '#ffd700'],
    duration: 10000
  },
  
  CINCO_DE_MAYO: {
    date: { month: 4, day: 5 },
    countries: ['MX', 'US'],
    effect: 'papel_picado',
    colors: ['#006847', '#ffffff', '#ce1126'],
    duration: 6000
  },
  
  // Seasonal Events
  SPRING_EQUINOX: {
    date: { month: 2, day: 20 }, // March 20
    global: true,
    effect: 'cherry_blossoms',
    colors: ['#ffb7c5', '#ffffff', '#90ee90'],
    duration: 8000
  },
  
  SUMMER_SOLSTICE: {
    date: { month: 5, day: 21 }, // June 21
    global: true,
    effect: 'sun_rays',
    colors: ['#ffd700', '#ff8c00', '#ffff00'],
    duration: 5000
  },
  
  AUTUMN_EQUINOX: {
    date: { month: 8, day: 22 }, // September 22
    global: true,
    effect: 'falling_leaves',
    colors: ['#ff6347', '#ffa500', '#8b4513'],
    duration: 7000
  },
  
  WINTER_SOLSTICE: {
    date: { month: 11, day: 21 }, // December 21
    global: true,
    effect: 'aurora',
    colors: ['#00ff7f', '#4169e1', '#9370db'],
    duration: 9000
  },
  
  // Fun Events
  WORLD_EMOJI_DAY: {
    date: { month: 6, day: 17 },
    global: true,
    effect: 'emoji_rain',
    duration: 4000
  },
  
  INTERNATIONAL_COFFEE_DAY: {
    date: { month: 9, day: 1 },
    global: true,
    effect: 'coffee_beans',
    colors: ['#6f4e37', '#d2691e'],
    duration: 3000
  },
  
  WORLD_PIZZA_DAY: {
    date: { month: 1, day: 9 },
    global: true,
    effect: 'pizza_slices',
    duration: 4000
  },
  
  // Achievement-based Events
  USER_BIRTHDAY: {
    // Triggered when user's birthday matches current date
    personal: true,
    effect: 'birthday_celebration',
    colors: ['#ff69b4', '#00bfff', '#ffd700'],
    duration: 8000
  },
  
  ACCOUNT_ANNIVERSARY: {
    // Triggered on user's join date anniversary
    personal: true,
    effect: 'anniversary_sparkles',
    colors: ['#9370db', '#ffd700', '#ff1493'],
    duration: 6000
  }
}

// Event effect generators
export const EVENT_EFFECTS = {
  maple_leaves: (container, colors) => {
    for (let i = 0; i < 60; i++) {
      const leaf = document.createElement('div')
      leaf.innerHTML = '🍁'
      leaf.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -30px;
        font-size: ${12 + Math.random() * 16}px;
        animation: leafFall ${3 + Math.random() * 2}s ease-in forwards;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(leaf)
    }
  },
  
  tricolor_confetti: (container, colors) => {
    for (let i = 0; i < 120; i++) {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -10px;
        width: ${3 + Math.random() * 5}px;
        height: ${8 + Math.random() * 12}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation: tricolorFall ${2 + Math.random() * 3}s linear forwards;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(confetti)
    }
  },
  
  lanterns: (container, colors) => {
    for (let i = 0; i < 15; i++) {
      const lantern = document.createElement('div')
      lantern.innerHTML = '🏮'
      lantern.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: 100vh;
        font-size: ${20 + Math.random() * 15}px;
        animation: lanternRise ${4 + Math.random() * 3}s ease-out forwards;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(lantern)
    }
  },
  
  dragons: (container, colors) => {
    const dragon = document.createElement('div')
    dragon.innerHTML = '🐉'
    dragon.style.cssText = `
      position: absolute;
      left: -100px;
      top: ${20 + Math.random() * 40}%;
      font-size: 40px;
      animation: dragonFly 6s linear forwards;
    `
    container.appendChild(dragon)
  },
  
  cherry_blossoms: (container, colors) => {
    for (let i = 0; i < 80; i++) {
      const blossom = document.createElement('div')
      blossom.innerHTML = '🌸'
      blossom.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -20px;
        font-size: ${8 + Math.random() * 12}px;
        animation: blossomDrift ${4 + Math.random() * 3}s ease-in-out forwards;
        animation-delay: ${Math.random() * 2}s;
      `
      container.appendChild(blossom)
    }
  },
  
  emoji_rain: (container) => {
    const emojis = ['😀', '😂', '🥳', '😍', '🤩', '😎', '🔥', '💯', '✨', '🎉']
    for (let i = 0; i < 100; i++) {
      const emoji = document.createElement('div')
      emoji.innerHTML = emojis[Math.floor(Math.random() * emojis.length)]
      emoji.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -30px;
        font-size: ${16 + Math.random() * 20}px;
        animation: emojiRain ${2 + Math.random() * 2}s linear forwards;
        animation-delay: ${Math.random() * 3}s;
      `
      container.appendChild(emoji)
    }
  }
}

// Additional CSS animations
export const ADDITIONAL_ANIMATIONS = `
  @keyframes leafFall {
    0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(180deg); opacity: 0; }
  }
  
  @keyframes tricolorFall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
  }
  
  @keyframes lanternRise {
    0% { transform: translateY(0px) scale(0.5); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(-120vh) scale(1); opacity: 0; }
  }
  
  @keyframes dragonFly {
    0% { transform: translateX(-100px); }
    100% { transform: translateX(calc(100vw + 100px)); }
  }
  
  @keyframes blossomDrift {
    0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) translateX(100px) rotate(360deg); opacity: 0; }
  }
  
  @keyframes emojiRain {
    0% { transform: translateY(-30px) scale(1); opacity: 1; }
    100% { transform: translateY(100vh) scale(0.5); opacity: 0; }
  }
`