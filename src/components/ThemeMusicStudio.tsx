import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Repeat,
  Radio,
  Check,
  AlertCircle,
  X,
  Disc3,
  Clock,
  Layers,
  Wand2,
} from 'lucide-react';
import { EventPlan, EventThemeTrack } from '../types/event';

interface ThemeMusicStudioProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

interface PresetOption {
  category: EventThemeTrack['category'];
  label: string;
  icon: string;
  defaultBpm: number;
  defaultDensity: number;
  durationSec: number;
  description: string;
  prompt: string;
}

export const ThemeMusicStudio: React.FC<ThemeMusicStudioProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const savedTracks: EventThemeTrack[] = plan.themeMusicTracks || [];

  // Active / Selected Track
  const [activeTrack, setActiveTrack] = useState<EventThemeTrack | null>(
    savedTracks.length > 0 ? savedTracks[0] : null
  );

  // Generation Form States
  const [selectedCategory, setSelectedCategory] = useState<EventThemeTrack['category']>('entrance_fanfare');
  const [customTitle, setCustomTitle] = useState('');
  const [bpm, setBpm] = useState<number>(115);
  const [density, setDensity] = useState<number>(0.75);
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [promptText, setPromptText] = useState<string>('');

  // Generation Status
  const [isComposing, setIsComposing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Audio Playback States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Canvas Visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Curated presets tailored to current plan
  const presets: PresetOption[] = [
    {
      category: 'entrance_fanfare',
      label: 'Grand Entrance Fanfare',
      icon: '🎺',
      defaultBpm: 115,
      defaultDensity: 0.85,
      durationSec: 15,
      description: 'Triumphant brass horns, celebratory timpani crescendo, and royal arrival flair.',
      prompt: `Majestic triumphant brass fanfare with rolling timpani drums, shimmering cymbals, and royal arrival brass section for ${plan.concept.title}. Uplifting, celebratory, breathtaking milestone crescendo.`,
    },
    {
      category: 'cocktail_ambient',
      label: 'Cocktail Hour Jazz',
      icon: '🍸',
      defaultBpm: 92,
      defaultDensity: 0.65,
      durationSec: 20,
      description: 'Sophisticated Fender Rhodes, warm walking double bass, and subtle brush drums.',
      prompt: `Warm atmospheric jazz lounge with soulful electric piano chords, walking acoustic upright bass, delicate jazz brush drums, and sophisticated cocktail party ambiance.`,
    },
    {
      category: 'dinner_acoustic',
      label: 'Dinner Acoustic Glow',
      icon: '🕯️',
      defaultBpm: 80,
      defaultDensity: 0.55,
      durationSec: 20,
      description: 'Intimate fingerstyle acoustic guitar, warm cello strings, and gentle melody.',
      prompt: `Warm and romantic acoustic fingerpicking guitar, soft lyrical cello harmony, gentle ambient piano, and cozy candlelit dinner celebration aesthetic.`,
    },
    {
      category: 'dance_peak',
      label: 'Peak Dance Groove',
      icon: '🪩',
      defaultBpm: 126,
      defaultDensity: 0.9,
      durationSec: 20,
      description: 'Infectious disco-funk bassline, vibrant synth brass stabs, and euphoric drive.',
      prompt: `Euphoric modern nu-disco dance beat, driving synth bass, vibrant brass stabs, funky rhythm guitar, and high-energy celebration dance floor momentum.`,
    },
    {
      category: 'farewell_warm',
      label: 'Sunset Send-Off & Afterglow',
      icon: '🌅',
      defaultBpm: 84,
      defaultDensity: 0.6,
      durationSec: 15,
      description: 'Soulful chords, sunset acoustic warmth, and heartfelt melodic resolution.',
      prompt: `Heartfelt nostalgic celebration outro with warm acoustic piano, gentle acoustic guitars, ambient sunset reverbs, and touching farewell atmosphere.`,
    },
  ];

  // Initialize prompt on category change
  useEffect(() => {
    const currentPreset = presets.find((p) => p.category === selectedCategory);
    if (currentPreset) {
      setPromptText(currentPreset.prompt);
      setBpm(currentPreset.defaultBpm);
      setDensity(currentPreset.defaultDensity);
      setDurationSeconds(currentPreset.durationSec);
      if (!customTitle || presets.some((p) => p.label === customTitle)) {
        setCustomTitle(currentPreset.label);
      }
    }
  }, [selectedCategory, plan.concept.title]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (!isLooping) setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLooping]);

  // Canvas Audio Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    let tick = 0;

    const numBars = 48;
    const barWidth = 6;
    const barGap = 4;
    canvas.width = numBars * (barWidth + barGap);
    canvas.height = 100;

    const primaryHex = plan.concept.colorPalette[0]?.hex || '#6366f1';
    const accentHex = plan.concept.colorPalette[1]?.hex || '#ec4899';

    const render = () => {
      if (!isMounted) return;
      tick += 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numBars; i++) {
        // Dynamic simulated spectrum when playing, or idle heartbeat wave
        const multiplier = isPlaying ? 1.0 : 0.2;
        const wave1 = Math.sin(tick * 2.5 + i * 0.3) * 0.5 + 0.5;
        const wave2 = Math.cos(tick * 3.8 + i * 0.5) * 0.3 + 0.5;
        const centerWeight = Math.sin((i / numBars) * Math.PI);
        const barHeight = Math.max(6, (wave1 * 0.6 + wave2 * 0.4) * 80 * centerWeight * multiplier);

        const x = i * (barWidth + barGap);
        const y = (canvas.height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, accentHex);
        grad.addColorStop(1, primaryHex);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, plan.concept.colorPalette]);

  // Handle Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.error('Audio play error:', e));
    }
  };

  // Handle Seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.85;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle Music Generation Call
  const handleComposeMusic = async () => {
    setIsComposing(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const payload = {
        title: customTitle || `${plan.concept.title} Theme`,
        category: selectedCategory,
        prompt: promptText,
        bpm,
        density,
        durationSeconds,
        eventDetails: {
          title: plan.concept.title,
          themeStyle: plan.input.themeStyle,
          vibeKeywords: plan.concept.vibeKeywords,
        },
      };

      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.audioUrl) {
        const newTrack: EventThemeTrack = {
          id: `mus-${Date.now()}`,
          title: data.title,
          category: data.category,
          audioUrl: data.audioUrl,
          durationSeconds: data.durationSeconds || durationSeconds,
          bpm: data.bpm,
          prompt: data.promptUsed,
          djNotes: data.djNotes ? `${data.djNotes.timelinePlacement}. Key: ${data.djNotes.keySuggestion}. Energy: ${data.djNotes.energyRating}/10.` : undefined,
          createdAt: new Date().toISOString(),
        };

        const updated = [newTrack, ...savedTracks];
        onUpdatePlan({
          ...plan,
          themeMusicTracks: updated,
        });

        setActiveTrack(newTrack);
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = newTrack.audioUrl;
          audioRef.current.play().catch(() => {});
        }

        setSuccessNotice(
          data.source === 'lyria_realtime'
            ? '🎵 Composed custom theme music using Google DeepMind Lyria Realtime Audio!'
            : '🎶 Generated custom celebration theme track using harmonic music synthesizer!'
        );
        setTimeout(() => setSuccessNotice(null), 4000);
      } else {
        throw new Error('No audio data received from server');
      }
    } catch (err: any) {
      console.error('Audio composition error:', err);
      setErrorNotice(err?.message || 'Failed to compose theme audio. Please try again.');
    } finally {
      setIsComposing(false);
    }
  };

  // Download WAV file
  const handleDownloadTrack = (trackToDownload?: EventThemeTrack) => {
    const t = trackToDownload || activeTrack;
    if (!t) return;

    const a = document.createElement('a');
    a.href = t.audioUrl;
    const safeTitle = (t.title || 'event-theme-music')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    a.download = `${safeTitle}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Delete Track
  const handleDeleteTrack = (id: string) => {
    const filtered = savedTracks.filter((t) => t.id !== id);
    onUpdatePlan({
      ...plan,
      themeMusicTracks: filtered,
    });
    if (activeTrack?.id === id) {
      setActiveTrack(filtered.length > 0 ? filtered[0] : null);
      if (filtered.length > 0 && audioRef.current) {
        audioRef.current.src = filtered[0].audioUrl;
      }
    }
  };

  // Select track from playlist
  const handleSelectTrack = (track: EventThemeTrack) => {
    setActiveTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={activeTrack?.audioUrl}
        loop={isLooping}
        preload="auto"
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 md:p-8 shadow-xs">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Music className="h-3.5 w-3.5 text-indigo-600" />
              <span>Google DeepMind Lyria Realtime Audio</span>
              <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                models/lyria-realtime-exp
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Custom Event Theme Music & Fanfare
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Compose bespoke background soundscapes, grand entrance brass fanfares, and celebration dance tracks
              tailored to <strong className="text-slate-900 font-semibold">{plan.concept.title}</strong>. Complete with
              DJ audio style guides and uncompressed 48kHz WAV audio export.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-center min-w-[90px]">
              <div className="text-xl font-bold text-slate-900">{savedTracks.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Tracks Composed</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-center min-w-[90px]">
              <div className="text-xl font-bold text-indigo-700">{bpm}</div>
              <div className="text-[11px] font-medium text-slate-500">BPM Tempo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span className="flex-1 font-medium">{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="flex-1 font-medium">{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composition Engine Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Selector */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Celebration Music Category</span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Lyria Preset</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.category}
                  type="button"
                  onClick={() => setSelectedCategory(preset.category)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    selectedCategory === preset.category
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-600/20'
                      : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:border-stone-300 hover:bg-stone-100/70 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xl shrink-0">{preset.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{preset.defaultBpm} BPM • {preset.durationSec}s</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Steerable Lyria Controls */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                <span>Steerable Audio Parameters</span>
              </label>
              <span className="text-[10px] font-semibold text-slate-500">Live Music Synthesis</span>
            </div>

            {/* Track Title */}
            <div>
              <label className="block text-[11px] text-slate-600 font-semibold mb-1">Track Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. VIP Entrance Fanfare"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
              />
            </div>

            {/* BPM Tempo Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">BPM Tempo:</span>
                <span className="font-mono text-indigo-700 font-bold">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                step="2"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full accent-indigo-600 bg-stone-200 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>60 (Lounge)</span>
                <span>110 (Fanfare)</span>
                <span>130 (Dance)</span>
              </div>
            </div>

            {/* Density Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Arrangement Density:</span>
                <span className="font-mono text-indigo-700 font-bold">{Math.round(density * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 bg-stone-200 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Sparse / Intimate</span>
                <span>Lush / Full Orchestration</span>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 font-semibold">Clip Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSeconds(sec)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      durationSeconds === sec
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                        : 'border-stone-200 bg-stone-50/80 text-slate-600 hover:border-stone-300 hover:text-slate-900'
                    }`}
                  >
                    {sec} Seconds
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                Lyria Steering Prompt
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
                placeholder="Instruments, mood, rhythm, acoustic ambiance..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none font-sans"
              />
            </div>

            {/* Compose Button */}
            <button
              type="button"
              onClick={handleComposeMusic}
              disabled={isComposing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isComposing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Composing with DeepMind Lyria...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Compose Theme Audio (Lyria Realtime)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Player, Spectrum Visualizer & DJ Guide (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Player Card */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[380px]">
            {/* Visualizer & Status */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-indigo-600 shadow-2xs">
                    <Disc3 className={`h-6 w-6 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeTrack?.title || 'No Track Selected'}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {activeTrack ? `${activeTrack.category.replace('_', ' ')} • ${activeTrack.bpm || bpm} BPM` : 'Select a preset or compose a theme track'}
                    </p>
                  </div>
                </div>

                {activeTrack && (
                  <button
                    type="button"
                    onClick={() => handleDownloadTrack()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download WAV</span>
                  </button>
                )}
              </div>

              {/* Animated Canvas Visualizer */}
              <div className="my-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-stone-800">
                <canvas ref={canvasRef} className="w-full max-w-md h-24" />
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  {isPlaying ? '48kHz Uncompressed Stereo Stream' : 'Press Play to Listen'}
                </div>
              </div>
            </div>

            {/* Playback Scrubber & Controls */}
            <div className="space-y-4 pt-2">
              {/* Scrubber Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || activeTrack?.durationSeconds || 15}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!activeTrack}
                  className="w-full accent-indigo-600 bg-stone-200 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || activeTrack?.durationSeconds || 15)}</span>
                </div>
              </div>

              {/* Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Loop Button */}
                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`rounded-lg p-2 transition-colors cursor-pointer ${
                    isLooping ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Toggle Loop"
                >
                  <Repeat className="h-4 w-4" />
                </button>

                {/* Main Play/Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!activeTrack}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 p-4 text-white shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={toggleMute} className="text-slate-500 hover:text-slate-800 cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-indigo-600 bg-stone-200 h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DJ Audio Style Guide Card */}
          {activeTrack && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-indigo-600" />
                  <span>DJ Performance & Timeline Cue Guide</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">BPM: {activeTrack.bpm || bpm}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Timeline Placement</span>
                  <p className="text-slate-800 font-medium">
                    {activeTrack.category === 'entrance_fanfare'
                      ? 'Play during grand entrance or award milestone'
                      : activeTrack.category === 'cocktail_ambient'
                        ? 'Loop continuously during cocktail reception'
                        : 'Deploy at transition peak on main floor'}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Mixing Advice</span>
                  <p className="text-slate-800 font-medium">
                    {activeTrack.category === 'entrance_fanfare'
                      ? 'Let the final brass chord reverberate into silence'
                      : 'Crossfade smoothly over 4 bars at matching tempo'}
                  </p>
                </div>
              </div>

              {activeTrack.prompt && (
                <div className="pt-2 text-[11px] text-slate-500 italic">
                  Prompt: "{activeTrack.prompt}"
                </div>
              )}
            </div>
          )}

          {/* Saved Tracks Playlist */}
          {savedTracks.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-indigo-600" />
                <span>Composed Event Soundtracks ({savedTracks.length})</span>
              </h3>

              <div className="space-y-2">
                {savedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                      activeTrack?.id === track.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={`rounded-full p-2 text-white transition-transform hover:scale-110 cursor-pointer ${
                          activeTrack?.id === track.id && isPlaying ? 'bg-indigo-600' : 'bg-stone-300 hover:bg-stone-400 text-slate-700'
                        }`}
                      >
                        {activeTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <Play className="h-3.5 w-3.5 ml-0.5 text-slate-800" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{track.title}</h4>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {track.category.replace('_', ' ')} • {track.bpm || 110} BPM • {track.durationSeconds}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadTrack(track)}
                        title="Download WAV"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id)}
                        title="Delete track"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
