import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  PlusCircle,
  Calendar,
  DollarSign,
  ArrowRight,
  Bookmark,
  Trash2,
  FileDown,
  Upload,
  Clock,
  Compass,
  Music,
  Film,
  Layers,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Users,
} from 'lucide-react';
import { EventPlan } from '../types/event';
import { VeyoraLogo } from './VeyoraLogo';

export interface DashboardProps {
  savedPlans: EventPlan[];
  onSelectPlan: (plan: EventPlan) => void;
  onCreateNew: () => void;
  onDeletePlan: (id: string) => void;
  onExportJson: (plan: EventPlan) => void;
  onImportJson: (jsonStr: string) => void;
  onLoadSample: (sampleId: string) => void;
  onNavigateToFeature?: (
    feature:
      | 'overview'
      | 'budget'
      | 'timeline'
      | 'schedule'
      | 'vendors'
      | 'seating'
      | 'video'
      | 'music'
      | 'inspiration'
      | 'experience'
  ) => void;
}

// ============================================================================
// 1. Interactive Luxury 3D Celebration Centerpiece (Three.js WebGL Engine)
// ============================================================================
const CelebrationCenterpiece3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Verify WebGL capability safely
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.0, 6.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init failed, using CSS 3D fallback:', e);
      setWebGlSupported(false);
      return;
    }

    // Main 3D Composition Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Luxury Materials Palette
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.92,
      roughness: 0.18,
    });

    const champagneWireMaterial = new THREE.LineBasicMaterial({
      color: 0xf3e5c8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.75,
    });

    const darkMirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.88,
      roughness: 0.12,
    });

    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      emissive: 0xd6b779,
      emissiveIntensity: 0.22,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.7,
      transparent: true,
      opacity: 0.88,
      ior: 1.52,
    });

    // 1. Base Pedestal (Tiered luxury mirror disc with champagne gold bevel)
    const baseGeo = new THREE.CylinderGeometry(2.3, 2.4, 0.14, 48);
    const baseMesh = new THREE.Mesh(baseGeo, darkMirrorMaterial);
    baseMesh.position.y = -1.5;
    rootGroup.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(2.35, 0.045, 16, 64);
    const rimMesh = new THREE.Mesh(rimGeo, goldMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = -1.43;
    rootGroup.add(rimMesh);

    // 2. Concentric Gimbal Celebration Rings
    const ringGroup = new THREE.Group();
    rootGroup.add(ringGroup);

    const ring1Geo = new THREE.TorusGeometry(1.85, 0.038, 20, 72);
    const ring1 = new THREE.Mesh(ring1Geo, goldMaterial);
    ring1.rotation.x = Math.PI * 0.22;
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.48, 0.032, 20, 64);
    const ring2 = new THREE.Mesh(ring2Geo, goldMaterial);
    ring2.rotation.y = Math.PI * 0.38;
    ringGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(1.15, 0.026, 16, 56);
    const ring3 = new THREE.Mesh(ring3Geo, goldMaterial);
    ring3.rotation.z = Math.PI * 0.18;
    ringGroup.add(ring3);

    // 3. Faceted Luxury Celebration Prism
    const prismGeo = new THREE.OctahedronGeometry(0.72, 0);
    const prismMesh = new THREE.Mesh(prismGeo, crystalMaterial);
    ringGroup.add(prismMesh);

    const wireGeo = new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.75, 0));
    const wireLines = new THREE.LineSegments(wireGeo, champagneWireMaterial);
    ringGroup.add(wireLines);

    // 4. Floating Celebration Particles / Champagne Facets
    const particleCount = 14;
    const particleMeshes: {
      mesh: THREE.Mesh;
      baseAngle: number;
      radius: number;
      speed: number;
      yOffset: number;
    }[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.045, 12, 12);

    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(sphereGeo, goldMaterial);
      const angle = (i / particleCount) * Math.PI * 2;
      const rad = 2.0 + (i % 3) * 0.35;
      const yBase = -0.6 + (i % 5) * 0.3;
      pMesh.position.set(Math.cos(angle) * rad, yBase, Math.sin(angle) * rad);
      rootGroup.add(pMesh);
      particleMeshes.push({
        mesh: pMesh,
        baseAngle: angle,
        radius: rad,
        speed: 0.003 + (i % 4) * 0.001,
        yOffset: yBase,
      });
    }

    // Balanced Luxury Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xd6b779, 45, 25);
    goldPoint.position.set(3.5, 4.0, 3.5);
    scene.add(goldPoint);

    const bluePoint = new THREE.PointLight(0x38bdf8, 22, 20);
    bluePoint.position.set(-3.5, -1.0, 2.5);
    scene.add(bluePoint);

    const dirLight = new THREE.DirectionalLight(0xfff8eb, 2.2);
    dirLight.position.set(0, 6, 5);
    scene.add(dirLight);

    // Motion & Interactive Mouse Parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let animId: number;
    let tick = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.55;
      targetRotX = y * 0.35;
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      tick += 0.016;

      if (!prefersReducedMotion) {
        // Continuous luxury gimbal orbit
        ring1.rotation.y += 0.006;
        ring1.rotation.x += 0.003;
        ring2.rotation.z += 0.008;
        ring2.rotation.y -= 0.005;
        ring3.rotation.x -= 0.007;
        ring3.rotation.z += 0.004;

        prismMesh.rotation.y += 0.01;
        prismMesh.rotation.x += 0.005;
        wireLines.rotation.y += 0.01;
        wireLines.rotation.x += 0.005;

        // Subtle floating bob
        ringGroup.position.y = Math.sin(tick * 1.5) * 0.08;

        // Animate particles
        particleMeshes.forEach((p, idx) => {
          const a = p.baseAngle + tick * p.speed * 20;
          p.mesh.position.x = Math.cos(a) * p.radius;
          p.mesh.position.z = Math.sin(a) * p.radius;
          p.mesh.position.y = p.yOffset + Math.sin(tick * 2 + idx) * 0.12;
        });
      }

      // Smooth mouse parallax lerp (disabled when prefers-reduced-motion is active)
      if (!prefersReducedMotion) {
        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);

      // Clean disposal
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] flex items-center justify-center pointer-events-auto"
      role="img"
      aria-label="Interactive luxury 3D celebration centerpiece with rotating champagne gold gimbal rings and radiant faceted gem"
    >
      {!webGlSupported && (
        <div className="relative flex items-center justify-center w-64 h-64">
          <div className="absolute inset-0 rounded-full border border-[#D6B779]/40 bg-gradient-to-tr from-[#D6B779]/10 via-[#1E293B]/60 to-transparent animate-pulse" />
          <div className="absolute w-44 h-44 rounded-full border-2 border-[#D6B779]/60 rotate-45 shadow-lg shadow-[#D6B779]/20" />
          <div className="absolute w-32 h-32 rounded-full border border-[#F8FAFC]/50 -rotate-12" />
          <div className="w-20 h-20 rotate-45 rounded-2xl bg-gradient-to-br from-[#D6B779] via-[#F3E5C8] to-[#A98C4C] shadow-2xl flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-[#0F172A]" />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. Main Luxury Dashboard Component
// ============================================================================
export const Dashboard: React.FC<DashboardProps> = ({
  savedPlans,
  onSelectPlan,
  onCreateNew,
  onDeletePlan,
  onExportJson,
  onImportJson,
  onLoadSample,
  onNavigateToFeature,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Metrics Aggregates
  const totalEvents = savedPlans.length;
  const totalBudgetManaged = savedPlans.reduce(
    (sum, p) => sum + (Number(p.budgetPlan?.totalBudget) || 0),
    0
  );
  const totalTasks = savedPlans.reduce((sum, p) => sum + (p.timeline?.length || 0), 0);
  const completedTasks = savedPlans.reduce(
    (sum, p) => sum + (p.timeline?.filter((t) => t.isCompleted).length || 0),
    0
  );
  const readinessPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Feature Quick Access Configuration
  const FEATURE_SHORTCUTS = [
    {
      id: 'planning',
      title: 'Event Planning',
      tag: 'Gemini 2.5',
      icon: Sparkles,
      iconColor: 'text-[#D6B779]',
      iconBg: 'bg-[#D6B779]/15 border-[#D6B779]/30',
      description: 'Conceive tailored celebration themes, scale guest headcounts, and generate AI blueprints.',
      action: () => onCreateNew(),
      buttonText: 'New Concept',
    },
    {
      id: 'budget',
      title: 'Budget Planner',
      tag: 'Finance',
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      description: 'Real-time itemized allocation, cashflow milestones, and multi-currency exchange.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('budget');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-wedding-2');
      },
      buttonText: 'Manage Budget',
    },
    {
      id: 'venues',
      title: 'Venue Discovery',
      tag: 'Google Maps',
      icon: Compass,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      description: 'Explore real-world grounded venues, verify capacities, and vet destination spots.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('vendors');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-birthday-1');
      },
      buttonText: 'Discover Venues',
    },
    {
      id: 'seating',
      title: 'Seating Planner',
      tag: 'Three.js 3D',
      icon: Layers,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      description: 'Interactive spatial physical layout for banquet tables, lounges, and stage arrangements.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('seating');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-wedding-2');
      },
      buttonText: 'Launch 3D Studio',
    },
    {
      id: 'music',
      title: 'Theme Music Studio',
      tag: 'Lyria Realtime',
      icon: Music,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30',
      description: 'Compose bespoke 48kHz audio fanfares, background jazz, and dance anthems.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('music');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-birthday-1');
      },
      buttonText: 'Compose Audio',
    },
    {
      id: 'video',
      title: 'Invitation Studio',
      tag: 'Omni Flash 1.1',
      icon: Film,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15 border-rose-500/30',
      description: 'Produce animated cinematic video teasers in 16:9 widescreen or 9:16 vertical reels.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('video');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-birthday-1');
      },
      buttonText: 'Create Invites',
    },
    {
      id: 'analytics',
      title: 'Analytics & Schedule',
      tag: 'Run of Show',
      icon: BarChart3,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      description: 'Category spend benchmarking, chronological disbursement curves, and day-of timelines.',
      action: () => {
        if (onNavigateToFeature) onNavigateToFeature('schedule');
        else if (savedPlans.length > 0) onSelectPlan(savedPlans[0]);
        else onLoadSample('sample-plan-wedding-2');
      },
      buttonText: 'View Schedule',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12 text-[#F8FAFC]">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* ==================================================================== */}
      {/* SECTION 1: LUXURY 3D HERO BANNER                                     */}
      {/* ==================================================================== */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-3xl border border-[#D6B779]/35 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-[#0F172A]/70"
      >
        {/* Ambient Atmospheric Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#D6B779]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-[#38BDF8]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D6B779_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Refined Welcome & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D6B779]/40 bg-[#D6B779]/10 px-4 py-1.5 text-xs font-semibold text-[#D6B779] shadow-inner backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#D6B779] animate-pulse" />
              <span>Haute Event Architecture · Powered by Gemini</span>
            </div>

            <div className="space-y-3">
              <div className="scale-95 origin-left">
                <VeyoraLogo size="xl" showWordmark={true} showTagline={true} />
              </div>
              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.15]"
              >
                Every Occasion,{' '}
                <span className="bg-gradient-to-r from-[#D6B779] via-[#F3E5C8] to-[#C5A25D] bg-clip-text text-transparent">
                  Extraordinary.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Conceive, budget, and orchestrate bespoke celebrations with AI architectural precision.
                Experience intelligent itemized financial allocation, interactive 3D spatial floor plans,
                DeepMind Lyria musical fanfares, and cinematic video teasers.
              </p>
            </div>

            {/* Main Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D6B779] via-[#E8D4A8] to-[#C5A25D] px-6 py-3 text-xs sm:text-sm font-bold text-[#0F172A] shadow-lg shadow-[#D6B779]/20 hover:shadow-[#D6B779]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <PlusCircle className="h-4 w-4 text-[#0F172A]" />
                <span>Plan Your Event</span>
              </button>

              <a
                href="#blueprints-section"
                className="inline-flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B]/80 hover:bg-[#1E293B] hover:border-[#D6B779]/50 px-5 py-3 text-xs sm:text-sm font-semibold text-[#F8FAFC] shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <Bookmark className="h-4 w-4 text-[#D6B779]" />
                <span>Explore Events</span>
              </a>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#334155]/80 bg-[#0F172A]/70 hover:bg-[#1E293B] px-4 py-3 text-xs sm:text-sm font-medium text-slate-300 hover:text-[#F8FAFC] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none shadow-xs"
              >
                <Upload className="h-4 w-4 text-slate-400" />
                <span>Import JSON</span>
              </button>
            </div>

            {/* Quick Demo Blueprints Preload */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-medium text-slate-400">Sample Blueprints:</span>
              <button
                type="button"
                onClick={() => onLoadSample('sample-plan-birthday-1')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A]/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-[#D6B779] hover:border-[#D6B779]/40 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <span>🎂 21st Rooftop Bash</span>
                <ArrowRight className="h-3 w-3 text-[#D6B779]" />
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('sample-plan-wedding-2')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A]/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-[#D6B779] hover:border-[#D6B779]/40 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <span>💍 Botanical Greenhouse Wedding</span>
                <ArrowRight className="h-3 w-3 text-[#D6B779]" />
              </button>
            </div>
          </div>

          {/* Right Column: Premium 3D Celebration Centerpiece */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D6B779]/15 to-transparent blur-2xl pointer-events-none" />
            <div className="relative w-full rounded-2xl border border-[#334155]/60 bg-[#0F172A]/40 backdrop-blur-xs p-2 shadow-inner">
              <CelebrationCenterpiece3D />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-mono tracking-widest uppercase bg-[#0F172A]/80 px-3 py-1 rounded-full border border-[#334155]/60 pointer-events-none">
                Interactive 3D Centerpiece
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: 3D DEPTH AGGREGATE METRICS STRIP                           */}
      {/* ==================================================================== */}
      <section aria-label="Portfolio Metrics Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Metric 1: Saved Plans */}
        <div className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/90 p-5 shadow-lg shadow-[#0F172A]/40 hover:shadow-xl hover:shadow-[#D6B779]/10 hover:-translate-y-1 hover:border-[#D6B779]/50 transition-all duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Blueprints</span>
            <div className="rounded-xl bg-[#D6B779]/15 p-2 text-[#D6B779] border border-[#D6B779]/30">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            {totalEvents}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Encrypted local persistence</p>
        </div>

        {/* Metric 2: Total Budget */}
        <div className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/90 p-5 shadow-lg shadow-[#0F172A]/40 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Capital Tracked</span>
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            ${totalBudgetManaged.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Multi-currency guardrails</p>
        </div>

        {/* Metric 3: Task Execution */}
        <div className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/90 p-5 shadow-lg shadow-[#0F172A]/40 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 hover:border-sky-500/50 transition-all duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Execution Readiness</span>
            <div className="rounded-xl bg-sky-500/15 p-2 text-sky-400 border border-sky-500/30">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            {completedTasks} <span className="text-sm font-normal text-slate-400">/ {totalTasks}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {readinessPercent}% milestone velocity
          </p>
        </div>

        {/* Metric 4: AI Intelligence Engine */}
        <div className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/90 p-5 shadow-lg shadow-[#0F172A]/40 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Architect Intelligence</span>
            <div className="rounded-xl bg-amber-500/15 p-2 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-lg sm:text-xl font-bold text-[#F8FAFC] tracking-tight">
            Gemini 2.5 Flash
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            Live Voice + Lyria Audio
          </p>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3: QUICK ACCESS FEATURE SHORTCUTS                            */}
      {/* ==================================================================== */}
      <section aria-labelledby="shortcuts-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="shortcuts-heading" className="text-xl font-bold text-[#F8FAFC] tracking-tight">
              Event Architecture Suites
            </h2>
            <p className="text-xs text-slate-400">
              Launch directly into specialized planning environments with full plan synchrony.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {FEATURE_SHORTCUTS.map((feat) => {
            const IconComp = feat.icon;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={feat.action}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#334155]/80 bg-[#1E293B]/80 hover:bg-[#1E293B] p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#D6B779]/60 hover:shadow-xl hover:shadow-[#D6B779]/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`rounded-xl p-2.5 border ${feat.iconBg}`}>
                      <IconComp className={`h-4 w-4 ${feat.iconColor}`} />
                    </div>
                    <span className="rounded-full bg-[#0F172A] border border-[#334155] px-2 py-0.5 text-[10px] font-mono text-[#D6B779]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#D6B779] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#334155]/60 flex items-center justify-between text-[11px] font-semibold text-[#D6B779]">
                  <span>{feat.buttonText}</span>
                  <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: SAVED CELEBRATION BLUEPRINTS CARDS                        */}
      {/* ==================================================================== */}
      <section id="blueprints-section" aria-labelledby="blueprints-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#334155]/70 pb-4">
          <div>
            <h2 id="blueprints-heading" className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Your Celebration Blueprints
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an active celebration to inspect concepts, spatial layouts, itemized budgets, and exports.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#C5A25D] px-4 py-2 text-xs font-bold text-[#0F172A] shadow-md shadow-[#D6B779]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Plan New Event</span>
          </button>
        </div>

        {savedPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedPlans.map((plan) => {
              const completed = plan.timeline.filter((t) => t.isCompleted).length;
              const total = plan.timeline.length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              const currency = plan.budgetPlan?.currency || '$';

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/90 p-6 flex flex-col justify-between hover:border-[#D6B779]/50 hover:shadow-2xl hover:shadow-[#D6B779]/10 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-[#0F172A]/50 group backdrop-blur-md"
                >
                  <div>
                    {/* Event Type & Date Header */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="capitalize text-[#D6B779] font-semibold bg-[#D6B779]/15 px-2.5 py-0.5 rounded-md border border-[#D6B779]/30">
                        {plan.input.eventType}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{plan.input.eventDate}</span>
                    </div>

                    <h3 className="text-lg font-bold text-[#F8FAFC] tracking-tight group-hover:text-[#D6B779] transition-colors">
                      {plan.concept.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {plan.concept.description}
                    </p>

                    {/* Specifications Grid */}
                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs border-y border-[#334155]/70 py-3.5 bg-[#0F172A]/40 rounded-xl px-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Location
                        </span>
                        <span className="font-semibold text-slate-200 truncate block mt-0.5">
                          {plan.input.city}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Guest Scale
                        </span>
                        <span className="font-semibold text-slate-200 block mt-0.5">
                          {plan.input.guestCount} Guests
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Target Budget
                        </span>
                        <span className="font-semibold text-emerald-400 font-mono block mt-0.5">
                          {currency} {plan.budgetPlan?.totalBudget?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Milestones
                        </span>
                        <span className="font-semibold text-[#D6B779] block mt-0.5">
                          {completed}/{total} ({progress}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 space-y-1">
                      <div className="w-full bg-[#0F172A] rounded-full h-1.5 overflow-hidden border border-[#334155]/60">
                        <div
                          className="bg-gradient-to-r from-[#D6B779] to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 flex items-center justify-between border-t border-[#334155]/70">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      aria-label={`Open blueprint for ${plan.concept.title}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#C5A25D] px-4 py-2 text-xs font-bold text-[#0F172A] hover:shadow-md hover:shadow-[#D6B779]/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
                    >
                      <span>Open Blueprint</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onExportJson(plan)}
                        aria-label={`Export JSON backup for ${plan.concept.title}`}
                        className="p-2 text-slate-400 hover:text-[#D6B779] rounded-xl hover:bg-[#0F172A] border border-transparent hover:border-[#334155] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
                        title="Download JSON"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete plan "${plan.concept.title}"?`)) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        aria-label={`Delete plan ${plan.concept.title}`}
                        className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Luxury Empty State */
          <div className="rounded-3xl border border-dashed border-[#334155] bg-[#1E293B]/60 p-12 text-center space-y-5 backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6B779]/15 text-[#D6B779] border border-[#D6B779]/30 shadow-lg shadow-[#D6B779]/10">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#F8FAFC]">No Active Blueprints Stored</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Architect your first celebration with Gemini intelligence or load an illustrative sample
                to explore itemized budgets, 3D seating, and live music composition.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#C5A25D] px-6 py-2.5 text-xs font-bold text-[#0F172A] hover:shadow-lg hover:shadow-[#D6B779]/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Event Plan</span>
            </button>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5: PRIVACY & ARCHITECTURE PERSISTENCE NOTICE                 */}
      {/* ==================================================================== */}
      <footer className="rounded-2xl border border-[#334155]/80 bg-[#1E293B]/70 p-6 text-xs text-slate-400 space-y-2 backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#D6B779]" />
          <span>Veyora Persistence & Privacy Architecture</span>
        </div>
        <p className="leading-relaxed">
          Celebration blueprints are stored locally in your browser storage ({totalEvents} active blueprints).
          You can export any plan as a self-contained JSON file or print to clean PDF for team coordination.
          All Gemini and Lyria API requests are processed securely through application server endpoints with zero
          credential exposure to client bundles.
        </p>
      </footer>
    </div>
  );
};
