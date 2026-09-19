/* Re-encode the hero background loop for the web.

   The master is 1280x720 @ 5.5 Mbps with a stereo audio track — 22MB for a clip that
   plays muted, behind a dark scrim, as a decorative background. This strips the audio,
   drops the bitrate to something sane for that job, and moves the moov atom to the
   front so playback can start before the file finishes downloading.

   Masters in assets/videos are left untouched.

   Run: node scripts/optimize-video.js */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const DIR = path.join(__dirname, '..', 'assets', 'videos');
const SRC = path.join(DIR, 'hero.mp4');
const OUT_MP4 = path.join(DIR, 'hero-web.mp4');
const OUT_WEBM = path.join(DIR, 'hero-web.webm');

const mb = f => (fs.statSync(f).size / 1048576).toFixed(2) + 'MB';

const common = [
  '-i', SRC,
  '-an',                        // muted background: the audio track is dead weight
  '-vf', 'scale=1280:-2,fps=25',
];

console.log(`source  ${mb(SRC)}`);

execFileSync(ffmpeg, [
  '-y', ...common,
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '30',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',    // start playing before the whole file arrives
  OUT_MP4,
], { stdio: ['ignore', 'ignore', 'pipe'] });
console.log(`hero-web.mp4   ${mb(OUT_MP4)}`);

/* VP9 is meaningfully smaller again where the browser supports it. */
execFileSync(ffmpeg, [
  '-y', ...common,
  '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-cpu-used', '3',
  OUT_WEBM,
], { stdio: ['ignore', 'ignore', 'pipe'] });
console.log(`hero-web.webm  ${mb(OUT_WEBM)}`);
