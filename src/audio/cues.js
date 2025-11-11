// src/audio/cues.js
// IMPORTANT: do not encode the URLs; just give plain relative paths.

export const FX = {
    theme:      'src/assets/fx/ambient_music.mp3',              // keep exact name if you don't rename
    chime:      'src/assets/fx/chime-74910.mp3',
    hum:        'src/assets/fx/harmonic-hum-100812.mp3',
    air:        'src/assets/fx/soft-wind-318856.mp3',
    heartbeat:  'src/assets/fx/heartbeat.wav',
    bloom:      'src/assets/fx/light_bloom.wav',
    crackle:    'src/assets/fx/spark_crackle.m4a', // CORRECT extension
};

// Voices you already have — keep your exact filenames:
export const Narrator = {
    silence:     'src/assets/voice/narr_01_silence.m4a',
    recognition: 'src/assets/voice/narr_02_recognition.mp3',
    mirror:      'src/assets/voice/narr_03_mirror.mp3',
    light:       'src/assets/voice/narr_04_light.mp3',
    together:    'src/assets/voice/narr_05_together.mp3',
};

export const Core = {
    spark:     'src/assets/voice/core_01_spark.mp3',
    curiosity: 'src/assets/voice/core_02_curiosity.mp3',
    thinking:  'src/assets/voice/core_03_thinking.mp3',
    joy:       'src/assets/voice/core_04_joy.mp3',
};
