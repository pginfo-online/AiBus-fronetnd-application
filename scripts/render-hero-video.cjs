const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegPath = require('ffmpeg-static');
console.log('Using ffmpeg at:', ffmpegPath);

const projectRoot = path.resolve(__dirname, '..');
const assetsHeroDir = path.join(projectRoot, 'src', 'assets', 'hero');
const publicHeroDir = path.join(projectRoot, 'public', 'hero');

if (!fs.existsSync(publicHeroDir)) {
  fs.mkdirSync(publicHeroDir, { recursive: true });
}

const imgAdventure = path.join(assetsHeroDir, 'adventure-bus.jpg').replace(/\\/g, '/');
const imgVillage = path.join(assetsHeroDir, 'village-bus.jpg').replace(/\\/g, '/');
const imgCity = path.join(assetsHeroDir, 'city-bus.jpg').replace(/\\/g, '/');

console.log('Checking source images...');
[imgAdventure, imgVillage, imgCity].forEach(img => {
  if (!fs.existsSync(img)) {
    console.error('Image missing:', img);
    process.exit(1);
  }
  console.log('Found:', img);
});

const fps = 30;
const sceneDuration = 6.0; // 6 seconds per scene
const fadeDuration = 1.5; // 1.5s smooth crossfade
const sceneFrames = Math.round(sceneDuration * fps); // 180 frames

// Scene 1: Adventure (Slow zoom-in from 1.0 to 1.15, panning down-right towards the coach on the mountain road)
const filterScene1 = `[0:v]scale=3840:2160,zoompan=z='min(zoom+0.0007,1.15)':x='iw/2-(iw/zoom/2)+((in/${sceneFrames})*120)':y='ih/2-(ih/zoom/2)+((in/${sceneFrames})*60)':d=${sceneFrames}:s=1920x1080:fps=${fps},format=yuv420p[v1]`;

// Scene 2: Village (Gentle pan from right to left, smooth floating zoom 1.15 to 1.03)
const filterScene2 = `[1:v]scale=3840:2160,zoompan=z='max(1.15-(in/${sceneFrames})*0.12,1.03)':x='iw/2-(iw/zoom/2)-((in/${sceneFrames})*120)':y='ih/2-(ih/zoom/2)+((in/${sceneFrames})*40)':d=${sceneFrames}:s=1920x1080:fps=${fps},format=yuv420p[v2]`;

// Scene 3: City (Lavish night city, slow dramatic zoom 1.02 to 1.16 towards glowing street and coach)
const filterScene3 = `[2:v]scale=3840:2160,zoompan=z='min(1.02+(in/${sceneFrames})*0.14,1.16)':x='iw/2-(iw/zoom/2)+((in/${sceneFrames})*70)':y='ih/2-(ih/zoom/2)+((in/${sceneFrames})*80)':d=${sceneFrames}:s=1920x1080:fps=${fps},format=yuv420p[v3]`;

// Scene 4: Seamless loop lead-in back to Adventure (fade into start of Adventure)
const loopFrames = Math.round(fadeDuration * fps);
const filterScene4 = `[0:v]scale=3840:2160,zoompan=z='min(zoom+0.0007,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${loopFrames + 15}:s=1920x1080:fps=${fps},format=yuv420p[v4]`;

// Crossfade offsets:
// v1 (6s) -> v2 (6s) at 4.5s (duration of v12 = 10.5s)
// v12 (10.5s) -> v3 (6s) at 9.0s (duration of v123 = 15.0s)
// v123 (15.0s) -> v4 (2s) at 13.5s (duration of vout = 15.0s seamless loop!)
const offset1 = (sceneDuration - fadeDuration).toFixed(2); // 4.50
const offset2 = (sceneDuration * 2 - fadeDuration * 2).toFixed(2); // 9.00
const offset3 = (sceneDuration * 3 - fadeDuration * 3).toFixed(2); // 13.50

const complexFilter = [
  filterScene1,
  filterScene2,
  filterScene3,
  filterScene4,
  `[v1][v2]xfade=transition=fade:duration=${fadeDuration}:offset=${offset1}[v12]`,
  `[v12][v3]xfade=transition=fade:duration=${fadeDuration}:offset=${offset2}[v123]`,
  `[v123][v4]xfade=transition=fade:duration=${fadeDuration}:offset=${offset3}[vout]`
].join(';');

const outMp4Public = path.join(publicHeroDir, 'bus-journey-hero.mp4').replace(/\\/g, '/');
const outMp4Asset = path.join(assetsHeroDir, 'bus-journey-hero.mp4').replace(/\\/g, '/');
const outWebmPublic = path.join(publicHeroDir, 'bus-journey-hero.webm').replace(/\\/g, '/');

console.log('Rendering 15-second seamless loop cinematic MP4 video...');
// Note: Do NOT use -loop 1 with zoompan because zoompan handles frame generation per single image input
const cmdMp4 = `"${ffmpegPath}" -y -i "${imgAdventure}" -i "${imgVillage}" -i "${imgCity}" -filter_complex "${complexFilter}" -map "[vout]" -c:v libx264 -preset medium -crf 18 -movflags +faststart -pix_fmt yuv420p "${outMp4Public}"`;

console.log('Running:', cmdMp4);
try {
  execSync(cmdMp4, { stdio: 'inherit' });
  console.log('Successfully generated MP4:', outMp4Public);
  fs.copyFileSync(outMp4Public, outMp4Asset);
  console.log('Copied MP4 to assets:', outMp4Asset);
} catch (err) {
  console.error('Error rendering MP4:', err);
  process.exit(1);
}

console.log('Rendering fast WebM copy...');
const cmdWebm = `"${ffmpegPath}" -y -i "${outMp4Public}" -c:v libvpx-vp9 -crf 30 -b:v 0 -deadline realtime -cpu-used 5 "${outWebmPublic}"`;
try {
  execSync(cmdWebm, { stdio: 'inherit' });
  console.log('Successfully generated WebM:', outWebmPublic);
} catch (err) {
  console.log('WebM generation note:', err.message);
}

console.log('Hero video production complete!');

