import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  Trash2,
  RefreshCw,
  Sliders,
  Layers,
  Smartphone,
  Monitor,
  Share2,
  Check,
  AlertCircle,
  X,
  Image as ImageIcon,
  Wand2,
  Calendar,
  MapPin,
  Clock,
  Video,
} from 'lucide-react';
import { EventPlan, EventVideoInvite, InspirationItem } from '../types/event';
import { FloatingInvitationCard3D } from './Luxury3DVisuals';

interface VideoInvitationStudioProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  initialPhotoUrl?: string | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'sparkle';
  opacity: number;
}

export const VideoInvitationStudio: React.FC<VideoInvitationStudioProps> = ({
  plan,
  onUpdatePlan,
  initialPhotoUrl,
}) => {
  // Video Generation Config
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState<string>(
    `Cinematic golden confetti and glowing sparkles bursting in slow motion, revealing the title "${plan.concept.title}" with atmospheric festival lighting and luxury party ambiance.`
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialPhotoUrl || null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/jpeg');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Active / Selected Video
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>(
    `${plan.concept.title} — Official Teaser`
  );
  const [isAiGeneratedSource, setIsAiGeneratedSource] = useState<boolean>(false);

  // Playback / Motion state
  const [isPlayingMotion, setIsPlayingMotion] = useState<boolean>(true);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const motionTimeRef = useRef<number>(0);

  // Quick Curated Presets
  const curatedPresets = [
    {
      title: '✨ Golden Sparkler Reveal',
      ratio: '16:9' as const,
      desc: 'Slow-motion golden sparklers framing the typography with warm amber embers.',
      promptText: `Slow-motion golden sparkler sparks bursting around glowing typography "${plan.concept.title}", warm amber embers floating gently, elegant luxury cinematic lighting.`,
    },
    {
      title: '📱 Reels / Story Confetti Blast',
      ratio: '9:16' as const,
      desc: 'Vertical 9:16 portrait energetic party pop with vibrant falling foil confetti.',
      promptText: `Dynamic vertical 9:16 Instagram Reel teaser. Vibrant metallic foil confetti explosion in ${plan.concept.colorPalette.map((c) => c.name).join(', ')} colors, festive beat drop pacing, and bold save-the-date typography.`,
    },
    {
      title: '🍾 Champagne & Starlight Glow',
      ratio: '16:9' as const,
      desc: 'Effervescent glowing bubbles rising with soft bokeh and candlelight reflections.',
      promptText: `Champagne effervescence with illuminated glowing bubbles rising through warm candlelight, soft bokeh lights, and modern elegant title card for ${plan.concept.title}.`,
    },
    {
      title: '🪩 Neon Midnight Dance Pulse',
      ratio: '9:16' as const,
      desc: 'Moody cyberpunk neon lasers and pulsing strobes for late-night party vibes.',
      promptText: `Vibrant neon magenta and cyan laser lights pulsing through light haze, energetic dance floor atmosphere, rhythmic strobes highlighting the event date ${plan.input.eventDate}.`,
    },
    {
      title: '🌸 Botanical Garden Bloom',
      ratio: '16:9' as const,
      desc: 'Floating flower petals and morning sun flare across an ethereal outdoor space.',
      promptText: `Soft fluttering flower petals floating gracefully across warm morning sun rays, lush natural florals, dreamy fairytale garden celebration aesthetic.`,
    },
  ];

  // Set initial photo if passed from parent
  useEffect(() => {
    if (initialPhotoUrl) {
      setUploadedImage(initialPhotoUrl);
    }
  }, [initialPhotoUrl]);

  // Video Invites list from plan
  const savedVideos: EventVideoInvite[] = plan.videoInvites || [];

  // When saved videos exist, select the first if none active
  useEffect(() => {
    if (!activeVideoUrl && savedVideos.length > 0) {
      setActiveVideoUrl(savedVideos[0].videoUrl);
      setActiveVideoTitle(savedVideos[0].title);
      setAspectRatio(savedVideos[0].aspectRatio);
    }
  }, [savedVideos, activeVideoUrl]);

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      setUploadedImageMime(file.type);
      setErrorNotice(null);
      setSuccessNotice('Photo attached! Ready to animate with Gemini Omni Flash.');
      setTimeout(() => setSuccessNotice(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Omni 1.1 Flash Video Generation via Interactions API
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const payload = {
        prompt,
        aspectRatio,
        imageBase64: uploadedImage,
        imageMimeType: uploadedImageMime,
        eventDetails: {
          title: plan.concept.title,
          themeStyle: plan.input.themeStyle,
          city: plan.input.city,
          eventDate: plan.input.eventDate,
          vibeKeywords: plan.concept.vibeKeywords,
          colorPalette: plan.concept.colorPalette,
        },
      };

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();

      if (result.videoUrl) {
        setActiveVideoUrl(result.videoUrl);
        setIsAiGeneratedSource(true);
        setSuccessNotice('🎬 Generated video with Gemini Omni Flash via Interactions API!');

        // Save automatically to plan
        const newInvite: EventVideoInvite = {
          id: `vid-${Date.now()}`,
          title: `${plan.concept.title} (${aspectRatio})`,
          videoUrl: result.videoUrl,
          aspectRatio,
          sourceImage: uploadedImage || undefined,
          prompt,
          createdAt: new Date().toISOString(),
          durationSeconds: 6,
        };

        const updatedInvites = [newInvite, ...(plan.videoInvites || [])];
        onUpdatePlan({
          ...plan,
          videoInvites: updatedInvites,
        });
      } else {
        // Fallback or interactive mode
        setActiveVideoUrl(null);
        setIsAiGeneratedSource(false);
        setIsPlayingMotion(true);
        if (result.errorNotice) {
          setErrorNotice(result.errorNotice);
        } else if (result.notice) {
          setSuccessNotice(result.notice);
        }
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setErrorNotice(
        err?.message || 'Could not connect to video generator. Switched to interactive motion graphics mode.'
      );
      setActiveVideoUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize Canvas Particles
  const initParticles = useCallback((width: number, height: number) => {
    const palette = plan.concept.colorPalette.map((c) => c.hex);
    const colors = palette.length > 0 ? palette : ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#f43f5e', '#38bdf8'];
    const count = aspectRatio === '9:16' ? 70 : 90;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const shapeType: Particle['shape'] = Math.random() > 0.6 ? 'sparkle' : Math.random() > 0.3 ? 'rect' : 'circle';
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0.8 + Math.random() * 2.2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        shape: shapeType,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }
    particlesRef.current = particles;
  }, [aspectRatio, plan.concept.colorPalette]);

  // Canvas Motion Graphics Render Loop
  useEffect(() => {
    if (activeVideoUrl) return; // If AI video is loaded, don't run canvas loop

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = aspectRatio === '9:16' ? 720 : 1280;
    const height = aspectRatio === '9:16' ? 1280 : 720;
    canvas.width = width;
    canvas.height = height;

    initParticles(width, height);

    // Preload photo image if uploaded
    let bgImg: HTMLImageElement | null = null;
    if (uploadedImage) {
      bgImg = new Image();
      bgImg.src = uploadedImage;
    }

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      motionTimeRef.current += 0.02;
      const t = motionTimeRef.current;

      // 1. Draw Background
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        // Draw image with slow subtle zoom (Ken Burns)
        const zoom = 1 + 0.06 * Math.sin(t * 0.4);
        const w = width * zoom;
        const h = height * zoom;
        const dx = (width - w) / 2 + Math.sin(t * 0.3) * 15;
        const dy = (height - h) / 2 + Math.cos(t * 0.3) * 10;
        ctx.drawImage(bgImg, dx, dy, w, h);

        // Dark gradient overlay for typography readability
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(5, 8, 22, 0.5)');
        grad.addColorStop(0.5, 'rgba(5, 8, 22, 0.7)');
        grad.addColorStop(1, 'rgba(5, 8, 22, 0.88)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Luxury atmospheric background
        const grad = ctx.createRadialGradient(
          width / 2 + Math.sin(t * 0.5) * 80,
          height / 2 + Math.cos(t * 0.5) * 60,
          80,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.8
        );
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle ambient neon glow orbs
        const primaryHex = plan.concept.colorPalette[0]?.hex || '#6366f1';
        const accentHex = plan.concept.colorPalette[1]?.hex || '#ec4899';

        ctx.save();
        ctx.filter = 'blur(60px)';
        ctx.fillStyle = primaryHex;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(
          width * 0.3 + Math.sin(t * 0.7) * 90,
          height * 0.4 + Math.cos(t * 0.6) * 80,
          180,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = accentHex;
        ctx.beginPath();
        ctx.arc(
          width * 0.7 + Math.cos(t * 0.8) * 90,
          height * 0.6 + Math.sin(t * 0.7) * 80,
          200,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw & Update Confetti / Particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 1.5 + i) * 0.6;
        p.rotation += p.rotationSpeed;

        // Wrap around top
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'sparkle') {
          // 4-point sparkle star
          ctx.beginPath();
          const r1 = p.size;
          const r2 = p.size * 0.3;
          for (let s = 0; s < 8; s++) {
            const r = s % 2 === 0 ? r1 : r2;
            const a = (s * Math.PI) / 4;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Draw Decorative Frame Lines
      const pad = aspectRatio === '9:16' ? 40 : 50;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

      // Corner accent brackets
      const cornerSize = 25;
      ctx.strokeStyle = plan.concept.colorPalette[0]?.hex || '#f59e0b';
      ctx.lineWidth = 3;

      // Top Left
      ctx.beginPath();
      ctx.moveTo(pad - 2, pad + cornerSize);
      ctx.lineTo(pad - 2, pad - 2);
      ctx.lineTo(pad + cornerSize, pad - 2);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(width - pad + 2 - cornerSize, pad - 2);
      ctx.lineTo(width - pad + 2, pad - 2);
      ctx.lineTo(width - pad + 2, pad + cornerSize);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(pad - 2, height - pad - cornerSize);
      ctx.lineTo(pad - 2, height - pad + 2);
      ctx.lineTo(pad + cornerSize, height - pad + 2);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(width - pad + 2 - cornerSize, height - pad + 2);
      ctx.lineTo(width - pad + 2, height - pad + 2);
      ctx.lineTo(width - pad + 2, height - pad - cornerSize);
      ctx.stroke();

      // 4. Draw Typography & Save The Date
      const centerX = width / 2;
      let curY = aspectRatio === '9:16' ? height * 0.3 : height * 0.32;

      // Header Tagline Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `600 ${aspectRatio === '9:16' ? 18 : 16}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('YOU ARE INVITED TO CELEBRATE', centerX, curY);

      curY += aspectRatio === '9:16' ? 55 : 45;

      // Main Event Title with Shimmer Glow
      const titlePulse = 1 + 0.03 * Math.sin(t * 1.2);
      ctx.save();
      ctx.translate(centerX, curY);
      ctx.scale(titlePulse, titlePulse);

      ctx.shadowColor = plan.concept.colorPalette[0]?.hex || '#f59e0b';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#ffffff';
      const titleFontSize = aspectRatio === '9:16' ? 44 : 48;
      ctx.font = `800 ${titleFontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(plan.concept.title, 0, 0);
      ctx.restore();

      curY += aspectRatio === '9:16' ? 50 : 45;

      // Tagline or Theme
      ctx.fillStyle = plan.concept.colorPalette[1]?.hex || '#38bdf8';
      ctx.font = `600 ${aspectRatio === '9:16' ? 22 : 18}px system-ui, sans-serif`;
      ctx.fillText(plan.concept.tagline || plan.input.themeStyle || 'A Special Celebration', centerX, curY);

      curY += aspectRatio === '9:16' ? 70 : 60;

      // Date & Location Pill
      const dateText = plan.input.eventDate
        ? new Date(plan.input.eventDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Date To Be Announced';

      const pillText = `📅 ${dateText}   •   📍 ${plan.input.city || 'Exclusive Venue'}`;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;

      const pillWidth = Math.min(width - 120, 580);
      const pillHeight = 46;
      const pillX = centerX - pillWidth / 2;
      const pillY = curY - 28;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = `600 ${aspectRatio === '9:16' ? 18 : 16}px system-ui, sans-serif`;
      ctx.fillText(pillText, centerX, curY);

      // Bottom "Veyora Teaser" watermark
      ctx.fillStyle = 'rgba(232, 212, 168, 0.75)';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('Veyora  •  Every occasion, extraordinary', centerX, height - pad - 18);

      if (isPlayingMotion) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isMounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [aspectRatio, uploadedImage, plan, activeVideoUrl, isPlayingMotion, initParticles]);

  // Record Motion Canvas as WebM Video File
  const handleRecordVideoFromCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRecordingWebm(true);
      setRecordingProgress(0);

      // Capture 30fps stream from canvas
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!stream) {
        throw new Error('Canvas captureStream is not supported by your browser.');
      }

      // Check supported MIME type
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
      let selectedMime = 'video/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 4000000, // 4 Mbps high quality
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMime });
        const videoUrl = URL.createObjectURL(blob);
        setActiveVideoUrl(videoUrl);
        setIsAiGeneratedSource(false);
        setIsRecordingWebm(false);

        // Add to saved invites
        const recordedInvite: EventVideoInvite = {
          id: `vid-rec-${Date.now()}`,
          title: `${plan.concept.title} Motion Teaser (${aspectRatio})`,
          videoUrl,
          aspectRatio,
          sourceImage: uploadedImage || undefined,
          prompt,
          createdAt: new Date().toISOString(),
          durationSeconds: 5,
        };

        const updated = [recordedInvite, ...(plan.videoInvites || [])];
        onUpdatePlan({
          ...plan,
          videoInvites: updated,
        });

        setSuccessNotice('🎉 High-definition WebM teaser video rendered and ready to download!');
        setTimeout(() => setSuccessNotice(null), 4000);
      };

      mediaRecorder.start();

      // Progress countdown (5 seconds record)
      const duration = 5000;
      const intervalTime = 100;
      let elapsed = 0;

      const progressTimer = setInterval(() => {
        elapsed += intervalTime;
        setRecordingProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
        if (elapsed >= duration) {
          clearInterval(progressTimer);
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }
      }, intervalTime);
    } catch (err: any) {
      console.error('Error recording video from canvas:', err);
      setIsRecordingWebm(false);
      setErrorNotice('Recording failed: ' + (err?.message || 'MediaRecorder unsupported.'));
    }
  };

  // Download Video File
  const handleDownloadActiveVideo = () => {
    if (!activeVideoUrl) return;

    const a = document.createElement('a');
    a.href = activeVideoUrl;
    const safeTitle = (plan.concept.title || 'event-invite')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    a.download = `${safeTitle}-${aspectRatio.replace(':', 'x')}-invitation.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy Share Link or Text
  const handleShareInvite = () => {
    const text = `🎉 You're invited to ${plan.concept.title}!
📅 Date: ${plan.input.eventDate}
📍 Location: ${plan.input.city}
✨ Theme: ${plan.input.themeStyle}
RSVP today!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Delete saved video
  const handleDeleteVideo = (id: string) => {
    const updated = (plan.videoInvites || []).filter((v) => v.id !== id);
    onUpdatePlan({
      ...plan,
      videoInvites: updated,
    });
    if (activeVideoUrl && savedVideos.find((v) => v.id === id)?.videoUrl === activeVideoUrl) {
      setActiveVideoUrl(updated.length > 0 ? updated[0].videoUrl : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Luxury 3D Animated Event Teaser & Video Invites Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D6B779]/35 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 shadow-2xl text-[#F8FAFC]">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D6B779]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B779]/40 bg-[#D6B779]/10 px-3.5 py-1 text-xs font-semibold text-[#D6B779]">
              <Film className="h-3.5 w-3.5 text-[#D6B779]" />
              <span>Gemini Omni Flash 1.1 Video Engine</span>
              <span className="rounded bg-[#D6B779] px-1.5 py-0.5 text-[10px] font-bold text-[#0F172A]">Interactions API</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
              Animated Event Teaser & Video Invites
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Upload a venue or moodboard photo, craft cinematic prompts, and generate high-impact motion teasers in{' '}
              <strong className="text-[#D6B779] font-semibold">16:9 widescreen</strong> or{' '}
              <strong className="text-[#D6B779] font-semibold">9:16 vertical stories/reels</strong>.
            </p>

            {/* Quick Stats */}
            <div className="pt-2 flex items-center gap-3">
              <div className="rounded-xl border border-[#334155] bg-[#0F172A]/70 px-4 py-2 text-center min-w-[100px]">
                <div className="text-lg font-bold text-[#D6B779]">{savedVideos.length}</div>
                <div className="text-[10px] font-medium text-slate-400">Teasers Saved</div>
              </div>
              <div className="rounded-xl border border-[#334155] bg-[#0F172A]/70 px-4 py-2 text-center min-w-[100px]">
                <div className="text-lg font-bold text-rose-400">{aspectRatio}</div>
                <div className="text-[10px] font-medium text-slate-400">Active Format</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="relative w-full rounded-2xl border border-[#334155]/60 bg-[#0F172A]/50 backdrop-blur-xs p-1 shadow-inner">
              <FloatingInvitationCard3D />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-mono tracking-widest uppercase bg-[#0F172A]/90 px-2.5 py-0.5 rounded-full border border-[#334155]/60 pointer-events-none">
                3D Floating Invitation
              </div>
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

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generator Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format / Aspect Ratio Selector */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Aspect Ratio</span>
              <span className="text-[11px] font-medium text-indigo-600">Required: 16:9 or 9:16</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-600/20'
                    : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:border-stone-300 hover:bg-stone-100/70 hover:text-slate-900'
                }`}
              >
                <Monitor className={`h-5 w-5 ${aspectRatio === '16:9' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">16:9 Landscape</div>
                  <div className="text-[10px] text-slate-500">Cinematic / Displays / Email</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-950 shadow-xs ring-1 ring-rose-500/20'
                    : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:border-stone-300 hover:bg-stone-100/70 hover:text-slate-900'
                }`}
              >
                <Smartphone className={`h-5 w-5 ${aspectRatio === '9:16' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">9:16 Portrait</div>
                  <div className="text-[10px] text-slate-500">Reels / Stories / Mobile</div>
                </div>
              </button>
            </div>
          </div>

          {/* Photo Upload / Image Source */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                <span>Source Photo (Optional Motion Anchor)</span>
              </label>
              {uploadedImage && (
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {uploadedImage ? (
              <div className="relative overflow-hidden rounded-xl border border-stone-200 group">
                <img
                  src={uploadedImage}
                  alt="Uploaded source"
                  className="w-full h-36 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[11px] font-semibold text-white">
                    Attached as motion keyframe reference
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 hover:border-indigo-500 bg-stone-50/60 hover:bg-indigo-50/30 p-5 text-center transition-all group"
              >
                <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Upload a venue or celebration photo
                  </div>
                  <div className="text-[10px] text-slate-500">
                    JPG, PNG, or WebP up to 10MB to animate into video
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Quick Inspiration Moodboard Picker */}
            {plan.inspirationBoard && plan.inspirationBoard.length > 0 && !uploadedImage && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 font-medium block mb-1.5">Or choose from moodboard:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {plan.inspirationBoard.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUploadedImage(item.imageUrl)}
                      className="shrink-0 rounded-lg overflow-hidden border border-stone-200 hover:border-indigo-500 transition-all w-14 h-14"
                      title={item.title}
                    >
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input & Style Presets */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Motion & Scene Prompt</span>
              </label>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Gemini Omni Flash 1.1</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe motion dynamics, lighting, confetti, typography, camera pans..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none font-sans"
            />

            {/* Preset Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 font-semibold">Quick Creative Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {curatedPresets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.promptText);
                      setAspectRatio(preset.ratio);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50/80 px-2.5 py-1 text-[11px] text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-900 transition-all text-left shadow-2xs cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Calling Gemini Omni Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Video (Omni Flash)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRecordVideoFromCanvas}
                disabled={isRecordingWebm || isGenerating}
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 hover:bg-stone-50 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-xs cursor-pointer"
                title="Render 5-second teaser to downloadable WebM video file"
              >
                {isRecordingWebm ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-500" />
                    <span>Recording ({recordingProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Video className="h-3.5 w-3.5 text-rose-500" />
                    <span>Record Video File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Player / Preview Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center min-h-[480px]">
            {/* Player Container */}
            <div
              className={`relative overflow-hidden rounded-2xl border border-stone-300 bg-slate-950 shadow-lg flex items-center justify-center transition-all ${
                aspectRatio === '9:16' ? 'w-[290px] h-[516px]' : 'w-full max-w-[640px] aspect-[16/9]'
              }`}
            >
              {activeVideoUrl ? (
                /* AI Generated Video Player */
                <video
                  ref={videoPlayerRef}
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Interactive Canvas Motion Graphics Teaser */
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setIsPlayingMotion(!isPlayingMotion)}
                />
              )}

              {/* Status Badge in Corner */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
                <span className={`h-2 w-2 rounded-full ${activeVideoUrl ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{activeVideoUrl ? 'Omni Video Playback' : 'Interactive Motion Teaser'}</span>
              </div>

              {/* Format Badge */}
              <div className="absolute top-3 right-3 z-10 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-mono text-indigo-300 font-semibold">
                {aspectRatio}
              </div>

              {/* Pause/Play Overlay for Canvas */}
              {!activeVideoUrl && (
                <button
                  type="button"
                  onClick={() => setIsPlayingMotion(!isPlayingMotion)}
                  className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-900/80 backdrop-blur-md p-2 text-slate-200 hover:text-white border border-white/10 hover:scale-105 transition-all cursor-pointer"
                  title={isPlayingMotion ? 'Pause Motion' : 'Play Motion'}
                >
                  {isPlayingMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Playback Controls & Actions */}
            <div className="w-full max-w-[640px] mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2">
                {activeVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveVideoUrl(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <span>← Switch to Motion Canvas</span>
                  </button>
                )}
                {!activeVideoUrl && (
                  <span className="text-xs text-slate-500">
                    Live dynamic particle & typography animation loop
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeVideoUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadActiveVideo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Video</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 hover:text-slate-900 transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Copied Details!' : 'Share Text'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Video Teasers Gallery */}
          {savedVideos.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Film className="h-3.5 w-3.5 text-indigo-600" />
                <span>Saved Teasers for This Event ({savedVideos.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {savedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      activeVideoUrl === video.videoUrl
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                        : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-indigo-700">
                          {video.aspectRatio}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{video.title}</div>
                      <div className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">{video.prompt}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVideoUrl(video.videoUrl);
                          setAspectRatio(video.aspectRatio);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="h-3 w-3" />
                        <span>Play</span>
                      </button>

                      <a
                        href={video.videoUrl}
                        download={`event-invite-${video.id}.webm`}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>Save</span>
                      </a>
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
