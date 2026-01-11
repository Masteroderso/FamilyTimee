
export class SoundService {
  private static currentMusic: HTMLAudioElement | null = null;
  private static isMusicMuted: boolean = false;
  private static isSfxMuted: boolean = false;

  private static musicTracks = {
    hub: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Very Calm Ambient for Gallery
    setup: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Chill Lounge for Game Lobby
    revealing: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', // Subtle Sneaky
    tension: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // Percussive Tension
    victory: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Win
    defeat: 'https://assets.mixkit.co/active_storage/sfx/253/253-preview.mp3' // Lose
  };

  private static sfxUrls = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    reveal: 'https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3', // Very short, fast UI swift whoosh
    hide: 'https://assets.mixkit.co/active_storage/sfx/448/448-preview.mp3', // Discrete short mechanical click
    vote: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    lose: 'https://assets.mixkit.co/active_storage/sfx/253/253-preview.mp3'
  };

  static init() {
    // Basic init handled on interaction
  }

  static switchMusic(type: keyof typeof SoundService.musicTracks) {
    if (this.isMusicMuted) return;

    if (this.currentMusic) {
      // Avoid restarting the same track if it's already playing
      if (this.currentMusic.src === this.musicTracks[type]) return;
      this.currentMusic.pause();
      this.currentMusic = null;
    }

    this.currentMusic = new Audio(this.musicTracks[type]);
    this.currentMusic.loop = type !== 'victory' && type !== 'defeat';
    
    // Dynamic volume adjustment for music
    let volume = 0.2;
    if (type === 'hub') volume = 0.15; // Extra quiet for the hub
    if (type === 'revealing') volume = 0.12;
    if (type === 'tension') volume = 0.18;
    
    this.currentMusic.volume = volume;
    
    this.currentMusic.play().catch(() => {
      console.log("Music play blocked by browser policy until interaction.");
    });
  }

  static toggleMusic(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted) {
      if (this.currentMusic) this.currentMusic.pause();
    } else {
      if (this.currentMusic) this.currentMusic.play().catch(() => {});
    }
  }

  static toggleSfx(muted: boolean) {
    this.isSfxMuted = muted;
  }

  static playSfx(type: keyof typeof SoundService.sfxUrls) {
    if (this.isSfxMuted) return;
    const audio = new Audio(this.sfxUrls[type]);
    
    // Minimal volume for swipe actions to be as subtle as possible
    let volume = 0.4;
    if (type === 'reveal' || type === 'hide') volume = 0.15;
    
    audio.volume = volume;
    audio.play().catch(() => {});
  }
}
