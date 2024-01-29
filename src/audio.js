export class Audio_Manager {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.sounds = [];
    this.currentIndex = 0;
    this.soundtrack = null;
    this.soundtrackSource = null;
    this.lastSoundPlayTime = 0;
    this.soundCooldown = 100;
  }

  loadSounds(path) {
    const soundCount = 11;
    for (let i = 1; i <= soundCount; i++) {
      const sound = new Audio();
      sound.src = `${path}/${i}.wav`;
      this.sounds.push(sound);
    }
  }

  loadSoundtrack(path) {
    this.soundtrack = new Audio(path);
    this.soundtrack.loop = true;
  }

  async playRandomSound() {
    const randomIndex = Math.floor(Math.random() * this.sounds.length);
    await this.playSoundAtIndex(randomIndex);
  }

  async playNextSound() {
    this.currentIndex = (this.currentIndex + 1) % this.sounds.length;
    await this.playSoundAtIndex(this.currentIndex);
  }

  async playSoundtrack() {
    console.log('Playing...');
    if (!this.soundtrack) {
      console.warn('Soundtrack is not loaded');
      return;
    }
  
    try {
      await this.audioContext.resume();
      console.log('AudioContext is now unlocked and ready to play audio');
  
      if (!this.soundtrackSource) {
        this.soundtrackSource = this.audioContext.createMediaElementSource(this.soundtrack);
        this.soundtrackSource.connect(this.audioContext.destination);
      }
  
      if (!this.soundtrack.paused) {
        this.soundtrack.pause();
        console.log('Paused Soundtrack');
        return;
      }
  
      const randomStartTime = Math.random() * this.soundtrack.duration;
      this.soundtrack.currentTime = isFinite(randomStartTime) ? randomStartTime : 0;
      this.soundtrack.play();
      console.log('Started Soundtrack');
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }
  pauseSoundtrack() {
    if (this.soundtrack && !this.soundtrack.paused) {
      this.soundtrack.pause();
      console.log('Paused Soundtrack');
    }
  }
  async playSoundAtIndex(index) {
    console.log('play sound');
    const selectedSound = new Audio(this.sounds[index].src);
    const currentTime = Date.now();

    if (currentTime - this.lastSoundPlayTime < this.soundCooldown) return;

    const soundSource = this.audioContext.createMediaElementSource(selectedSound);
    soundSource.connect(this.audioContext.destination);

    selectedSound.addEventListener('ended', () => {
      this.lastSoundPlayTime = Date.now();
      soundSource.disconnect();
    });

    await selectedSound.play().catch(error => console.error("Error playing sound:", error));
  }
}
