import test from 'node:test';
import assert from 'node:assert/strict';

test('Audio PCM & WAV Synthesis Tests', async (t) => {
  // Float32 to 16-bit PCM Linear Base64 converter (matching src/utils/audioPcm.ts)
  function pcmFloat32ToBase64(float32Array) {
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
    return Buffer.from(binary, 'binary').toString('base64');
  }

  // 44-byte standard WAV header generator (matching server.ts createWavHeader)
  function createWavHeader(pcmByteLength, sampleRate = 48000, numChannels = 2) {
    const buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + pcmByteLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
    buffer.writeUInt16LE(numChannels * 2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    buffer.write('data', 36);
    buffer.writeUInt32LE(pcmByteLength, 40);
    return buffer;
  }

  // Test 1: Float32 to 16-bit PCM Linear Base64 encoding
  await t.test('1. Float32 to 16-bit PCM Linear Base64 encoding', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
    const base64 = pcmFloat32ToBase64(samples);
    assert.ok(typeof base64 === 'string', 'Base64 must be a string');
    assert.ok(base64.length > 0, 'Base64 output must not be empty');

    // Decode and verify
    const rawBuffer = Buffer.from(base64, 'base64');
    assert.equal(rawBuffer.length, samples.length * 2, 'Decoded 16-bit PCM buffer should have 2 bytes per sample');

    const int16 = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset, samples.length);
    assert.equal(int16[0], 0, 'Zero sample must be 0');
    assert.ok(int16[1] > 16000 && int16[1] < 16500, '0.5 sample must scale around ~16383');
    assert.ok(int16[2] < -16000 && int16[2] > -16500, '-0.5 sample must scale around ~-16384');
    assert.equal(int16[3], 32767, '1.0 sample must be max positive 16-bit int 32767');
    assert.equal(int16[4], -32768, '-1.0 sample must be min negative 16-bit int -32768');
  });

  // Test 2: Audio Clipping Guards
  await t.test('2. Float32 clipping guard clamps extreme audio spikes safely', () => {
    const clippedSamples = new Float32Array([2.5, -5.0]);
    const base64 = pcmFloat32ToBase64(clippedSamples);
    const rawBuffer = Buffer.from(base64, 'base64');
    const int16 = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset, 2);

    assert.equal(int16[0], 32767, 'Spike above 1.0 must clamp to 32767');
    assert.equal(int16[1], -32768, 'Spike below -1.0 must clamp to -32768');
  });

  // Test 3: 44-byte Standard WAV Header Structure
  await t.test('3. WAV header generator formats exact 44-byte RFC RIFF header', () => {
    const pcmLength = 96000; // e.g. 1 second of 48kHz 16-bit mono or 0.5s stereo
    const sampleRate = 48000;
    const channels = 2;

    const header = createWavHeader(pcmLength, sampleRate, channels);

    assert.equal(header.length, 44, 'Standard PCM WAV header must be exactly 44 bytes');
    assert.equal(header.toString('ascii', 0, 4), 'RIFF', 'Magic header must be RIFF');
    assert.equal(header.readUInt32LE(4), 36 + pcmLength, 'Chunk size must be 36 + pcmLength');
    assert.equal(header.toString('ascii', 8, 12), 'WAVE', 'Format must be WAVE');
    assert.equal(header.toString('ascii', 12, 16), 'fmt ', 'Subchunk1 ID must be fmt ');
    assert.equal(header.readUInt32LE(16), 16, 'Subchunk1 size must be 16 for PCM');
    assert.equal(header.readUInt16LE(20), 1, 'AudioFormat must be 1 (uncompressed PCM)');
    assert.equal(header.readUInt16LE(22), channels, 'NumChannels must match 2');
    assert.equal(header.readUInt32LE(24), sampleRate, 'SampleRate must match 48000');
    assert.equal(header.readUInt32LE(28), sampleRate * channels * 2, 'ByteRate must equal sampleRate * channels * 2');
    assert.equal(header.readUInt16LE(32), channels * 2, 'BlockAlign must equal channels * 2');
    assert.equal(header.readUInt16LE(34), 16, 'BitsPerSample must be 16');
    assert.equal(header.toString('ascii', 36, 40), 'data', 'Subchunk2 ID must be data');
    assert.equal(header.readUInt32LE(40), pcmLength, 'Data subchunk size must match pcmLength');
  });
});
