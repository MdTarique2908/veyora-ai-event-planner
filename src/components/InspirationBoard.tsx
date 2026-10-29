import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Maximize2,
  Download,
  RefreshCw,
  Sliders,
  Check,
  Wand2,
  AlertCircle,
  Plus,
  SwitchCamera,
  Layers,
  Palette,
  Eye,
  FileImage,
  Film,
} from 'lucide-react';
import { EventPlan, InspirationItem } from '../types/event';

interface InspirationBoardProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  onAnimateIntoVideo?: (imageUrl: string) => void;
}

const CATEGORIES: InspirationItem['category'][] = [
  'Decor & Floral',
  'Table Setting',
  'Lighting & Ambience',
  'Attire & Vibe',
  'Cake & Desserts',
  'Venue Staging',
  'General',
];

export const InspirationBoard: React.FC<InspirationBoardProps> = ({ plan, onUpdatePlan, onAnimateIntoVideo }) => {
  const items: InspirationItem[] = plan.inspirationBoard || [];

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeLightboxItem, setActiveLightboxItem] = useState<InspirationItem | null>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraItemTitle, setCameraItemTitle] = useState('');
  const [cameraItemCategory, setCameraItemCategory] = useState<InspirationItem['category']>('Decor & Floral');
  const [cameraItemNotes, setCameraItemNotes] = useState('');

  // AI Generator states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<InspirationItem['category']>('Decor & Floral');
  const [aiAspectRatio, setAiAspectRatio] = useState<'1:1' | '4:3' | '16:9'>('1:1');
  const [aiTitle, setAiTitle] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Curated prompt ideas tailored to the event
  const curatedPrompts = [
    {
      title: 'Grand Welcome Arch',
      category: 'Decor & Floral' as const,
      prompt: `Grand entrance floral arch with ${plan.concept.colorPalette.map((c) => c.name).join(' and ')} florals, soft glowing fairy lights, and elegant welcome signage for ${plan.concept.title}.`,
    },
    {
      title: 'Candlelit Guest Tables',
      category: 'Table Setting' as const,
      prompt: `Luxury dining table setting with textured linen runner, tapered dinner candles, brass cutlery, and botanical centerpieces reflecting a ${plan.input.themeStyle} aesthetic.`,
    },
    {
      title: 'Signature Bar & Lounge',
      category: 'Lighting & Ambience' as const,
      prompt: `Cocktail bar lounge with warm ambient Edison bulbs, neon sign accent, craft glassware, and cozy modern modular seating.`,
    },
    {
      title: 'Tiered Celebration Cake',
      category: 'Cake & Desserts' as const,
      prompt: `Artisanal 3-tier celebration cake with subtle edible gold leaf, fresh ${plan.concept.colorPalette[0]?.name || 'blush'} florals, and minimal textured buttercream finish.`,
    },
    {
      title: 'Atmospheric Stage Staging',
      category: 'Venue Staging' as const,
      prompt: `Chic focal stage backdrop with draped chiffon fabric, warm uplighting, geometric floral pillars, and clean modern aesthetic for ${plan.concept.title}.`,
    },
  ];

  // Camera handling
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setCapturedPhotoUrl(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Unable to access device camera. Please check permissions or use direct file upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhotoUrl(null);
    startCamera();
  };

  const handleSaveCapturedPhoto = () => {
    if (!capturedPhotoUrl) return;

    const newItem: InspirationItem = {
      id: `insp-cam-${Date.now()}`,
      source: 'camera_capture',
      imageUrl: capturedPhotoUrl,
      title: cameraItemTitle.trim() || 'Venue & Decor Snapshot',
      category: cameraItemCategory,
      notes: cameraItemNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdatePlan({
      ...plan,
      inspirationBoard: [newItem, ...items],
    });

    setIsCameraOpen(false);
    setCapturedPhotoUrl(null);
    setCameraItemTitle('');
    setCameraItemNotes('');
  };

  // Direct file upload handling (camera roll / computer files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newItem: InspirationItem = {
          id: `insp-up-${Date.now()}`,
          source: 'upload',
          imageUrl: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Uploaded Reference Photo',
          category: 'General',
          notes: `Uploaded reference photo (${(file.size / 1024).toFixed(0)} KB)`,
          createdAt: new Date().toISOString(),
        };

        onUpdatePlan({
          ...plan,
          inspirationBoard: [newItem, ...items],
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // AI Image generation
  const handleGenerateAiImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/inspiration/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          category: aiCategory,
          aspectRatio: aiAspectRatio,
          eventDetails: {
            title: plan.concept.title,
            eventType: plan.input.eventType,
            themeStyle: plan.input.themeStyle,
            city: plan.input.city,
            colorPalette: plan.concept.colorPalette,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate inspiration concept');
      }

      const data = await res.json();
      if (!data.imageUrl) {
        throw new Error('No image returned from generation service');
      }

      const newItem: InspirationItem = {
        id: `insp-ai-${Date.now()}`,
        source: 'ai_generated',
        imageUrl: data.imageUrl,
        title: aiTitle.trim() || aiPrompt.slice(0, 45) + '...',
        category: aiCategory,
        promptUsed: data.promptUsed || aiPrompt.trim(),
        aspectRatio: aiAspectRatio,
        createdAt: new Date().toISOString(),
      };

      onUpdatePlan({
        ...plan,
        inspirationBoard: [newItem, ...items],
      });

      setIsAiModalOpen(false);
      setAiPrompt('');
      setAiTitle('');
    } catch (err: any) {
      console.error('AI generation error:', err);
      setAiError(err.message || 'Unable to generate visual concept. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Quick apply curated prompt
  const handleApplyCuratedPrompt = (item: (typeof curatedPrompts)[0]) => {
    setAiTitle(item.title);
    setAiCategory(item.category);
    setAiPrompt(item.prompt);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (activeLightboxItem?.id === id) {
      setActiveLightboxItem(null);
    }
    const filtered = items.filter((item) => item.id !== id);
    onUpdatePlan({
      ...plan,
      inspirationBoard: filtered,
    });
  };

  // Download item
  const handleDownloadItem = (item: InspirationItem) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-inspiration.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    return matchesCategory && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header and Action Buttons */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Palette className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Theme & Atmosphere Inspiration Board</h3>
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-700">
                {items.length} {items.length === 1 ? 'Asset' : 'Assets'}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Capture on-site photos of venues and floral arrangements, or generate AI visual mockups matching your{' '}
              <span className="text-indigo-700 font-semibold">{plan.concept.title}</span> aesthetic ({plan.input.themeStyle}).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Capture Photo Button */}
            <button
              type="button"
              onClick={() => {
                setIsCameraOpen(true);
                startCamera();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:text-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4 text-emerald-600" />
              <span>Capture Photo</span>
            </button>

            {/* Direct Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:text-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>Upload Image</span>
            </button>

            {/* AI Generate Button */}
            <button
              type="button"
              onClick={() => {
                setIsAiModalOpen(true);
                if (!aiPrompt && curatedPrompts[0]) {
                  handleApplyCuratedPrompt(curatedPrompts[0]);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Wand2 className="h-4 w-4 text-amber-300" />
              <span>Generate AI Visual</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100 bg-stone-50/80 border border-stone-200/80'
              }`}
            >
              All ({items.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100 bg-stone-50/80 border border-stone-200/80'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">All Sources</option>
              <option value="ai_generated">AI Generated</option>
              <option value="camera_capture">Camera Photos</option>
              <option value="upload">Device Uploads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moodboard / Inspiration Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <ImageIcon className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-slate-900">No Inspiration Assets Found</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {items.length === 0
                ? 'Your inspiration board is currently empty. Snap a photo of floral swatches or generate an AI visual concept matching your event theme!'
                : 'No items match your active filters. Try selecting "All Categories".'}
            </p>
          </div>
          {items.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAiModalOpen(true);
                  if (curatedPrompts[0]) handleApplyCuratedPrompt(curatedPrompts[0]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>Generate Theme Concept</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCameraOpen(true);
                  startCamera();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                <span>Capture First Photo</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div
                className="relative aspect-video w-full bg-stone-900 overflow-hidden cursor-pointer"
                onClick={() => setActiveLightboxItem(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {item.category}
                  </span>
                  {item.source === 'ai_generated' ? (
                    <span className="rounded-full bg-indigo-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                      <span>AI Concept</span>
                    </span>
                  ) : item.source === 'camera_capture' ? (
                    <span className="rounded-full bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white flex items-center gap-1">
                      <Camera className="h-2.5 w-2.5 text-emerald-200" />
                      <span>Camera</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-700/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                      Upload
                    </span>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                  <span className="rounded-full bg-white/90 p-2 text-slate-900 shadow-md backdrop-blur-sm">
                    <Maximize2 className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.notes}</p>
                  ) : item.promptUsed ? (
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                      "{item.promptUsed}"
                    </p>
                  ) : null}
                </div>

                {/* Footer Controls */}
                <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    {onAnimateIntoVideo && (
                      <button
                        type="button"
                        onClick={() => onAnimateIntoVideo(item.imageUrl)}
                        title="Animate Photo into Video Teaser (Gemini Omni Flash)"
                        className="p-1 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <Film className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownloadItem(item)}
                      title="Download Image"
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete Inspiration"
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= CAMERA CAPTURE MODAL ================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Capture Theme & Decor Photo</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsCameraOpen(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {cameraError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-900">Camera Notice</p>
                    <p className="mt-0.5">{cameraError}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="rounded-lg bg-rose-100 border border-rose-300 px-2.5 py-1 text-xs text-rose-900 font-semibold hover:bg-rose-200"
                      >
                        Retry Access
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCameraOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="rounded-lg bg-white border border-stone-200 px-2.5 py-1 text-xs text-slate-700 font-medium hover:bg-stone-50 shadow-2xs"
                      >
                        Choose from Device
                      </button>
                    </div>
                  </div>
                </div>
              ) : capturedPhotoUrl ? (
                /* Captured Photo Review */
                <div className="space-y-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-stone-200 shadow-inner">
                    <img
                      src={capturedPhotoUrl}
                      alt="Captured preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="rounded bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm">
                        Ready to Save
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Photo Title / Caption
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Reception Table Runner, Rose Centerpiece"
                        value={cameraItemTitle}
                        onChange={(e) => setCameraItemTitle(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Category
                        </label>
                        <select
                          value={cameraItemCategory}
                          onChange={(e) => setCameraItemCategory(e.target.value as any)}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Personal Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ask florist for similar eucalyptus"
                          value={cameraItemNotes}
                          onChange={(e) => setCameraItemNotes(e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Viewfinder */
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-stone-300 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="h-full w-full object-cover"
                    />

                    {/* Viewfinder rule-of-thirds grid */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Camera switch button */}
                    <button
                      type="button"
                      onClick={switchCameraFacing}
                      className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 p-2 text-white shadow-lg backdrop-blur-sm cursor-pointer"
                      title="Switch Front/Back Camera"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Point camera at venue features, decor swatches, attire, or table inspiration.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-stone-200 px-5 py-3 bg-stone-50/80">
              {capturedPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCapturedPhoto}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save to Board</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setIsCameraOpen(false);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={Boolean(cameraError)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Snap Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= AI IMAGE GENERATION MODAL ================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Theme Concept Visualizer</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Generate bespoke theme photography for {plan.concept.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleGenerateAiImage} className="p-5 space-y-4 overflow-y-auto">
              {aiError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Curated Theme Quick Select Pills */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Curated Themes for {plan.input.themeStyle}:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {curatedPrompts.map((cp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyCuratedPrompt(cp)}
                      className="rounded-lg border border-stone-200 bg-stone-50/80 hover:border-indigo-400 hover:bg-indigo-50/60 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      {cp.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Concept Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Floral Archway, Candlelit Table Runner"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Prompt Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Visual Prompt & Atmosphere Details
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Auto-includes palette & theme
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the setting, materials, lighting, or specific table styling you want to see..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Category & Aspect Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Design Category
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Aspect Ratio Framing
                  </label>
                  <select
                    value={aiAspectRatio}
                    onChange={(e) => setAiAspectRatio(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1:1">1:1 Square (Moodboard Tile)</option>
                    <option value="4:3">4:3 Classic Photo</option>
                    <option value="16:9">16:9 Cinematic Backdrop</option>
                  </select>
                </div>
              </div>

              {/* Palette Preview */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Palette Grounding Context:
                </span>
                <div className="flex items-center gap-2">
                  {plan.concept.colorPalette.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span
                        className="h-3 w-3 rounded-full border border-stone-300 shadow-2xs"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] font-medium text-slate-700">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" />
                      <span>Generating Visual Concept...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>Generate Visual</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX PREVIEW MODAL ================= */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={() => setActiveLightboxItem(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3 bg-stone-50/80">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {activeLightboxItem.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{activeLightboxItem.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadItem(activeLightboxItem)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-stone-100 cursor-pointer"
                  title="Download Image"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(activeLightboxItem.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLightboxItem(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-stone-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* High-Res Image View */}
            <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            {/* Detail / Context Box */}
            <div className="p-4 bg-stone-50/90 text-xs text-slate-700 space-y-1.5 border-t border-stone-200">
              {activeLightboxItem.promptUsed && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-0.5">
                    Prompt / Design Specifications:
                  </span>
                  <p className="text-slate-800 italic leading-relaxed">
                    "{activeLightboxItem.promptUsed}"
                  </p>
                </div>
              )}
              {activeLightboxItem.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                    Notes & Action Items:
                  </span>
                  <p className="text-slate-800 font-medium">{activeLightboxItem.notes}</p>
                </div>
              )}
              <div className="pt-2 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-200">
                <div className="flex items-center gap-2 font-medium">
                  <span>Source: {activeLightboxItem.source}</span>
                  <span>•</span>
                  <span>Captured: {new Date(activeLightboxItem.createdAt).toLocaleString()}</span>
                </div>
                {onAnimateIntoVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      onAnimateIntoVideo(activeLightboxItem.imageUrl);
                      setActiveLightboxItem(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
                  >
                    <Film className="h-3.5 w-3.5 text-amber-300" />
                    <span>Animate into Video Teaser (Omni Flash)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
