/**
 * Validate YouTube URL
 */
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const u = new URL(url.trim());
    const validHosts = [
      'youtube.com',
      'www.youtube.com',
      'youtu.be',
      'm.youtube.com',
      'music.youtube.com',
    ];
    return validHosts.includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Validate download settings
 */
function validateSettings(settings) {
  const errors = [];

  const validQualities = ['max', '2160', '1440', '1080', '720', '480', '360', '240', '144'];
  const validCodecs = ['h264', 'av1', 'vp9'];
  const validAudioFormats = ['best', 'mp3', 'opus', 'ogg', 'wav'];
  const validContainers = ['auto', 'mp4', 'webm', 'mkv'];
  const validAudioQualities = ['128', '192', '256', '320'];

  if (settings.videoQuality && !validQualities.includes(settings.videoQuality)) {
    errors.push(`Invalid video quality: ${settings.videoQuality}`);
  }

  if (settings.videoCodec && !validCodecs.includes(settings.videoCodec)) {
    errors.push(`Invalid video codec: ${settings.videoCodec}`);
  }

  if (settings.audioFormat && !validAudioFormats.includes(settings.audioFormat)) {
    errors.push(`Invalid audio format: ${settings.audioFormat}`);
  }

  if (settings.fileContainer && !validContainers.includes(settings.fileContainer)) {
    errors.push(`Invalid file container: ${settings.fileContainer}`);
  }

  if (settings.audioQuality && !validAudioQualities.includes(settings.audioQuality)) {
    errors.push(`Invalid audio quality: ${settings.audioQuality}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate download mode
 */
function isValidMode(mode) {
  return ['auto', 'audio', 'mute'].includes(mode);
}

module.exports = {
  isValidYouTubeUrl,
  validateSettings,
  isValidMode,
};
