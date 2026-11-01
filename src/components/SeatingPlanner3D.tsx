import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Users,
  Maximize2,
  Minimize2,
  RotateCw,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Sun,
  Moon,
  Flame,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Save,
  Palette,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, SeatingTable, TableShape, Venue3DLayout } from '../types/event';
import { generateInitialVenueLayout } from '../utils/layoutGenerator';
import {
  buildTableMesh,
  getWoodParquetTexture,
  getMarbleTexture,
} from './SeatingPlanner3D/ProceduralModels';

interface SeatingPlanner3DProps {
  plan: EventPlan;
  onUpdatePlan: (plan: EventPlan) => void;
}

export const SeatingPlanner3D: React.FC<SeatingPlanner3DProps> = ({ plan, onUpdatePlan }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Layout State
  const [layout, setLayout] = useState<Venue3DLayout>(() => {
    if (plan.seatingLayout && plan.seatingLayout.tables.length > 0) {
      return plan.seatingLayout;
    }
    return generateInitialVenueLayout(
      plan.input.guestCount,
      plan.input.eventType,
      plan.concept.colorPalette?.[0]?.hex || '#6366f1'
    );
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [lightingMode, setLightingMode] = useState<'evening' | 'daylight' | 'neon'>('evening');
  const [floorType, setFloorType] = useState<'wood' | 'marble' | 'carpet' | 'terrazzo'>('wood');
  const [isControlDockOpen, setIsControlDockOpen] = useState(true);
  const [cameraMode, setCameraMode] = useState<'perspective' | 'top' | 'stage' | 'walkthrough'>('perspective');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Show transient notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // References to keep 3D loop independent of React renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tableMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const neonLightRef = useRef<THREE.PointLight | null>(null);

  // Orbit controls state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isMovingTableRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const sphericalRef = useRef({ radius: 28, theta: 0.1, phi: Math.PI / 3.2 });
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);

  // Selection & Raycasting
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseCoordsRef = useRef(new THREE.Vector2());
  const hoveredTableIdRef = useRef<string | null>(null);
  const selectedTableIdRef = useRef<string | null>(selectedTableId);
  selectedTableIdRef.current = selectedTableId;

  const tablesRef = useRef<SeatingTable[]>(layout.tables);
  tablesRef.current = layout.tables;

  // Compute Seating Statistics
  const totalSeated = layout.tables.reduce((sum, t) => sum + (Number(t.seatedGuests) || 0), 0);
  const totalCapacity = layout.tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  const targetGuests = plan.input.guestCount;
  const seatingDiff = totalSeated - targetGuests;

  // Selected table object
  const selectedTable = layout.tables.find((t) => t.id === selectedTableId) || null;

  // 1. Initialize Three.js Scene, Camera, Renderer, Lighting
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 120);
    cameraRef.current = camera;

    // Studio Renderer with ACES ToneMapping & Soft Shadows
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e: any) {
      console.warn('WebGL initialization failed:', e);
      setWebGlError('WebGL 3D visualizer is not supported in this environment. Table metrics, capacities, and layout settings remain fully accessible.');
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    // Warm Key Light
    const dirLight = new THREE.DirectionalLight(0xfff5eb, 2.0);
    dirLight.position.set(16, 26, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 65;
    const d = 20;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.00015;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Cool Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.1);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Neon Accent Light (for Neon Mode)
    const neonLight = new THREE.PointLight(0xf43f5e, 0, 16);
    neonLight.position.set(0, 6, 0);
    scene.add(neonLight);
    neonLightRef.current = neonLight;

    // Procedural Venue Floor (30m x 30m)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getWoodParquetTexture(),
      roughness: 0.38,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorMeshRef.current = floor;

    // Floor Grid Overlay for positioning reference with luxury champagne gold accents
    const grid = new THREE.GridHelper(28, 28, 0xd6b779, 0x334155);
    grid.position.y = 0.002;
    (grid.material as THREE.Material).opacity = 0.35;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Perimeter Venue Walls (Low architectural walls with warm uplights)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });
    const wallH = 2.4;
    const wallThick = 0.4;
    const wallLen = 30;

    // North Wall
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, wallThick), wallMat);
    wallN.position.set(0, wallH / 2, -15);
    scene.add(wallN);

    // South Wall
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, wallThick), wallMat);
    wallS.position.set(0, wallH / 2, 15);
    scene.add(wallS);

    // East Wall
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, wallLen), wallMat);
    wallE.position.set(15, wallH / 2, 0);
    scene.add(wallE);

    // West Wall
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, wallLen), wallMat);
    wallW.position.set(-15, wallH / 2, 0);
    scene.add(wallW);

    // Render / Animation Loop with Clamped Delta Time
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Smooth camera interpolation if transitioning
      if (targetCameraPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.08);
        if (cameraRef.current.position.distanceTo(targetCameraPosRef.current) < 0.1) {
          targetCameraPosRef.current = null;
        }
      } else if (cameraRef.current) {
        // Damped Orbit Camera Update
        const { radius, theta, phi } = sphericalRef.current;
        const target = cameraTargetRef.current;
        const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        const y = target.y + radius * Math.cos(phi);
        const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

        cameraRef.current.position.x += (x - cameraRef.current.position.x) * (1 - Math.exp(-12 * dt));
        cameraRef.current.position.y += (y - cameraRef.current.position.y) * (1 - Math.exp(-12 * dt));
        cameraRef.current.position.z += (z - cameraRef.current.position.z) * (1 - Math.exp(-12 * dt));
        cameraRef.current.lookAt(target);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handling
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Sync 3D Table Meshes when layout.tables changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove obsolete meshes
    const currentTableIds = new Set(layout.tables.map((t) => t.id));
    tableMeshesRef.current.forEach((mesh, id) => {
      if (!currentTableIds.has(id)) {
        scene.remove(mesh);
        tableMeshesRef.current.delete(id);
      }
    });

    // Add or update table meshes
    layout.tables.forEach((table) => {
      let existingMesh = tableMeshesRef.current.get(table.id);

      if (!existingMesh) {
        // Build new composite procedural model
        const newMesh = buildTableMesh(table);
        scene.add(newMesh);
        tableMeshesRef.current.set(table.id, newMesh);
      } else {
        // Smoothly update position & rotation
        existingMesh.position.x = table.x;
        existingMesh.position.z = table.z;
        existingMesh.rotation.y = table.rotation || 0;
      }
    });
  }, [layout.tables]);

  // 3. Update Floor Surface Material
  useEffect(() => {
    if (!floorMeshRef.current) return;
    const mat = floorMeshRef.current.material as THREE.MeshStandardMaterial;

    if (floorType === 'wood') {
      mat.map = getWoodParquetTexture();
      mat.roughness = 0.38;
      mat.metalness = 0.08;
      mat.color.set(0xffffff);
    } else if (floorType === 'marble') {
      mat.map = getMarbleTexture();
      mat.roughness = 0.15;
      mat.metalness = 0.25;
      mat.color.set(0xffffff);
    } else {
      mat.map = null;
      mat.color.set(0x1e1b4b); // Rich Indigo Velvet Carpet
      mat.roughness = 0.85;
      mat.metalness = 0.02;
    }
    mat.needsUpdate = true;
  }, [floorType]);

  // 4. Update Studio Lighting Mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !dirLightRef.current || !hemiLightRef.current || !neonLightRef.current) return;

    if (lightingMode === 'evening') {
      scene.background = new THREE.Color(0x0b0f19);
      scene.fog = new THREE.FogExp2(0x0b0f19, 0.018);
      dirLightRef.current.color.set(0xffedd5); // Warm Candle Amber
      dirLightRef.current.intensity = 1.9;
      hemiLightRef.current.color.set(0xe0f2fe);
      hemiLightRef.current.groundColor.set(0x1e293b);
      hemiLightRef.current.intensity = 1.0;
      neonLightRef.current.intensity = 0;
    } else if (lightingMode === 'daylight') {
      scene.background = new THREE.Color(0x1e293b);
      scene.fog = new THREE.FogExp2(0x1e293b, 0.012);
      dirLightRef.current.color.set(0xffffff); // Crisp Daylight Sun
      dirLightRef.current.intensity = 2.6;
      hemiLightRef.current.color.set(0xffffff);
      hemiLightRef.current.groundColor.set(0x475569);
      hemiLightRef.current.intensity = 1.4;
      neonLightRef.current.intensity = 0;
    } else {
      // Neon Nightclub Vibes
      scene.background = new THREE.Color(0x030712);
      scene.fog = new THREE.FogExp2(0x030712, 0.024);
      dirLightRef.current.color.set(0x6366f1);
      dirLightRef.current.intensity = 1.2;
      hemiLightRef.current.color.set(0x06b6d4);
      hemiLightRef.current.groundColor.set(0xec4899);
      hemiLightRef.current.intensity = 1.5;
      neonLightRef.current.color.set(0xf43f5e);
      neonLightRef.current.intensity = 2.8;
    }
  }, [lightingMode]);

  // 5. Mouse / Touch Orbit Controls & Drag-to-Position Implementation
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const onPointerDown = (e: PointerEvent) => {
      // Ignore if clicking on UI overlay dock
      if ((e.target as HTMLElement).closest('.ui-dock')) return;

      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      // Check if clicking directly on a 3D table collider
      const rect = container.getBoundingClientRect();
      mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (cameraRef.current && sceneRef.current) {
        raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

        // Find table target
        const hit = intersects.find((it) => (it.object as any).userData?.isTableTarget);
        if (hit && e.button === 0) {
          const hitTableId = (hit.object as any).userData.tableId;
          setSelectedTableId(hitTableId);
          selectedTableIdRef.current = hitTableId;
          isMovingTableRef.current = true;
          return;
        }
      }

      if (e.button === 0) {
        isDraggingRef.current = true;
      } else if (e.button === 2) {
        isPanningRef.current = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      // Handle Moving Table on Ground Plane
      if (isMovingTableRef.current && selectedTableIdRef.current && cameraRef.current) {
        const rect = container.getBoundingClientRect();
        mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(plane, intersectPoint);

        if (intersectPoint) {
          // Clamp within venue borders (-12 to 12) and snap to 0.5m grid
          const snappedX = Math.round(Math.max(-12, Math.min(12, intersectPoint.x)) * 2) / 2;
          const snappedZ = Math.round(Math.max(-12, Math.min(12, intersectPoint.z)) * 2) / 2;

          setLayout((prev) => ({
            ...prev,
            tables: prev.tables.map((t) =>
              t.id === selectedTableIdRef.current ? { ...t, x: snappedX, z: snappedZ } : t
            ),
          }));
        }
        return;
      }

      // Handle Orbit Rotation
      if (isDraggingRef.current) {
        targetCameraPosRef.current = null;
        sphericalRef.current.theta -= deltaX * 0.006;
        sphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2.05, sphericalRef.current.phi - deltaY * 0.006)
        );
      } else if (isPanningRef.current && cameraRef.current) {
        // Pan Target
        const panSpeed = 0.03 * (sphericalRef.current.radius / 25);
        const right = new THREE.Vector3();
        cameraRef.current.getWorldDirection(right);
        right.cross(cameraRef.current.up).normalize();

        cameraTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
        cameraTargetRef.current.z += deltaY * panSpeed * Math.cos(sphericalRef.current.theta);
        cameraTargetRef.current.x += deltaY * panSpeed * Math.sin(sphericalRef.current.theta);
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
      isMovingTableRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraPosRef.current = null;
      sphericalRef.current.radius = Math.max(
        6,
        Math.min(48, sphericalRef.current.radius + e.deltaY * 0.02)
      );
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('contextmenu', onContextMenu);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  // Camera Preset View Switcher
  const handleSetCameraView = (mode: 'perspective' | 'top' | 'stage' | 'walkthrough') => {
    setCameraMode(mode);
    if (!cameraRef.current) return;

    if (mode === 'top') {
      cameraTargetRef.current.set(0, 0, 0);
      sphericalRef.current = { radius: 34, theta: 0, phi: 0.05 };
    } else if (mode === 'perspective') {
      cameraTargetRef.current.set(0, 0.5, 0);
      sphericalRef.current = { radius: 26, theta: 0.15, phi: Math.PI / 3.4 };
    } else if (mode === 'stage') {
      cameraTargetRef.current.set(0, 0.8, 4);
      sphericalRef.current = { radius: 18, theta: Math.PI, phi: Math.PI / 2.6 };
    } else if (mode === 'walkthrough') {
      cameraTargetRef.current.set(0, 1.2, 0);
      sphericalRef.current = { radius: 14, theta: 0, phi: Math.PI / 2.2 };
    }
  };

  // Add Table to Scene
  const handleAddTable = (shape: TableShape) => {
    const newId = `table-${shape}-${Date.now().toString().slice(-4)}`;
    const count = layout.tables.filter((t) => t.shape === shape).length + 1;

    let defaultName = `Table ${count}`;
    let defaultCap = 8;
    let defaultColor = plan.concept.colorPalette?.[0]?.hex || '#6366f1';

    if (shape === 'round') {
      defaultName = `Round Banquet ${count}`;
      defaultCap = 8;
    } else if (shape === 'rectangle') {
      defaultName = `Long Feast Table ${count}`;
      defaultCap = 8;
    } else if (shape === 'cocktail') {
      defaultName = `Cocktail High-Top ${count}`;
      defaultCap = 3;
      defaultColor = '#06b6d4';
    } else if (shape === 'stage') {
      defaultName = `Secondary Stage / Dais`;
      defaultCap = 0;
    } else if (shape === 'dance_floor') {
      defaultName = `Dance Floor Zone`;
      defaultCap = 0;
    } else if (shape === 'bar') {
      defaultName = `Satellite Bar Station`;
      defaultCap = 0;
    } else if (shape === 'lounge') {
      defaultName = `Lounge Pod ${count}`;
      defaultCap = 5;
    }

    const newTable: SeatingTable = {
      id: newId,
      name: defaultName,
      shape,
      capacity: defaultCap,
      seatedGuests: defaultCap,
      notes: 'New floor item',
      x: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 6,
      rotation: 0,
      color: defaultColor,
    };

    setLayout((prev) => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));

    setSelectedTableId(newId);
    triggerToast(`Added ${defaultName} to venue`);
  };

  // Rotate Selected Table
  const handleRotateTable = () => {
    if (!selectedTableId) return;
    setLayout((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === selectedTableId ? { ...t, rotation: (t.rotation || 0) + Math.PI / 4 } : t
      ),
    }));
  };

  // Duplicate Selected Table
  const handleDuplicateTable = () => {
    if (!selectedTable) return;
    const newId = `${selectedTable.shape}-${Date.now().toString().slice(-4)}`;
    const duplicated: SeatingTable = {
      ...selectedTable,
      id: newId,
      name: `${selectedTable.name} (Copy)`,
      x: Math.min(11, selectedTable.x + 2),
      z: Math.min(11, selectedTable.z + 1.5),
    };

    setLayout((prev) => ({
      ...prev,
      tables: [...prev.tables, duplicated],
    }));
    setSelectedTableId(newId);
    triggerToast(`Duplicated ${selectedTable.name}`);
  };

  // Delete Selected Table
  const handleDeleteTable = () => {
    if (!selectedTableId) return;
    setLayout((prev) => ({
      ...prev,
      tables: prev.tables.filter((t) => t.id !== selectedTableId),
    }));
    setSelectedTableId(null);
    triggerToast('Item removed from floor plan');
  };

  // Apply Layout Preset
  const handleApplyPreset = (preset: 'banquet' | 'cocktail' | 'conference') => {
    let newLayout: Venue3DLayout;
    if (preset === 'banquet') {
      newLayout = generateInitialVenueLayout(
        plan.input.guestCount,
        'banquet',
        plan.concept.colorPalette?.[0]?.hex || '#6366f1'
      );
    } else if (preset === 'cocktail') {
      newLayout = {
        presetName: 'Cocktail & Social Lounge',
        lightingMode: 'neon',
        floorTexture: 'marble',
        tables: [
          {
            id: 'bar-center',
            name: 'Central Island Bar',
            shape: 'bar',
            capacity: 0,
            seatedGuests: 0,
            x: 0,
            z: 0,
            rotation: 0,
          },
          {
            id: 'dj-stage',
            name: 'DJ Booth & Stage',
            shape: 'stage',
            capacity: 0,
            seatedGuests: 0,
            x: 0,
            z: -9,
            rotation: 0,
          },
          {
            id: 'dance-main',
            name: 'Central Dance Floor',
            shape: 'dance_floor',
            capacity: 0,
            seatedGuests: 0,
            x: 0,
            z: -4.5,
            rotation: 0,
          },
          {
            id: 'lounge-1',
            name: 'VIP Velvet Lounge A',
            shape: 'lounge',
            capacity: 6,
            seatedGuests: 6,
            x: -8,
            z: -2,
            rotation: Math.PI / 2,
          },
          {
            id: 'lounge-2',
            name: 'VIP Velvet Lounge B',
            shape: 'lounge',
            capacity: 6,
            seatedGuests: 6,
            x: 8,
            z: -2,
            rotation: -Math.PI / 2,
          },
          {
            id: 'cocktail-1',
            name: 'Cocktail High-Top 1',
            shape: 'cocktail',
            capacity: 3,
            seatedGuests: 3,
            x: -5,
            z: 4,
          },
          {
            id: 'cocktail-2',
            name: 'Cocktail High-Top 2',
            shape: 'cocktail',
            capacity: 3,
            seatedGuests: 3,
            x: 5,
            z: 4,
          },
          {
            id: 'cocktail-3',
            name: 'Cocktail High-Top 3',
            shape: 'cocktail',
            capacity: 3,
            seatedGuests: 3,
            x: 0,
            z: 6.5,
          },
        ],
      };
    } else {
      // Conference / Seminar
      newLayout = {
        presetName: 'Keynote & Conference',
        lightingMode: 'daylight',
        floorTexture: 'carpet',
        tables: [
          {
            id: 'stage-keynote',
            name: 'Keynote Presentation Stage',
            shape: 'stage',
            capacity: 0,
            seatedGuests: 0,
            x: 0,
            z: -10,
          },
          {
            id: 'row-1-l',
            name: 'Executive Row 1 Left',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: -5,
            z: -4,
          },
          {
            id: 'row-1-r',
            name: 'Executive Row 1 Right',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: 5,
            z: -4,
          },
          {
            id: 'row-2-l',
            name: 'Attendee Row 2 Left',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: -5,
            z: 0,
          },
          {
            id: 'row-2-r',
            name: 'Attendee Row 2 Right',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: 5,
            z: 0,
          },
          {
            id: 'row-3-l',
            name: 'Attendee Row 3 Left',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: -5,
            z: 4,
          },
          {
            id: 'row-3-r',
            name: 'Attendee Row 3 Right',
            shape: 'rectangle',
            capacity: 8,
            seatedGuests: 8,
            x: 5,
            z: 4,
          },
          {
            id: 'coffee-bar',
            name: 'Catering & Coffee Break Station',
            shape: 'bar',
            capacity: 0,
            seatedGuests: 0,
            x: 0,
            z: 9,
          },
        ],
      };
    }

    setLayout(newLayout);
    setLightingMode(newLayout.lightingMode);
    setFloorType(newLayout.floorTexture);
    triggerToast(`Applied ${newLayout.presetName} layout`);
  };

  // Save 3D Venue Blueprint to Event Plan
  const handleSaveLayout = () => {
    const updatedPlan: EventPlan = {
      ...plan,
      seatingLayout: {
        ...layout,
        lightingMode,
        floorTexture: floorType,
      },
      lastEditedAt: new Date().toISOString(),
    };

    onUpdatePlan(updatedPlan);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
    });

    triggerToast('🎉 3D Venue & Seating Blueprint saved to plan!');
  };

  return (
    <div className="relative w-full h-[760px] sm:h-[820px] rounded-3xl overflow-hidden border border-[#D6B779]/35 bg-[#0F172A] shadow-2xl flex flex-col select-none text-[#F8FAFC]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#D6B779] px-4 py-2 text-xs font-bold text-[#0F172A] shadow-xl border border-[#F3E5C8]/50 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* TOP STATUS BAR: Real-time Seating & Capacity Tracker (Luxury 3D Theme) */}
      <div className="ui-dock z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#334155]/80 bg-[#1E293B]/95 px-5 py-3.5 backdrop-blur-md text-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#D6B779]/15 p-2 text-[#D6B779] border border-[#D6B779]/30">
            <Compass className="h-5 w-5 text-[#D6B779]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                3D Venue & Seating Studio
              </span>
              <span className="rounded-md bg-[#D6B779]/15 px-2 py-0.5 text-[10px] font-mono text-[#D6B779] border border-[#D6B779]/30 font-semibold">
                Three.js Spatial Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive physical arrangement for {plan.concept.title} ({plan.input.city})
            </p>
          </div>
        </div>

        {/* Headcount Tracker Progress Cluster */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5 font-bold tabular-nums">
              <Users className="h-3.5 w-3.5 text-[#D6B779]" />
              <span className={seatingDiff === 0 ? 'text-emerald-400' : seatingDiff > 0 ? 'text-[#D6B779]' : 'text-amber-400'}>
                {totalSeated} / {targetGuests} Guests Seated
              </span>
              <span className="text-slate-400 text-[11px] font-normal">
                ({totalCapacity} Total Seats)
              </span>
            </div>

            <div className="w-36 h-1.5 rounded-full bg-[#0F172A] border border-[#334155]/60 mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  seatingDiff === 0
                    ? 'bg-emerald-400'
                    : seatingDiff > 0
                    ? 'bg-gradient-to-r from-[#D6B779] to-[#E8D4A8]'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (totalSeated / (targetGuests || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Save Blueprint Button */}
          <button
            type="button"
            onClick={handleSaveLayout}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#C5A25D] px-4 py-2 text-xs font-bold text-[#0F172A] shadow-md shadow-[#D6B779]/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Blueprint</span>
          </button>
        </div>
      </div>

      {/* 3D CANVAS VIEWPORT */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full" />

        {webGlError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F172A]/90 p-6 text-center text-white backdrop-blur-xs">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <h4 className="text-base font-bold">3D Visualizer Mode</h4>
            <p className="mt-1 max-w-md text-xs text-slate-300">
              {webGlError}
            </p>
          </div>
        )}

        {/* CAMERA PRESET FLOATING STRIP */}
        <div className="ui-dock absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-2xl border border-[#334155] bg-[#1E293B]/90 p-1.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleSetCameraView('perspective')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'perspective' ? 'bg-gradient-to-r from-[#D6B779] to-[#C5A25D] text-[#0F172A] font-bold shadow-xs' : 'text-slate-300 hover:text-[#F8FAFC] hover:bg-[#0F172A]'
            }`}
          >
            Perspective 45°
          </button>
          <button
            type="button"
            onClick={() => handleSetCameraView('top')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'top' ? 'bg-gradient-to-r from-[#D6B779] to-[#C5A25D] text-[#0F172A] font-bold shadow-xs' : 'text-slate-300 hover:text-[#F8FAFC] hover:bg-[#0F172A]'
            }`}
          >
            Top-Down 2D
          </button>
          <button
            type="button"
            onClick={() => handleSetCameraView('stage')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'stage' ? 'bg-gradient-to-r from-[#D6B779] to-[#C5A25D] text-[#0F172A] font-bold shadow-xs' : 'text-slate-300 hover:text-[#F8FAFC] hover:bg-[#0F172A]'
            }`}
          >
            Stage View
          </button>
          <button
            type="button"
            onClick={() => handleSetCameraView('walkthrough')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'walkthrough' ? 'bg-gradient-to-r from-[#D6B779] to-[#C5A25D] text-[#0F172A] font-bold shadow-xs' : 'text-slate-300 hover:text-[#F8FAFC] hover:bg-[#0F172A]'
            }`}
          >
            Eye-Level
          </button>
        </div>

        {/* LIGHTING & FLOOR QUICK TOGGLES (TOP RIGHT) */}
        <div className="ui-dock absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Lighting Mode */}
          <div className="flex items-center gap-1 rounded-2xl border border-[#334155] bg-[#1E293B]/90 p-1.5 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLightingMode('evening')}
              title="Warm Candlelight Evening"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                lightingMode === 'evening' ? 'bg-[#D6B779] text-[#0F172A]' : 'text-slate-300 hover:text-[#F8FAFC]'
              }`}
            >
              <Flame className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('daylight')}
              title="Bright Daylight Sun"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                lightingMode === 'daylight' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('neon')}
              title="Cyber Neon Party"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                lightingMode === 'neon' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          {/* Floor Texture Toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-stone-200 bg-white/95 p-1 shadow-md backdrop-blur-md text-xs">
            <button
              type="button"
              onClick={() => setFloorType('wood')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${floorType === 'wood' ? 'bg-stone-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Oak Wood
            </button>
            <button
              type="button"
              onClick={() => setFloorType('marble')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${floorType === 'marble' ? 'bg-stone-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Marble
            </button>
            <button
              type="button"
              onClick={() => setFloorType('carpet')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${floorType === 'carpet' ? 'bg-stone-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Velvet
            </button>
          </div>
        </div>

        {/* BOTTOM QUICK INSTRUCTION / HINT BAR */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 text-[11px] text-slate-600 font-mono bg-white/90 border border-stone-200 px-3 py-1.5 rounded-xl shadow-xs backdrop-blur-xs">
          Left Drag: Rotate · Right Drag: Pan · Scroll: Zoom · Click Table: Edit / Drag to Move
        </div>

        {/* FLOATING TABLE INSPECTOR DOCK (WHEN TABLE SELECTED) */}
        {selectedTable && (
          <div className="ui-dock absolute top-16 right-4 z-30 w-80 rounded-2xl border border-stone-200 bg-white/98 p-4 shadow-xl backdrop-blur-md space-y-3.5 animate-fade-in text-xs text-slate-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-stone-300"
                  style={{ backgroundColor: selectedTable.color || '#4f46e5' }}
                />
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  {selectedTable.shape.replace('_', ' ')} Settings
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableId(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Table Name Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Label / Table Name
              </label>
              <input
                type="text"
                value={selectedTable.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setLayout((prev) => ({
                    ...prev,
                    tables: prev.tables.map((t) =>
                      t.id === selectedTable.id ? { ...t, name: val } : t
                    ),
                  }));
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-2xs"
              />
            </div>

            {/* Capacity & Seated Steppers (Only for seating objects) */}
            {selectedTable.capacity > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Seat Capacity
                  </label>
                  <div className="flex items-center border border-stone-300 bg-stone-50 rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const newCap = Math.max(2, selectedTable.capacity - 1);
                        setLayout((prev) => ({
                          ...prev,
                          tables: prev.tables.map((t) =>
                            t.id === selectedTable.id
                              ? { ...t, capacity: newCap, seatedGuests: Math.min(t.seatedGuests, newCap) }
                              : t
                          ),
                        }));
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-slate-900 tabular-nums">
                      {selectedTable.capacity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCap = Math.min(16, selectedTable.capacity + 1);
                        setLayout((prev) => ({
                          ...prev,
                          tables: prev.tables.map((t) =>
                            t.id === selectedTable.id ? { ...t, capacity: newCap } : t
                          ),
                        }));
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Guests Seated
                  </label>
                  <div className="flex items-center border border-stone-300 bg-stone-50 rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const newSeated = Math.max(0, selectedTable.seatedGuests - 1);
                        setLayout((prev) => ({
                          ...prev,
                          tables: prev.tables.map((t) =>
                            t.id === selectedTable.id ? { ...t, seatedGuests: newSeated } : t
                          ),
                        }));
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-indigo-700 tabular-nums">
                      {selectedTable.seatedGuests}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSeated = Math.min(selectedTable.capacity, selectedTable.seatedGuests + 1);
                        setLayout((prev) => ({
                          ...prev,
                          tables: prev.tables.map((t) =>
                            t.id === selectedTable.id ? { ...t, seatedGuests: newSeated } : t
                          ),
                        }));
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-stone-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes / VIP Tag */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Table Notes / Assigned Group
              </label>
              <input
                type="text"
                placeholder="e.g. VIP Family, College Friends, Dietary notes..."
                value={selectedTable.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setLayout((prev) => ({
                    ...prev,
                    tables: prev.tables.map((t) =>
                      t.id === selectedTable.id ? { ...t, notes: val } : t
                    ),
                  }));
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none placeholder-slate-400 shadow-2xs"
              />
            </div>

            {/* Quick Action Toolbar for Selected Table */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRotateTable}
                  title="Rotate 45°"
                  className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 shadow-2xs cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateTable}
                  title="Duplicate Table"
                  className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 shadow-2xs cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleDeleteTable}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM COLLAPSIBLE CONTROL DOCK (ADD OBJECTS & PRESETS) */}
        <div className="ui-dock absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          {isControlDockOpen ? (
            <div className="w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white/98 p-4 shadow-xl backdrop-blur-md space-y-3 animate-fade-in text-xs text-slate-900">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Add Floor Elements</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsControlDockOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Add Object Buttons Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddTable('round')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600" />
                  <div>
                    <span className="font-semibold block text-[11px]">Round Table</span>
                    <span className="text-[10px] text-slate-500">8 Guests</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTable('rectangle')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-5 h-3.5 rounded border-2 border-indigo-600" />
                  <div>
                    <span className="font-semibold block text-[11px]">Long Table</span>
                    <span className="text-[10px] text-slate-500">8 Guests</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTable('cocktail')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-600" />
                  <div>
                    <span className="font-semibold block text-[11px]">Cocktail High-Top</span>
                    <span className="text-[10px] text-slate-500">3 Barstools</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTable('lounge')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-5 h-3 rounded-md bg-purple-100 border border-purple-400" />
                  <div>
                    <span className="font-semibold block text-[11px]">VIP Lounge</span>
                    <span className="text-[10px] text-slate-500">Sofa & Plants</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTable('stage')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-5 h-2.5 rounded bg-amber-100 border border-amber-400" />
                  <div>
                    <span className="font-semibold block text-[11px]">Stage / Dais</span>
                    <span className="text-[10px] text-slate-500">Podium & Truss</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTable('bar')}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 text-left hover:border-indigo-300 hover:bg-white text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
                  <div>
                    <span className="font-semibold block text-[11px]">Bar Counter</span>
                    <span className="text-[10px] text-slate-500">Drinks Station</span>
                  </div>
                </button>
              </div>

              {/* Layout Presets Toolbar */}
              <div className="pt-2 border-t border-stone-100">
                <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                  Arrange Template
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('banquet')}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-slate-700 hover:bg-white hover:border-indigo-300 font-medium cursor-pointer shadow-2xs"
                  >
                    Gala Banquet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('cocktail')}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-slate-700 hover:bg-white hover:border-indigo-300 font-medium cursor-pointer shadow-2xs"
                  >
                    Cocktail Social
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('conference')}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-slate-700 hover:bg-white hover:border-indigo-300 font-medium cursor-pointer shadow-2xs"
                  >
                    Conference
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsControlDockOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md hover:bg-stone-50 transition-all cursor-pointer"
            >
              <LayoutGrid className="h-4 w-4 text-indigo-600" />
              <span>Add Items & Presets</span>
              <ChevronUp className="h-4 w-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
