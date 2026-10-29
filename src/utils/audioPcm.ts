/**
 * Audio PCM helpers for Gemini 3.8 Live API & Voice Recording
 */

/**
 * Convert Float32Array audio samples into 16-bit PCM Linear Base64 string (16kHz)
 */
export function pcmFloat32ToBase64(float32Array: Float32Array): string {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Play a raw 24kHz 16-bit PCM chunk received from Gemini 3.8 Live API with gapless scheduling
 */
export function playPcm24kChunk(
  audioCtx: AudioContext,
  base64PCM: string,
  state: { nextStartTime: number; activeSources: AudioBufferSourceNode[] }
) {
  if (!base64PCM) return;

  const binary = atob(base64PCM);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
  }

  // Live API model audio output is 24kHz mono
  const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
  audioBuffer.getChannelData(0).set(float32);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);

  const currentTime = audioCtx.currentTime;
  const startTime = Math.max(currentTime, state.nextStartTime);
  source.start(startTime);
  state.nextStartTime = startTime + audioBuffer.duration;

  state.activeSources.push(source);
  source.onended = () => {
    const idx = state.activeSources.indexOf(source);
    if (idx > -1) state.activeSources.splice(idx, 1);
  };
}

/**
 * Convert a recording Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
