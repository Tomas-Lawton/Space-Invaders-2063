export class Audio_Manager {
  constructor(audioContext) {
    this.sounds = [];
    this.audioContext = audioContext;
    this.currentIndex = 0;
    this.soundtrack = null;
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
    this.soundtrack = new Audio();
    this.soundtrack.src = path;
  }

  playRandomSound() {
    const randomIndex = Math.floor(Math.random() * this.sounds.length);
    this.playSoundAtIndex(randomIndex);
  }

  playNextSound() {
    this.currentIndex = (this.currentIndex + 1) % this.sounds.length;
    this.playSoundAtIndex(this.currentIndex);
  }

  playSoundtrack() {
    if (this.soundtrack) {
      this.audioContext.resume().then(() => {
        console.log('AudioContext is now unlocked and ready to play audio');
      });

      if (!this.soundtrack.paused) {
        this.soundtrack.pause();
        return; 
      }
  
      if (this.soundtrackSource) {
        this.soundtrack.play();
        return; 
      }
  
      const randomStartTime = Math.random() * this.soundtrack.duration;
      if (isFinite(randomStartTime)) {
        this.soundtrack.currentTime = randomStartTime;
      } else {
        this.soundtrack.currentTime = 0;
      }
  
      if (this.soundtrackSource) {
        this.soundtrackSource.disconnect();
      }
  
      this.soundtrackSource = this.audioContext.createMediaElementSource(this.soundtrack);
      this.soundtrackSource.connect(this.audioContext.destination);
  
      this.soundtrack.play();
      console.log("Started Soundtrack")
    }
  }
  
  playSoundAtIndex(index) {
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

    selectedSound.play().catch(error => console.error("Error playing sound:", error));
}

}