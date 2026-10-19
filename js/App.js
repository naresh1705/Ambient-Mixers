import { PresetManager } from "./Presetmanager.js";
import { sounds, defaultPresets } from "./Soundata.js";
import { soundManager } from "./soundManager.js";
import { UI } from "./Ui.js";
import { Timer } from "./timer.js";

class AmbientMixer {
  constructor() {
    this.Presetmanager = new PresetManager();
    this.soundManager = new soundManager();
    this.Ui = new UI();
    this.timer = new Timer(
      () => this.onTimerComplete(),
      (minutes, seconds) => this.Ui.updateTimerDisplay(minutes, seconds),
    );
    this.masterVolume = 100;
    this.currentSoundstate = {};
    this.isInitialized = false;
  }

  init() {
    try {
      // Initialize UI
      this.Ui.init();

      //Render sound cards using our sound data
      this.Ui.renderSoundCards(sounds);

      //Load custom presets button
      this.loadCustomPresetsUI();

      this.setUpEventListeners();

      //Load all sound files
      this.loadAllSounds();

      //Initialize sound state after loading sounds
      sounds.forEach((sound) => {
        this.currentSoundstate[sound.id] = 0;
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize app", error);
    }
  }

  // Setting up EventListeners
  setUpEventListeners() {
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".play-btn")) {
        const sound = e.target.closest(".play-btn").dataset.sound;
        await this.toggleSound(sound);
      }
      //check if delete button was clicked
      if (e.target.closest(".delete-preset")) {
        e.stopPropagation();

        const presetId = e.target.closest(`.delete-preset`).dataset.preset;
        this.deleteCustomPreset(presetId);
        return;
      }

      // check if default preset is clicked
      if (e.target.closest(".preset-btn")) {
        const presetKey = e.target.closest(".preset-btn").dataset.preset;
        await this.loadPreset(presetKey);
      }
      //For custom Presets
      if (e.target.closest(".custom-preset-btn")) {
        const presetKey = e.target.closest(".custom-preset-btn").dataset.preset;
        await this.loadPreset(presetKey, true);
      }
    });
    // Handle volume sliders
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("volume-slider")) {
        const soundId = e.target.dataset.sound;
        const volume = parseInt(e.target.value);
        this.setSoundVolume(soundId, volume);
      }
    });
    // Handle master volume slider
    const mastervolumeSlider = document.getElementById("masterVolume");
    if (mastervolumeSlider) {
      mastervolumeSlider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value);
        this.setMasterVolume(volume);
      });
    }
    // Handle master playpause button
    if (this.Ui.playPauseButton) {
      this.Ui.playPauseButton.addEventListener("click", () => {
        this.toggleAllSounds();
      });
    }
    // Handle reset button
    if (this.Ui.resetButton) {
      this.Ui.resetButton.addEventListener("click", () => {
        this.resetAll();
      });
    }

    // Save Preset button
    const saveBtn = document.getElementById("savePreset");
    saveBtn.addEventListener("click", () => {
      this.showSavePresetModal();
    });
    // confirmSave Preset button
    const confirmSaveBtn = document.getElementById("confirmSave");
    confirmSaveBtn.addEventListener("click", () => {
      this.saveCurrentPreset();
    });
    // cancelSave Preset button
    const cancelsaveBtn = document.getElementById("cancelSave");
    cancelsaveBtn.addEventListener("click", () => {
      this.Ui.hideModal();
    });

    //close modal if backdrop clicked
    if (this.Ui.modal) {
      this.Ui.modal.addEventListener("click", (e) => {
        if (e.target === this.Ui.modal) {
          this.Ui.hideModal();
        }
      });
    }

    // Timer Select
    const timerselect = document.getElementById("timerSelect");
    if (timerselect) {
      timerselect.addEventListener("change", (e) => {
        // const minutes = parseInt(e.target.value);
        const minutes = 0.1;
        if (minutes > 0) {
          this.timer.start(minutes);
        } else {
          this.timer.stop();
        }
      });
    }

    // If the theme toggle clicked
    if (this.Ui.themeToggle) {
      this.Ui.themeToggle.addEventListener("click", () => {
        this.Ui.toggleTheme();
      });
    }
  }

  loadAllSounds() {
    sounds.forEach((sound) => {
      const audioUrl = `audio/${sound.file}`;
      const success = this.soundManager.loadSound(sound.id, audioUrl);
      if (!success) {
        console.warn(`Could not load sound ${sound.name} from ${audioUrl}`);
      }
    });
  }
  // Toggle all Sounnds
  toggleAllSounds() {
    if (this.soundManager.isPlaying) {
      this.soundManager.pauseAll();
      this.Ui.updateMainPlaybutton(false);
      sounds.forEach((sound) => {
        this.Ui.updateMainPlaybutton(sounds.id, false);
      });
    } else {
      for (const [soundId, audio] of this.soundManager.audioElements) {
        const card = document.querySelector(`[data-sound="${soundId}"]`);
        const slider = card?.querySelector(".volume-slider");
        if (slider) {
          let volume = parseInt(slider.value);
          if (volume === 0) {
            volume = 50;
            slider.value = 50;
            this.Ui.updateVolumeDisplay(soundId, 50);
          }

          this.currentSoundstate[soundId] = volume;

          const effectiveVolume = (volume * this.masterVolume) / 100;
          this.volume = effectiveVolume / 100;
          this.Ui.updateSoundPlayButton(soundId, true);
        }
      }
      //Play all sounds
      this.soundManager.playAll();
      this.Ui.updateMainPlaybutton(true);
    }
  }

  async toggleSound(sound) {
    const audio = this.soundManager.audioElements.get(sound);

    if (!audio) {
      console.error(`Sound ${sound}Not Found`);
      return false;
    }
    if (audio.paused) {
      // Get current slider value
      const card = document.querySelector(`[data-sound="${sound}"]`);
      const slider = document.querySelector(".volume-slider");
      let volume = parseInt(slider.value);
      if (volume === 0) {
        volume = 50;
        this.Ui.updateVolumeDisplay(sound, volume);
      }

      // Set current sound state
      this.currentSoundstate[sound] = volume;

      this.soundManager.setVolume(sound, volume);
      await this.soundManager.playsound(sound);
      this.Ui.updateSoundPlayButton(sound, true);
    } else {
      this.soundManager.pauseSound(sound);
      this.currentSoundstate[sound] = 0;
      this.Ui.updateSoundPlayButton(sound, false);
      // Set current sound state to 0
      this.currentSoundstate[sound] = 0;
    }

    this.updateMainPlayButtonState();
  }

  // set sound Volume
  setSoundVolume(soundId, volume) {
    this.currentSoundstate[soundId] = volume;
    const effectiveVolume = (volume * this.masterVolume) / 100;
    const audio = this.soundManager.audioElements.get(soundId);
    if (audio) {
      audio.volume = effectiveVolume / 100;
    }

    //Update in the UI
    this.Ui.updateVolumeDisplay(soundId, volume);

    this.updateMainPlayButtonState();
  }

  // Set master Volume
  setMasterVolume(volume) {
    this.masterVolume = volume;
    const masterVolumevalue = document.getElementById("masterVolumeValue");
    if (masterVolumevalue) {
      masterVolumevalue.textContent = `${volume}%`;
    }

    this.applyMasterVolumeToAll();
  }

  applyMasterVolumeToAll() {
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        const card = document.querySelector(`[data-sound="${soundId}"]`);
        const slider = card?.querySelector(".volume-slider");
        if (slider) {
          const individualVolume = parseInt(slider.value);
          const effectiveVolume = (individualVolume * this.masterVolume) / 100;
          audio.volume = effectiveVolume / 100;
        }
      }
    }
  }

  updateMainPlayButtonState() {
    let anySoundPlaying = false;
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        anySoundPlaying = true;
        break;
      }
      this.soundManager.isPlaying = anySoundPlaying;
      this.Ui.updateMainPlaybutton(anySoundPlaying);
    }
  }

  //Reset everything to default state
  resetAll() {
    // Stop all sounds
    this.soundManager.StopAll();

    // Reset the master volume
    this.masterVolume = 100;

    //Reset Timer
    this.timer.stop();
    if (this.Ui.timerSelect) {
      this.Ui.timerSelect.value = "0";
    }
    //Reset Active Preset
    this.Ui.setActivePreset(null);

    //Reset sound states
    sounds.forEach((sound) => {
      this.currentSoundstate[sound.id] = 0;
    });

    // Reset UI
    this.Ui.resetUI();
  }

  // Load a Preset Config
  loadPreset(presetkey, custom = false) {
    let preset;
    if (custom) {
      preset = this.Presetmanager.loadPresets(presetkey);
    } else {
      preset = defaultPresets[presetkey];
      if (!preset) {
        console.error(`Preset${presetkey} not found`);
        return;
      }
    }

    // Stop all sounds
    this.soundManager.StopAll();

    // Reset all volumes to 0
    sounds.forEach((sound) => {
      this.currentSoundstate[sound.id] = 0;
      this.Ui.updateVolumeDisplay(sound.id, 0);
      this.Ui.updateSoundPlayButton(sound.id, false);
    });

    //Apply the preset volumes
    for (const [soundId, volume] of Object.entries(preset.sounds)) {
      this.currentSoundstate[soundId] = volume;

      // Update UI
      this.Ui.updateVolumeDisplay(soundId, volume);

      // Calculate effective volume
      const effectiveVolume = (volume * this.masterVolume) / 100;

      //Get audio element and set value
      const audio = this.soundManager.audioElements.get(soundId);
      if (audio) {
        audio.volume = effectiveVolume / 100;
        audio.play();
        this.Ui.updateSoundPlayButton(soundId, true);
      }
    }
    this.soundManager.isPlaying = true;
    this.Ui.updateMainPlaybutton(true);

    // Set Active presets

    if (presetkey) {
      this.Ui.setActivePreset(presetkey);
    }
  }
  showSavePresetModal() {
    const hasActiveSounds = Object.values(this.currentSoundstate).some(
      (v) => v > 0,
    );
    if (!hasActiveSounds) {
      alert("No active sounds for presets");
      return;
    }
    this.Ui.showModal();
  }

  // save Current Preset
  saveCurrentPreset() {
    const nameInput = document.getElementById("presetName");
    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter a  preset name");
      return;
    }
    if (this.Presetmanager.presetNameExists(name)) {
      alert(`A preset with this name${name} already exists`);
      return;
    }
    const presetId = this.Presetmanager.savePreset(
      name,
      this.currentSoundstate,
    );
    // Add custom Preset button UI
    this.Ui.addCustomPreset(name, presetId);

    this.Ui.hideModal();
    console.log(`${name} preset saved successfully with ID:${presetId}`);
  }

  //Load custom presets
  loadCustomPresetsUI() {
    const costumPresets = this.Presetmanager.customPresets;
    for (const [presetId, preset] of Object.entries(costumPresets)) {
      this.Ui.addCustomPreset(preset.name, presetId);
    }
  }
  // Delete custom Preset
  deleteCustomPreset(presetId) {
    if (this.Presetmanager.deletePreset(presetId)) {
      this.Ui.removeCustomPreset(presetId);
      console.log(`Preset${presetId}deleted successfully`);
    }
  }

  // Timer Callback
  onTimerComplete() {
    this.soundManager.pauseAll();
    this.Ui.updateMainPlaybutton(false);

    // Update Individual buttons
    sounds.forEach((sound) => {
      this.Ui.updateSoundPlayButton(sound.id, false);
    });

    // Reset the timer dropdown
    const timerSelect = document.getElementById("timerSelect");
    if (timerSelect) {
      timerSelect.value = "0";
    }

    //Clear and hide timer display
    if (this.Ui.timerDisplay) {
      this.Ui.timerDisplay.textContent = "";
      this.Ui.timerDisplay.classList.add("hidden");
    }
  }
}

// Initialize App When DOM is ready

document.addEventListener("DOMContentLoaded", () => {
  const app = new AmbientMixer();
  app.init();
});
