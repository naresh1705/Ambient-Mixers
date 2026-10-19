export class PresetManager {
  constructor() {
    this.customPresets = this.loadCustomPresets();
  }

  // Load Items from local storage
  loadCustomPresets() {
    const stored = localStorage.getItem("ambientMixerPresets");
    return stored ? JSON.parse(stored) : {};
  }

  //Load Presets by Id
  loadPresets(presetId) {
    return this.customPresets[presetId] || null;
  }

  // Save Items to the local storage
  saveCustomPresets() {
    localStorage.setItem(
      "ambientMixerPresets",
      JSON.stringify(this.customPresets),
    );
  }

  // Save current Preset Mixers
  savePreset(name, soundStates) {
    const presetId = `custom-${Date.now()}`;

    //create preset object only with playing sounds
    const preset = {
      name,
      sounds: {},
    };
    for (const [soundId, volume] of Object.entries(soundStates)) {
      if (volume > 0) {
        preset.sounds[soundId] = volume;
      }
    }
    this.customPresets[presetId] = preset;
    this.saveCustomPresets();
    return presetId;
  }
  // CheckPresetname Exists
  presetNameExists(name) {
    return Object.values(this.customPresets).some(
      (preset) => preset.name == name,
    );
  }
  // Delete a custom Preset

  deletePreset(presetId) {
    if (this.customPresets[presetId]) {
      delete this.customPresets[presetId];
      this.saveCustomPresets();
      return true;
    }
  }
}
