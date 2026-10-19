export class soundManager {
  constructor() {
    this.audioElements = new Map();
    this.isPlaying = false;
  }

  loadSound(soundId, filePath) {
    try {
      const audio = new Audio();
      audio.src = filePath;
      audio.loop = true;
      audio.preload = "metadata";

      //Add audio elements to the DOM
      this.audioElements.set(soundId, audio);
      return true;
    } catch (error) {
      console.error(`Failed to loadsound ${soundId}`);
      return false;
    }
  }

  // Play functionality
  async playsound(soundId) {
    const audio = this.audioElements.get(soundId);

    if (audio) {
      try {
        await audio.play();
        return true;
      } catch (error) {
        console.error(`Failed to play sound`, error);
        return false;
      }
    }
  }

  // Pausing a specific sound Functionality
  pauseSound(soundId) {
    const audio = this.audioElements.get(soundId);
    if (audio && !audio.paused) {
      audio.pause();
    }
  }

  //Set volume for a specific
  setVolume(soundId, volume) {
    const audio = this.audioElements.get(soundId);
    if (!audio) {
      console.error(`Sound${soundId} not found`);
      return true;
    }
    audio.volume = volume / 100;
  }

  // Play All sounds
  playAll() {
    for (const [soundId, audio] of this.audioElements) {
      if (audio.paused) {
        audio.play();
      }
    }
    this.isPlaying = true;
  }
  // Pause all sounds
  pauseAll() {
    for (const [soundId, audio] of this.audioElements) {
      if (!audio.paused) {
        audio.pause();
      }
    }
    this.isPlaying = false;
  }
  // Stop all sounds
  StopAll() {
    for (const [soundId, audio] of this.audioElements) {
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0; //Reset to begining
    }
    this.isPlaying = false;
  }
}
