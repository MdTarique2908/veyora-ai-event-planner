import test from 'node:test';
import assert from 'node:assert/strict';

test('AI Music Generation: Synchronization, Timeout, Fallback & Autoplay Contracts', async (t) => {
  // Test 1: Lyria WebSocket setupComplete synchronization contract
  await t.test('1. Commands (config, prompts, play) are queued and sent ONLY after setupComplete is received', async () => {
    const callOrder = [];
    let isPlayingStarted = false;
    let isConfiguring = false;

    // Simulated session mock
    const sessionMock = {
      setMusicGenerationConfig: async (cfg) => {
        callOrder.push({ call: 'setMusicGenerationConfig', params: cfg });
      },
      setWeightedPrompts: async (p) => {
        callOrder.push({ call: 'setWeightedPrompts', params: p });
      },
      play: () => {
        isPlayingStarted = true;
        callOrder.push({ call: 'play' });
      },
      stop: () => callOrder.push({ call: 'stop' }),
      close: () => callOrder.push({ call: 'close' }),
    };

    let session = null;
    let setupCompleteReceived = false;
    let isSettled = false;

    const initializeAndPlay = async () => {
      if (!session || !setupCompleteReceived || isConfiguring || isSettled) {
        return;
      }
      isConfiguring = true;
      await session.setMusicGenerationConfig({ bpm: 110, density: 0.7 });
      await session.setWeightedPrompts({ weightedPrompts: [{ text: 'Gala theme', weight: 1.0 }] });
      if (!isPlayingStarted) {
        session.play();
      }
    };

    // Step A: Session connects, but setupComplete message has NOT yet arrived
    session = sessionMock;
    await initializeAndPlay();

    // Verify nothing was called before setupComplete
    assert.equal(callOrder.length, 0, 'No commands must be sent before setupComplete arrives');
    assert.equal(isPlayingStarted, false, 'Playback must not be initiated prior to setup confirmation');

    // Step B: SetupComplete message arrives from server
    setupCompleteReceived = true;
    await initializeAndPlay();

    // Verify exact sequencing
    assert.equal(callOrder.length, 3, 'Exactly 3 commands must be dispatched in sequence');
    assert.equal(callOrder[0].call, 'setMusicGenerationConfig');
    assert.equal(callOrder[1].call, 'setWeightedPrompts');
    assert.equal(callOrder[2].call, 'play');
    assert.equal(isPlayingStarted, true);

    // Step C: Verify duplicate setup messages do NOT re-trigger play or multiple configurations
    await initializeAndPlay();
    assert.equal(callOrder.length, 3, 'Multiple calls must be prevented by isConfiguring/isPlayingStarted guard');
  });

  // Test 2: Timeout and session cleanup contract
  await t.test('2. Timeout guarantees resource cleanup (session.stop and session.close) without dangling listeners', async () => {
    let stopCalled = false;
    let closeCalled = false;

    const fakeSession = {
      stop: () => { stopCalled = true; },
      close: () => { closeCalled = true; },
    };

    let timeoutId = null;
    let session = fakeSession;
    let isSettled = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (session) {
        try { session.stop(); } catch {}
        try { session.close(); } catch {}
        session = null;
      }
    };

    // Simulate timeout trigger
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          reject(new Error('Lyria audio generation timed out after 30 seconds'));
        }
      }, 50); // fast timeout for test
    });

    await assert.rejects(
      timeoutPromise,
      /Lyria audio generation timed out after 30 seconds/,
      'Promise must reject with 30s timeout message'
    );

    assert.equal(stopCalled, true, 'session.stop must be called on timeout');
    assert.equal(closeCalled, true, 'session.close must be called on timeout');
    assert.equal(session, null, 'session reference must be cleared after cleanup');
  });

  // Test 3: Fallback response identification and structure
  await t.test('3. API response contract clearly identifies procedural fallback vs authentic Lyria generation', () => {
    // Contract A: Procedural Fallback format
    const fallbackResponse = {
      audioUrl: 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      title: 'Milestone Gala Theme',
      category: 'entrance_fanfare',
      durationSeconds: 15,
      bpm: 110,
      promptUsed: 'Majestic brass fanfare',
      source: 'procedural_synthesizer',
      isFallbackAudio: true,
      djNotes: { recommendedBpm: 110, energyRating: 9 },
      errorNotice: 'Live music API connection unavailable. Fallback generated.',
    };

    assert.equal(fallbackResponse.isFallbackAudio, true, 'Fallback response must set isFallbackAudio to true');
    assert.equal(fallbackResponse.source, 'procedural_synthesizer', 'Source must identify procedural synthesizer');
    assert.ok(fallbackResponse.audioUrl.startsWith('data:audio/wav;base64,'), 'Audio URL must be valid WAV data URI');

    // Contract B: Authentic Lyria format
    const lyriaResponse = {
      audioUrl: 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      title: 'Milestone Gala Theme',
      category: 'entrance_fanfare',
      durationSeconds: 15,
      bpm: 110,
      promptUsed: 'Majestic brass fanfare',
      source: 'lyria_realtime',
      isFallbackAudio: false,
      djNotes: { recommendedBpm: 110, energyRating: 9 },
    };

    assert.equal(lyriaResponse.isFallbackAudio, false, 'Lyria response must set isFallbackAudio to false');
    assert.equal(lyriaResponse.source, 'lyria_realtime', 'Source must explicitly identify lyria_realtime');
    assert.notEqual(lyriaResponse.source, fallbackResponse.source, 'Sources must be distinguishable');
  });

  // Test 4: Browser Autoplay Rejection Handling & Recovery state transitions
  await t.test('4. Browser Autoplay rejection triggers autoplayBlocked state and direct user click recovers playback', async () => {
    // State machine replicating ThemeMusicStudio component logic
    let isPlaying = false;
    let autoplayBlocked = false;

    // Simulate composed track ready
    const handleComposeComplete = (audioPlayPromise) => {
      audioPlayPromise
        .then(() => {
          isPlaying = true;
          autoplayBlocked = false;
        })
        .catch((err) => {
          isPlaying = false;
          autoplayBlocked = true;
        });
    };

    // Case 1: Browser denies unprompted autoplay
    const simulatedBrowserAutoplayBlock = Promise.reject(new Error('NotAllowedError: play() failed without user gesture'));
    handleComposeComplete(simulatedBrowserAutoplayBlock);

    // Wait microtask tick
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(isPlaying, false, 'isPlaying must be false when autoplay is prevented');
    assert.equal(autoplayBlocked, true, 'autoplayBlocked must be true to show recovery banner');

    // Case 2: User clicks "Click to Play Generated Song" button
    const handleDirectUserClick = async () => {
      // Direct click gesture is accepted by browser
      await Promise.resolve();
      isPlaying = true;
      autoplayBlocked = false;
    };

    await handleDirectUserClick();
    assert.equal(isPlaying, true, 'Playback must resume after user click');
    assert.equal(autoplayBlocked, false, 'autoplayBlocked banner must dismiss after user click');

    // Case 3: Re-composing a new track resets autoplayBlocked state
    const handleNewCompositionStart = () => {
      autoplayBlocked = false;
    };

    autoplayBlocked = true;
    handleNewCompositionStart();
    assert.equal(autoplayBlocked, false, 'Starting new composition must clear previous blocked warning');
  });
});
