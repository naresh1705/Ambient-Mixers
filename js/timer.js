export class Timer {
  constructor(onComplete, onTick) {
    this.duration = 0;
    this.remaining = 0;
    this.intervalId = null;
    this.onComplete = onComplete;
    this.onTick = onTick;
    this.isRunning = true;
  }

  // Start Timer with minutes

  start(minutes) {
    if (minutes <= 0) {
      this.stop();
      return;
    }
    this.duration = minutes * 60;
    this.remaining = this.duration;

    // Clear the existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Update display
    this.updateDisplay();

    // set countdowwn
    this.intervalId = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  }

  //Stop Timer
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.duration = 0;
    this.remaining = 0;
    this.isRunning = false;
    this.updateDisplay();
  }

  // Timer Competed
  complete() {
    this.stop();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.remaining / 60);
    const seconds = this.remaining % 60;

    if (this.onTick) {
      this.onTick(minutes, seconds);
    }
  }
}
