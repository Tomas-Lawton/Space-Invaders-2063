export class Audio_Manager {
  constructor(audioContext) {
    this.sounds = [];
    this.audioContext = audioContext;
    this.currentIndex = 0;
    this.soundtrack = null;
    this.audioContext.resume().then(() => {
      console.log('AudioContext is now unlocked and ready to play audio');
    });
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
      const randomStartTime = Math.random() * this.soundtrack.duration;
      if (isFinite(randomStartTime)) {
        this.soundtrack.currentTime = randomStartTime;
      } else {
        this.soundtrack.currentTime = 0;
      }
  
      const soundtrackSource = this.audioContext.createMediaElementSource(this.soundtrack);
      soundtrackSource.connect(this.audioContext.destination);
      this.soundtrack.play();
    }
  }
  playSoundAtIndex(index) {
    const selectedSound = this.sounds[index];
  
    // If soundSource already exists, disconnect it before creating a new one
    if (this.soundSource) {
      this.soundSource.disconnect();
    }
  
    this.soundSource = this.audioContext.createMediaElementSource(selectedSound);
    this.soundSource.connect(this.audioContext.destination);
    selectedSound.play();
  }
}