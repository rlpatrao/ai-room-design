export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Gemini TTS usually returns raw PCM at 24kHz.
  // Note: If the format changes to WAV/MP3 in future updates, we might use ctx.decodeAudioData directly.
  // For 'gemini-2.5-flash-preview-tts', it often returns raw PCM in the inlineData. 
  // However, usually we might get a container format if specified or just raw pcm. 
  // The provided guidelines suggest raw PCM decoding manually.
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function playAudioBuffer(buffer: AudioBuffer): Promise<void> {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
}

export function arrayBufferToBlobUrl(buffer: ArrayBuffer, mimeType: string = 'audio/wav'): string {
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
}

// Helper to convert AudioBuffer to WAV for broader HTML5 audio support if needed
export function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferOut = new ArrayBuffer(length);
    const view = new DataView(bufferOut);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(36 + buffer.length * 2); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this example)

    setUint32(0x61746164); // "data" - chunk
    setUint32(buffer.length * numOfChan * 2); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([bufferOut], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos + offset, data, true);
        offset += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos + offset, data, true);
        offset += 4;
    }
}