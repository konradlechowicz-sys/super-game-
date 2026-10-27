// When each shot of the teaser starts, in seconds. The cuts sit on the bars of the music (art/2.0/audio, made with
// Suno; 142.2 BPM, a bar is 1.6875 s): the gameplay starts on the drop, the combo on a downbeat, and the title cuts
// to the track's final hit.
export const BAR = 1.6875;
export const T = { hangar: 2 * BAR, game: 3 * BAR, combo: 5 * BAR, boss: 6 * BAR, title: 7.5 * BAR, end: 15 };
// where in the track the teaser starts (two bars before the drop at 35.5 s) and where the final hit is
export const MUSIC = { file: 'art/2.0/audio/void-blaster-theme-suno.mp3', start: 35.5 - 3 * BAR, ending: 188.52 };
