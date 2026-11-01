import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Sparkles, Building2, Music, Film, DollarSign, Clock } from 'lucide-react';

// ============================================================================
// Shared WebGL Verification Helper
// ============================================================================
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ============================================================================
// 1. EventPlanningVisual3D (Dashboard 2: Event Planning - Venue/Stage/Decor)
// ============================================================================
export const EventPlanningVisual3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0.2, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Luxury Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.9,
      roughness: 0.2,
    });
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const ivoryGlowMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      emissive: 0xd6b779,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.9,
    });

    // Tiered Stage Platform
    const stageGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
    const stage = new THREE.Mesh(stageGeo, slateMat);
    stage.position.y = -0.5;
    rootGroup.add(stage);

    const rimGeo = new THREE.TorusGeometry(1.72, 0.035, 16, 48);
    const rim = new THREE.Mesh(rimGeo, goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.4;
    rootGroup.add(rim);

    // Backstage Celebration Arch
    const archGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 48, Math.PI);
    const arch = new THREE.Mesh(archGeo, goldMat);
    arch.position.set(0, -0.4, -0.5);
    rootGroup.add(arch);

    // Twin Decor Pillars & Glowing Lanterns
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 16);
    const lanternGeo = new THREE.OctahedronGeometry(0.18, 0);

    const pillarL = new THREE.Mesh(pillarGeo, goldMat);
    pillarL.position.set(-0.95, -0.05, 0.1);
    const lanternL = new THREE.Mesh(lanternGeo, ivoryGlowMat);
    lanternL.position.set(-0.95, 0.5, 0.1);
    rootGroup.add(pillarL);
    rootGroup.add(lanternL);

    const pillarR = new THREE.Mesh(pillarGeo, goldMat);
    pillarR.position.set(0.95, -0.05, 0.1);
    const lanternR = new THREE.Mesh(lanternGeo, ivoryGlowMat);
    lanternR.position.set(0.95, 0.5, 0.1);
    rootGroup.add(pillarR);
    rootGroup.add(lanternR);

    // Floating Centerpiece Facet
    const centerGeo = new THREE.OctahedronGeometry(0.38, 0);
    const centerFacet = new THREE.Mesh(centerGeo, ivoryGlowMat);
    centerFacet.position.set(0, 0.25, 0);
    rootGroup.add(centerFacet);

    // Orbiting Particles
    const particleCount = 8;
    const particles: THREE.Mesh[] = [];
    const pGeo = new THREE.SphereGeometry(0.035, 8, 8);
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(pGeo, goldMat);
      rootGroup.add(p);
      particles.push(p);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 2.0);
    scene.add(ambientLight);
    const goldLight = new THREE.PointLight(0xd6b779, 30, 15);
    goldLight.position.set(2, 3, 2);
    scene.add(goldLight);
    const blueLight = new THREE.PointLight(0x38bdf8, 15, 12);
    blueLight.position.set(-2, 0, 2);
    scene.add(blueLight);

    // Mouse parallax & animation
    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.45;
      targetRotX = y * 0.25;
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
        centerFacet.rotation.y += 0.012;
        centerFacet.rotation.x += 0.006;
        lanternL.rotation.y -= 0.008;
        lanternR.rotation.y += 0.008;

        particles.forEach((p, idx) => {
          const a = (idx / particleCount) * Math.PI * 2 + tick * 0.4;
          const rad = 1.35 + (idx % 2) * 0.25;
          p.position.set(Math.cos(a) * rad, 0.1 + Math.sin(tick * 1.8 + idx) * 0.15, Math.sin(a) * rad);
        });

        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D celebration stage and decor centerpiece"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-full border border-[#D6B779]/40 bg-gradient-to-tr from-[#D6B779]/15 to-transparent animate-pulse" />
          <div className="w-16 h-16 rotate-45 rounded-xl bg-gradient-to-br from-[#D6B779] to-[#1E293B] shadow-xl flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-[#F8FAFC]" />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. VenueArchitectureVisual3D (Dashboard 3: Venue Discovery - Colonnade & Pavilion)
// ============================================================================
export const VenueArchitectureVisual3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.6, 5.0);
    camera.lookAt(0, 0.1, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.9,
      roughness: 0.2,
    });
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.7,
      ior: 1.48,
    });

    // Foundation Plaza
    const plazaGeo = new THREE.CylinderGeometry(1.7, 1.8, 0.12, 36);
    const plaza = new THREE.Mesh(plazaGeo, slateMat);
    plaza.position.y = -0.55;
    rootGroup.add(plaza);

    const plazaRim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.03, 16, 48), goldMat);
    plazaRim.rotation.x = Math.PI / 2;
    plazaRim.position.y = -0.5;
    rootGroup.add(plazaRim);

    // Architectural Canopy / Roof
    const roofGeo = new THREE.BoxGeometry(1.9, 0.08, 1.9);
    const roof = new THREE.Mesh(roofGeo, slateMat);
    roof.position.y = 0.7;
    rootGroup.add(roof);

    const roofRim = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.03, 1.94), goldMat);
    roofRim.position.y = 0.74;
    rootGroup.add(roofRim);

    // 4 Modern Colonnade Pillars
    const colGeo = new THREE.CylinderGeometry(0.065, 0.075, 1.2, 16);
    const positions = [
      [-0.75, 0.05, -0.75],
      [0.75, 0.05, -0.75],
      [-0.75, 0.05, 0.75],
      [0.75, 0.05, 0.75],
    ];
    positions.forEach(([x, y, z]) => {
      const col = new THREE.Mesh(colGeo, goldMat);
      col.position.set(x, y, z);
      rootGroup.add(col);
    });

    // Glass Facade Partition
    const glassGeo = new THREE.BoxGeometry(1.3, 1.0, 0.04);
    const glassWall = new THREE.Mesh(glassGeo, glassMat);
    glassWall.position.set(0, 0.1, -0.4);
    rootGroup.add(glassWall);

    // Rotating Orientation Compass Ring
    const compassGeo = new THREE.TorusGeometry(1.2, 0.025, 16, 48);
    const compassRing = new THREE.Mesh(compassGeo, goldMat);
    compassRing.rotation.x = Math.PI / 2;
    compassRing.position.y = -0.3;
    rootGroup.add(compassRing);

    // Lighting
    scene.add(new THREE.AmbientLight(0x1e293b, 1.8));
    const p1 = new THREE.PointLight(0xd6b779, 28, 15);
    p1.position.set(2.5, 3, 2);
    scene.add(p1);
    const p2 = new THREE.PointLight(0x38bdf8, 16, 12);
    p2.position.set(-2.5, 0, -2);
    scene.add(p2);

    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
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
        compassRing.rotation.z += 0.008;
        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D architectural pavilion and venue model"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-2xl border border-[#D6B779]/40 bg-gradient-to-tr from-[#1E293B]/80 to-transparent animate-pulse" />
          <Building2 className="h-10 w-10 text-[#D6B779]" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. MusicStudioVisual3D (Dashboard 5: Theme Music Studio - Audio Soundwave Rings)
// ============================================================================
export const MusicStudioVisual3D: React.FC<{
  isPlaying?: boolean;
  className?: string;
}> = ({ isPlaying = false, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 5.0);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.92,
      roughness: 0.18,
    });
    const vinylMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.15,
    });
    const frequencyMat = new THREE.LineBasicMaterial({
      color: 0xf3e5c8,
      transparent: true,
      opacity: 0.8,
    });

    // Central Turntable Disc
    const discGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.06, 48);
    const disc = new THREE.Mesh(discGeo, vinylMat);
    disc.rotation.x = Math.PI * 0.18;
    rootGroup.add(disc);

    // Gold Spindle & Inlay Ring
    const spindleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 24);
    const spindle = new THREE.Mesh(spindleGeo, goldMat);
    spindle.position.y = 0.04;
    disc.add(spindle);

    const groove1 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.015, 16, 48), goldMat);
    groove1.rotation.x = Math.PI / 2;
    disc.add(groove1);

    const groove2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.012, 16, 48), goldMat);
    groove2.rotation.x = Math.PI / 2;
    disc.add(groove2);

    // 3 Soundwave Waveform Rings
    const waveRings: THREE.LineSegments[] = [];
    for (let r = 0; r < 3; r++) {
      const radius = 1.8 + r * 0.35;
      const ringGeo = new THREE.WireframeGeometry(new THREE.TorusGeometry(radius, 0.04, 8, 36));
      const ringMesh = new THREE.LineSegments(ringGeo, frequencyMat);
      ringMesh.rotation.x = Math.PI * 0.18 + r * 0.12;
      rootGroup.add(ringMesh);
      waveRings.push(ringMesh);
    }

    scene.add(new THREE.AmbientLight(0x1e293b, 1.8));
    const pGold = new THREE.PointLight(0xd6b779, 30, 15);
    pGold.position.set(2, 2.5, 3);
    scene.add(pGold);

    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.45;
      targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
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
        const speed = isPlayingRef.current ? 0.04 : 0.008;
        disc.rotation.y += speed;

        waveRings.forEach((wr, i) => {
          wr.rotation.z += 0.006 * (i % 2 === 0 ? 1 : -1);
          if (isPlayingRef.current) {
            wr.scale.setScalar(1 + Math.sin(tick * 5 + i) * 0.06);
          } else {
            wr.scale.setScalar(1 + Math.sin(tick * 1.5 + i) * 0.02);
          }
        });

        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D theme music studio audio soundwave visualizer"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-full border border-[#D6B779]/40 bg-gradient-to-tr from-[#D6B779]/20 to-transparent animate-pulse" />
          <Music className="h-10 w-10 text-[#D6B779]" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. FloatingInvitationCard3D (Dashboard 6: Invitation Studio - Floating 3D Card)
// ============================================================================
export const FloatingInvitationCard3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 5.0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.92,
      roughness: 0.2,
    });
    const cardBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.3,
    });
    const ivoryMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
    });

    // Main Invitation Card Body (Beveled box)
    const cardGeo = new THREE.BoxGeometry(1.9, 2.7, 0.04);
    const card = new THREE.Mesh(cardGeo, cardBodyMat);
    card.rotation.set(0.12, -0.3, 0.05);
    rootGroup.add(card);

    // Champagne Gold Embossed Rim
    const rimGeo = new THREE.BoxGeometry(1.94, 2.74, 0.02);
    const rim = new THREE.Mesh(rimGeo, goldMat);
    rim.position.z = -0.01;
    card.add(rim);

    // Gold Wax Seal Medallion
    const sealGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32);
    const seal = new THREE.Mesh(sealGeo, goldMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, -0.65, 0.035);
    card.add(seal);

    // Decorative Embossed Lines
    const lineGeo = new THREE.BoxGeometry(1.2, 0.025, 0.01);
    const line1 = new THREE.Mesh(lineGeo, ivoryMat);
    line1.position.set(0, 0.45, 0.025);
    card.add(line1);

    const line2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.01), goldMat);
    line2.position.set(0, 0.2, 0.025);
    card.add(line2);

    // Orbiting Golden Sparkles
    const particleCount = 10;
    const particles: THREE.Mesh[] = [];
    const pGeo = new THREE.SphereGeometry(0.04, 8, 8);
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(pGeo, goldMat);
      rootGroup.add(p);
      particles.push(p);
    }

    scene.add(new THREE.AmbientLight(0x1e293b, 2.0));
    const pLight = new THREE.PointLight(0xd6b779, 32, 15);
    pLight.position.set(2, 2.5, 3);
    scene.add(pLight);

    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.55;
      targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.35;
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
        card.position.y = Math.sin(tick * 1.6) * 0.08;
        card.rotation.z = Math.sin(tick * 0.9) * 0.04;

        particles.forEach((p, idx) => {
          const a = (idx / particleCount) * Math.PI * 2 + tick * 0.5;
          const rad = 1.4 + (idx % 3) * 0.2;
          p.position.set(Math.cos(a) * rad, Math.sin(tick * 2 + idx) * 0.3, Math.sin(a) * rad);
        });

        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D floating luxury invitation card with golden seal"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-2xl border border-[#D6B779]/40 bg-gradient-to-tr from-[#1E293B]/80 to-transparent animate-pulse" />
          <Film className="h-10 w-10 text-[#D6B779]" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. BudgetFinancialVisual3D (Dashboard 7: Budget Dashboard - Vault & Asset Tiers)
// ============================================================================
export const BudgetFinancialVisual3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 5.0);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.94,
      roughness: 0.18,
    });
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      transmission: 0.75,
      transparent: true,
      opacity: 0.85,
    });

    // 3 Stacked Financial Tiers
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.15, 36), slateMat);
    tier1.position.y = -0.6;
    rootGroup.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.15, 36), goldMat);
    tier2.position.y = -0.4;
    rootGroup.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.15, 36), slateMat);
    tier3.position.y = -0.2;
    rootGroup.add(tier3);

    // Floating Emerald Vault Gem
    const gemGeo = new THREE.OctahedronGeometry(0.45, 0);
    const gem = new THREE.Mesh(gemGeo, crystalMat);
    gem.position.y = 0.45;
    rootGroup.add(gem);

    // Rotating Trajectory Ring
    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.025, 16, 48), goldMat);
    orbitRing.rotation.x = Math.PI * 0.35;
    rootGroup.add(orbitRing);

    scene.add(new THREE.AmbientLight(0x1e293b, 1.8));
    const pLight = new THREE.PointLight(0xd6b779, 30, 15);
    pLight.position.set(2, 2.5, 3);
    scene.add(pLight);

    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
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
        gem.rotation.y += 0.015;
        gem.rotation.x += 0.008;
        gem.position.y = 0.45 + Math.sin(tick * 2) * 0.06;
        orbitRing.rotation.z += 0.008;

        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D financial vault and asset tiers"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-2xl border border-emerald-500/40 bg-gradient-to-tr from-[#1E293B]/80 to-transparent animate-pulse" />
          <DollarSign className="h-10 w-10 text-emerald-400" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. TimelineScheduleVisual3D (Dashboard 8: Analytics & Schedule - Chronological Ring)
// ============================================================================
export const TimelineScheduleVisual3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !isWebGLAvailable()) {
      setSupported(false);
      return;
    }

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 5.0);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setSupported(false);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd6b779,
      metalness: 0.92,
      roughness: 0.2,
    });
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const ivoryMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
    });

    // Chronological Ring (Hourglass Orbital Loop)
    const timelineRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.045, 16, 56), goldMat);
    timelineRing.rotation.x = Math.PI * 0.25;
    rootGroup.add(timelineRing);

    // Inner Secondary Horizon Ring
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.03, 16, 48), slateMat);
    innerRing.rotation.y = Math.PI * 0.3;
    rootGroup.add(innerRing);

    // Center Milestone Core
    const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const core = new THREE.Mesh(coreGeo, ivoryMat);
    rootGroup.add(core);

    // 6 Milestone Spheres on Timeline Ring
    const milestoneCount = 6;
    const milestoneSpheres: THREE.Mesh[] = [];
    const mGeo = new THREE.SphereGeometry(0.08, 12, 12);
    for (let i = 0; i < milestoneCount; i++) {
      const m = new THREE.Mesh(mGeo, i % 2 === 0 ? goldMat : ivoryMat);
      timelineRing.add(m);
      const angle = (i / milestoneCount) * Math.PI * 2;
      m.position.set(Math.cos(angle) * 1.6, Math.sin(angle) * 1.6, 0);
      milestoneSpheres.push(m);
    }

    scene.add(new THREE.AmbientLight(0x1e293b, 1.8));
    const pLight = new THREE.PointLight(0xd6b779, 32, 15);
    pLight.position.set(2, 2.5, 3);
    scene.add(pLight);

    let targetRotY = 0;
    let targetRotX = 0;
    let animId: number;
    let tick = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
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
        timelineRing.rotation.z += 0.008;
        innerRing.rotation.x += 0.006;
        innerRing.rotation.z -= 0.005;

        core.scale.setScalar(1 + Math.sin(tick * 2) * 0.05);

        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
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
      className={`relative w-full h-[200px] sm:h-[240px] flex items-center justify-center pointer-events-auto ${className}`}
      role="img"
      aria-label="Interactive 3D chronological run-of-show timeline ring"
    >
      {!supported && (
        <div className="relative flex items-center justify-center w-40 h-40">
          <div className="absolute inset-0 rounded-full border border-[#D6B779]/40 bg-gradient-to-tr from-[#1E293B]/80 to-transparent animate-pulse" />
          <Clock className="h-10 w-10 text-[#D6B779]" />
        </div>
      )}
    </div>
  );
};
