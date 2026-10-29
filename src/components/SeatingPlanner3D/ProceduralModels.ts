import * as THREE from 'three';
import { SeatingTable } from '../../types/event';

// Cache for procedural textures to avoid recreation
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generate procedural radial contact shadow texture
 */
export function getRadialShadowTexture(): THREE.CanvasTexture {
  if (textureCache.has('radial_shadow')) {
    return textureCache.get('radial_shadow')!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('radial_shadow', texture);
  return texture;
}

/**
 * Generate procedural rectangular contact shadow texture
 */
export function getRectShadowTexture(): THREE.CanvasTexture {
  if (textureCache.has('rect_shadow')) {
    return textureCache.get('rect_shadow')!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('rect_shadow', texture);
  return texture;
}

/**
 * Generate procedural Herringbone / Parquet Wood Floor Texture
 */
export function getWoodParquetTexture(): THREE.CanvasTexture {
  if (textureCache.has('wood_parquet')) {
    return textureCache.get('wood_parquet')!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm oak tone
  ctx.fillStyle = '#1c1613';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 24;

  for (let y = 0; y < 512; y += plankH) {
    const row = Math.floor(y / plankH);
    const offsetX = (row % 2) * (plankW / 2);

    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      const px = x + offsetX;
      const shade = 28 + ((x * 13 + y * 17) % 18);
      ctx.fillStyle = `rgb(${shade + 8}, ${shade + 2}, ${shade - 4})`;
      ctx.fillRect(px + 1, y + 1, plankW - 2, plankH - 2);

      // Subtle wood grain lines
      ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4, y + plankH / 2);
      ctx.lineTo(px + plankW - 4, y + plankH / 2);
      ctx.stroke();
    }
  }

  // Dark plank seams
  ctx.strokeStyle = '#0a0807';
  ctx.lineWidth = 1.5;
  for (let y = 0; y <= 512; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  textureCache.set('wood_parquet', texture);
  return texture;
}

/**
 * Generate procedural Polished Marble Tile Texture
 */
export function getMarbleTexture(): THREE.CanvasTexture {
  if (textureCache.has('marble_tile')) {
    return textureCache.get('marble_tile')!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const isAlt = ((x + y) / tileSize) % 2 === 0;
      ctx.fillStyle = isAlt ? '#131b2e' : '#0e1526';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // Faint marble vein curves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 10);
      ctx.bezierCurveTo(x + 40, y + 60, x + 80, y + 40, x + 110, y + 115);
      ctx.stroke();
    }
  }

  // Grout borders
  ctx.strokeStyle = '#070b14';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache.set('marble_tile', texture);
  return texture;
}

/**
 * Helper to build a composite 5-part banquet chair
 */
function createCompositeChair(seatColor: number = 0x334155): THREE.Group {
  const chair = new THREE.Group();

  // Part 1: Cushioned Seat (with beveled top feel)
  const seatGeo = new THREE.CylinderGeometry(0.32, 0.3, 0.08, 16);
  const seatMat = new THREE.MeshStandardMaterial({
    color: seatColor,
    roughness: 0.6,
    metalness: 0.1,
  });
  const seatMesh = new THREE.Mesh(seatGeo, seatMat);
  seatMesh.position.y = 0.58;
  seatMesh.castShadow = true;
  chair.add(seatMesh);

  // Part 2: Seat Base Ring
  const frameGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.8,
  });
  const frameMesh = new THREE.Mesh(frameGeo, metalMat);
  frameMesh.position.y = 0.54;
  chair.add(frameMesh);

  // Part 3: 4 Angled Metallic Legs
  const legGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.54, 8);
  const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  legAngles.forEach((angle) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(Math.cos(angle) * 0.22, 0.27, Math.sin(angle) * 0.22);
    leg.rotation.z = Math.cos(angle) * 0.08;
    leg.rotation.x = Math.sin(angle) * 0.08;
    leg.castShadow = true;
    chair.add(leg);
  });

  // Part 4: Curved Ergonomic Backrest Frame
  const backPostGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8);
  const backPost1 = new THREE.Mesh(backPostGeo, metalMat);
  backPost1.position.set(-0.16, 0.84, -0.22);
  chair.add(backPost1);

  const backPost2 = new THREE.Mesh(backPostGeo, metalMat);
  backPost2.position.set(0.16, 0.84, -0.22);
  chair.add(backPost2);

  // Top curved backrest cross-rail
  const topBarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.36, 12);
  const topBar = new THREE.Mesh(topBarGeo, seatMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 1.08, -0.22);
  topBar.castShadow = true;
  chair.add(topBar);

  // Spindles
  const spindleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.44, 6);
  for (let s = -0.08; s <= 0.08; s += 0.08) {
    const spindle = new THREE.Mesh(spindleGeo, metalMat);
    spindle.position.set(s, 0.82, -0.22);
    chair.add(spindle);
  }

  // Part 5: Soft ground shadow
  const shadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRadialShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  chair.add(shadow);

  return chair;
}

/**
 * 1. ROUND BANQUET TABLE (Composite 7-12 Parts)
 */
export function createRoundTableGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const accentHex = table.color ? parseInt(table.color.replace('#', '0x'), 16) : 0x4f46e5;

  // Part 1: Table Top (Double Cylinder for Chamfer Bevel Silhouette)
  const topGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.08, 36);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.1,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = 0.96;
  topMesh.castShadow = true;
  group.add(topMesh);

  // Part 2: Tablecloth Drape Trim (Flared Skirt)
  const drapeGeo = new THREE.CylinderGeometry(1.36, 1.42, 0.32, 36);
  const drapeMat = new THREE.MeshStandardMaterial({
    color: 0xede9fe,
    roughness: 0.7,
    metalness: 0.05,
  });
  const drapeMesh = new THREE.Mesh(drapeGeo, drapeMat);
  drapeMesh.position.y = 0.82;
  drapeMesh.castShadow = true;
  group.add(drapeMesh);

  // Part 3: Center Column Pedestal
  const poleGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.76, 16);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.2,
    metalness: 0.85,
  });
  const poleMesh = new THREE.Mesh(poleGeo, poleMat);
  poleMesh.position.y = 0.42;
  poleMesh.castShadow = true;
  group.add(poleMesh);

  // Part 4: Stepped Base Disc with Beveled Metallic Rim
  const baseGeo = new THREE.CylinderGeometry(0.68, 0.74, 0.08, 32);
  const baseMesh = new THREE.Mesh(baseGeo, poleMat);
  baseMesh.position.y = 0.04;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Accent Ring around base
  const ringGeo = new THREE.TorusGeometry(0.72, 0.025, 12, 36);
  const ringMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.3,
    metalness: 0.9,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.05;
  group.add(ringMesh);

  // Part 5: Centerpiece (Vase + Flowers + Candle Glow)
  const vaseGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.28, 16);
  const vaseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.2,
  });
  const vase = new THREE.Mesh(vaseGeo, vaseMat);
  vase.position.y = 1.14;
  group.add(vase);

  // Flower blooms
  const bloomGeo = new THREE.DodecahedronGeometry(0.18, 1);
  const bloomMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.6,
    metalness: 0.1,
  });
  const bloom = new THREE.Mesh(bloomGeo, bloomMat);
  bloom.position.y = 1.34;
  group.add(bloom);

  // Warm Centerpiece Candle PointLight
  const candleLight = new THREE.PointLight(0xffecd2, 0.65, 3.5);
  candleLight.position.y = 1.4;
  group.add(candleLight);

  // Part 6: Soft Radial Contact Shadow on Floor
  const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRadialShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Parts 7+: N Detailed Chairs around table
  const chairCount = Math.max(table.capacity || 8, 4);
  const radius = 1.85;

  for (let i = 0; i < chairCount; i++) {
    const angle = (i / chairCount) * Math.PI * 2;
    const chair = createCompositeChair(accentHex);
    chair.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    chair.rotation.y = -angle + Math.PI / 2;
    group.add(chair);
  }

  // Invisible Bounding Collider Box for Raycasting & Selection
  const colliderGeo = new THREE.CylinderGeometry(2.1, 2.1, 1.4, 16);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = 0.7;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 2. RECTANGULAR BANQUET TABLE (Composite 7-10 Parts)
 */
export function createRectangleTableGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const accentHex = table.color ? parseInt(table.color.replace('#', '0x'), 16) : 0x06b6d4;
  const width = 3.2;
  const depth = 1.3;

  // Part 1: Table Plank Top with Beveled Edge
  const topGeo = new THREE.BoxGeometry(width, 0.08, depth);
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.35,
    metalness: 0.1,
  });
  const topMesh = new THREE.Mesh(topGeo, woodMat);
  topMesh.position.y = 0.96;
  topMesh.castShadow = true;
  group.add(topMesh);

  // Part 2: Apron Support Frame
  const apronGeo = new THREE.BoxGeometry(width - 0.2, 0.1, depth - 0.2);
  const apronMesh = new THREE.Mesh(apronGeo, woodMat);
  apronMesh.position.y = 0.88;
  group.add(apronMesh);

  // Part 3: 4 Carved Wooden Legs with Brass Foot Caps
  const legGeo = new THREE.BoxGeometry(0.1, 0.88, 0.1);
  const legX = width / 2 - 0.18;
  const legZ = depth / 2 - 0.18;
  const corners = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ];

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85,
  });

  corners.forEach(([cx, cz]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(cx, 0.46, cz);
    leg.castShadow = true;
    group.add(leg);

    // Brass foot cap
    const capGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
    const cap = new THREE.Mesh(capGeo, brassMat);
    cap.position.set(cx, 0.04, cz);
    group.add(cap);
  });

  // Part 4: Center Fabric Runner
  const runnerGeo = new THREE.BoxGeometry(width + 0.05, 0.015, 0.45);
  const runnerMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.7,
    metalness: 0.05,
  });
  const runner = new THREE.Mesh(runnerGeo, runnerMat);
  runner.position.y = 1.01;
  group.add(runner);

  // Part 5: Centerpiece linear candles
  for (let cx = -0.8; cx <= 0.8; cx += 0.8) {
    const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 12);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.4 });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.set(cx, 1.1, 0);
    group.add(candle);

    const flame = new THREE.PointLight(0xfef08a, 0.4, 2.5);
    flame.position.set(cx, 1.24, 0);
    group.add(flame);
  }

  // Part 6: Soft Rectangular Shadow
  const shadowGeo = new THREE.PlaneGeometry(width + 0.8, depth + 0.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRectShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Chairs along both long sides (3 per side) + 1 at each end
  const chairPositions: Array<{ x: number; z: number; rot: number }> = [
    { x: -0.9, z: depth / 2 + 0.45, rot: 0 },
    { x: 0, z: depth / 2 + 0.45, rot: 0 },
    { x: 0.9, z: depth / 2 + 0.45, rot: 0 },
    { x: -0.9, z: -(depth / 2 + 0.45), rot: Math.PI },
    { x: 0, z: -(depth / 2 + 0.45), rot: Math.PI },
    { x: 0.9, z: -(depth / 2 + 0.45), rot: Math.PI },
    { x: -(width / 2 + 0.45), z: 0, rot: -Math.PI / 2 },
    { x: width / 2 + 0.45, z: 0, rot: Math.PI / 2 },
  ];

  chairPositions.forEach((cp) => {
    const chair = createCompositeChair(accentHex);
    chair.position.set(cp.x, 0, cp.z);
    chair.rotation.y = cp.rot;
    group.add(chair);
  });

  // Collider
  const colliderGeo = new THREE.BoxGeometry(width + 0.8, 1.4, depth + 0.8);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = 0.7;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 3. COCKTAIL HIGH-TOP TABLE (Composite 6 Parts)
 */
export function createCocktailTableGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const accentHex = table.color ? parseInt(table.color.replace('#', '0x'), 16) : 0xec4899;

  // Part 1: Marble / Glass Circular Top
  const topGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.06, 24);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.3,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = 1.38;
  topMesh.castShadow = true;
  group.add(topMesh);

  // Part 2: Slender Chrome/Brass Stem
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.06, 1.34, 16);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.9,
  });
  const stem = new THREE.Mesh(stemGeo, metalMat);
  stem.position.y = 0.69;
  stem.castShadow = true;
  group.add(stem);

  // Part 3: Weighted Base Disc
  const baseGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.06, 24);
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.position.y = 0.03;
  group.add(base);

  // Part 4: Centerpiece Votive Candle
  const votiveGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.1, 16);
  const votiveMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.2,
    metalness: 0.4,
  });
  const votive = new THREE.Mesh(votiveGeo, votiveMat);
  votive.position.y = 1.46;
  group.add(votive);

  // Flame glow
  const glow = new THREE.PointLight(0xfff176, 0.45, 2.5);
  glow.position.y = 1.54;
  group.add(glow);

  // Part 5: Contact shadow
  const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRadialShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Part 6+: 2 High Barstools
  const stoolAngles = [Math.PI / 2, -Math.PI / 2];
  stoolAngles.forEach((angle) => {
    const stool = new THREE.Group();
    // Round seat
    const seatGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.06, 16);
    const seat = new THREE.Mesh(seatGeo, votiveMat);
    seat.position.y = 0.92;
    stool.add(seat);

    // Stem + Footrest ring
    const sStemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 12);
    const sStem = new THREE.Mesh(sStemGeo, metalMat);
    sStem.position.y = 0.46;
    stool.add(sStem);

    const ringGeo = new THREE.TorusGeometry(0.18, 0.015, 8, 20);
    const ring = new THREE.Mesh(ringGeo, metalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.35;
    stool.add(ring);

    // Base
    const sBaseGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.04, 16);
    const sBase = new THREE.Mesh(sBaseGeo, metalMat);
    sBase.position.y = 0.02;
    stool.add(sBase);

    stool.position.set(Math.cos(angle) * 0.95, 0, Math.sin(angle) * 0.95);
    group.add(stool);
  });

  // Collider
  const colliderGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.6, 12);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = 0.8;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 4. ELEVATED STAGE & PRESENTATION PLATFORM (Composite 7 Parts)
 */
export function createStageGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const stageW = 10;
  const stageD = 4.8;
  const stageH = 0.6;

  // Part 1: Main Platform Deck (Rich Charcoal Carpet)
  const deckGeo = new THREE.BoxGeometry(stageW, stageH, stageD);
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.05,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = stageH / 2;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Part 2: Skirting Fascia with Brass Nosing Edge
  const nosingGeo = new THREE.BoxGeometry(stageW + 0.1, 0.04, 0.08);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.8,
  });
  const nosing = new THREE.Mesh(nosingGeo, brassMat);
  nosing.position.set(0, stageH + 0.02, stageD / 2);
  group.add(nosing);

  // LED Uplight strip along stage front base
  const ledGeo = new THREE.BoxGeometry(stageW, 0.04, 0.04);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0, 0.02, stageD / 2 + 0.02);
  group.add(led);

  // Part 3: Access Riser Stairs (2 steps in front center)
  const step1Geo = new THREE.BoxGeometry(2.4, 0.2, 0.6);
  const step1 = new THREE.Mesh(step1Geo, deckMat);
  step1.position.set(0, 0.1, stageD / 2 + 0.6);
  group.add(step1);

  const step2Geo = new THREE.BoxGeometry(2.4, 0.4, 0.6);
  const step2 = new THREE.Mesh(step2Geo, deckMat);
  step2.position.set(0, 0.2, stageD / 2 + 0.3);
  group.add(step2);

  // Part 4: Speaker Lectern / Podium
  const podium = new THREE.Group();
  podium.position.set(0, stageH, -0.6);

  const bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.5);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, woodMat);
  body.position.y = 0.6;
  body.castShadow = true;
  podium.add(body);

  const angleTopGeo = new THREE.BoxGeometry(0.8, 0.08, 0.6);
  const angleTop = new THREE.Mesh(angleTopGeo, brassMat);
  angleTop.rotation.x = -Math.PI / 12;
  angleTop.position.set(0, 1.22, 0);
  podium.add(angleTop);

  // Mic
  const micGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
  const mic = new THREE.Mesh(micGeo, brassMat);
  mic.position.set(0.12, 1.34, 0.05);
  podium.add(mic);

  group.add(podium);

  // Part 5: Rear Backdrop Truss Arch
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.3,
    metalness: 0.9,
  });

  const poleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.8, 0.2), trussMat);
  poleLeft.position.set(-stageW / 2 + 0.4, 1.9, -stageD / 2 + 0.3);
  group.add(poleLeft);

  const poleRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.8, 0.2), trussMat);
  poleRight.position.set(stageW / 2 - 0.4, 1.9, -stageD / 2 + 0.3);
  group.add(poleRight);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(stageW - 0.6, 0.2, 0.2), trussMat);
  topBeam.position.set(0, 3.7, -stageD / 2 + 0.3);
  group.add(topBeam);

  // Part 6: Stage Spotlights (Warm & Cool Key spotlights aimed at podium)
  const spot1 = new THREE.SpotLight(0xffedd5, 1.5, 12, Math.PI / 6, 0.4, 1);
  spot1.position.set(-2, 3.6, 1);
  spot1.target = podium;
  group.add(spot1);

  const spot2 = new THREE.SpotLight(0xbae6fd, 1.2, 12, Math.PI / 6, 0.4, 1);
  spot2.position.set(2, 3.6, 1);
  spot2.target = podium;
  group.add(spot2);

  // Part 7: Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(stageW + 1.2, stageD + 1.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRectShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Collider
  const colliderGeo = new THREE.BoxGeometry(stageW, stageH + 1.5, stageD);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = (stageH + 1.5) / 2;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 5. DANCE FLOOR (Composite 5 Parts)
 */
export function createDanceFloorGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const size = 6.4;

  // Part 1: Raised Parquet / Illuminated Platform
  const floorGeo = new THREE.BoxGeometry(size, 0.08, size);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 0.15,
    metalness: 0.4,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  group.add(floor);

  // Part 2: Metallic Edge Ramp Bevel
  const edgeGeo = new THREE.BoxGeometry(size + 0.2, 0.04, size + 0.2);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const edge = new THREE.Mesh(edgeGeo, brassMat);
  edge.position.y = 0.02;
  group.add(edge);

  // Inlaid LED border line
  const innerSize = size - 0.3;
  const lineGeo = new THREE.PlaneGeometry(innerSize, innerSize);
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
  });
  const gridLine = new THREE.Mesh(lineGeo, lineMat);
  gridLine.rotation.x = -Math.PI / 2;
  gridLine.position.y = 0.082;
  group.add(gridLine);

  // Part 3: 4 Corner Sound Audio Towers
  const cornerDist = size / 2 - 0.2;
  const corners = [
    [-cornerDist, -cornerDist],
    [cornerDist, -cornerDist],
    [-cornerDist, cornerDist],
    [cornerDist, cornerDist],
  ];

  corners.forEach(([cx, cz]) => {
    const speakerGroup = new THREE.Group();
    speakerGroup.position.set(cx, 0, cz);

    // Tripod leg stand
    const tripod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    tripod.position.y = 0.9;
    speakerGroup.add(tripod);

    // Speaker cabinet
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.65, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    cab.position.y = 1.9;
    cab.castShadow = true;
    speakerGroup.add(cab);

    group.add(speakerGroup);
  });

  // Part 4: Center Disco Prism / Ambient Party Glow
  const discoLight = new THREE.PointLight(0xa855f7, 0.8, 7);
  discoLight.position.set(0, 3.5, 0);
  group.add(discoLight);

  // Part 5: Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(size + 1.2, size + 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRectShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Collider
  const colliderGeo = new THREE.BoxGeometry(size, 0.5, size);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = 0.25;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 6. BAR & BEVERAGE STATION (Composite 6 Parts)
 */
export function createBarGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  const barW = 4.6;
  const barD = 1.2;
  const barH = 1.15;

  // Part 1: Front Counter Slatted Wooden Base
  const baseGeo = new THREE.BoxGeometry(barW, barH, barD);
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.1,
  });
  const base = new THREE.Mesh(baseGeo, woodMat);
  base.position.y = barH / 2;
  base.castShadow = true;
  group.add(base);

  // Part 2: Polished Marble Serving Countertop
  const topGeo = new THREE.BoxGeometry(barW + 0.2, 0.1, barD + 0.2);
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.15,
    metalness: 0.4,
  });
  const topMesh = new THREE.Mesh(topGeo, marbleMat);
  topMesh.position.y = barH + 0.05;
  topMesh.castShadow = true;
  group.add(topMesh);

  // Part 3: Brass Lower Foot Rail
  const railGeo = new THREE.CylinderGeometry(0.03, 0.03, barW - 0.4, 16);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const rail = new THREE.Mesh(railGeo, brassMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.18, barD / 2 + 0.15);
  group.add(rail);

  // Part 4: Back-bar Tiered Bottle Display Shelving
  const backShelf = new THREE.Mesh(
    new THREE.BoxGeometry(barW - 0.4, 1.8, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.4 })
  );
  backShelf.position.set(0, 1.4, -0.7);
  group.add(backShelf);

  // Glowing bottle row
  for (let bx = -1.8; bx <= 1.8; bx += 0.45) {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8),
      new THREE.MeshStandardMaterial({
        color: bx > 0 ? 0x06b6d4 : 0xec4899,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      })
    );
    bottle.position.set(bx, 1.4 + 0.14, -0.55);
    group.add(bottle);
  }

  // Part 5: Soft ambient bar lighting
  const barLight = new THREE.PointLight(0xfef08a, 0.8, 4);
  barLight.position.set(0, 2.2, 0);
  group.add(barLight);

  // Part 6: Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(barW + 1, barD + 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRectShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Collider
  const colliderGeo = new THREE.BoxGeometry(barW + 0.2, barH + 0.5, barD + 0.8);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = (barH + 0.5) / 2;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * 7. LOUNGE & PHOTO AREA (Composite 7 Parts)
 */
export function createLoungeGroup(table: SeatingTable): THREE.Group {
  const group = new THREE.Group();
  group.name = table.id;
  group.position.set(table.x, 0, table.z);
  group.rotation.y = table.rotation || 0;

  // Part 1: Velvet Area Rug
  const rugGeo = new THREE.PlaneGeometry(4.2, 3.2);
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.01;
  rug.receiveShadow = true;
  group.add(rug);

  // Part 2: Modular 3-Seater Plush Sofa Base
  const sofaMat = new THREE.MeshStandardMaterial({
    color: 0x312e81,
    roughness: 0.65,
    metalness: 0.1,
  });

  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.9), sofaMat);
  sofaBase.position.set(0, 0.28, -0.6);
  sofaBase.castShadow = true;
  group.add(sofaBase);

  // Cushions
  for (let cx = -0.8; cx <= 0.8; cx += 0.8) {
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.18, 0.82), sofaMat);
    cushion.position.set(cx, 0.5, -0.6);
    cushion.castShadow = true;
    group.add(cushion);
  }

  // Backrest & Armrests
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.25), sofaMat);
  backrest.position.set(0, 0.74, -0.98);
  backrest.castShadow = true;
  group.add(backrest);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.9), sofaMat);
  armL.position.set(-1.3, 0.55, -0.6);
  group.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.9), sofaMat);
  armR.position.set(1.3, 0.55, -0.6);
  group.add(armR);

  // Part 3: Low Round Wooden Coffee Table
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.2,
  });
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 24), tableMat);
  tableTop.position.set(0, 0.42, 0.4);
  tableTop.castShadow = true;
  group.add(tableTop);

  const tableLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
  );
  tableLeg.position.set(0, 0.2, 0.4);
  group.add(tableLeg);

  // Part 4: Potted Fiddle-Leaf Fig Tree
  const plantGroup = new THREE.Group();
  plantGroup.position.set(1.6, 0, -0.8);

  // Terracotta pot
  const potGeo = new THREE.CylinderGeometry(0.3, 0.22, 0.48, 16);
  const potMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.24;
  plantGroup.add(pot);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 16);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.46;
  plantGroup.add(soil);

  // Tree stem & leaves
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.4, 8);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 1.1;
  plantGroup.add(stem);

  // 5 Broad Green Leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  const leafGeo = new THREE.BoxGeometry(0.35, 0.02, 0.5);
  for (let l = 0; l < 5; l++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const ang = (l / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(ang) * 0.2, 1.1 + l * 0.15, Math.sin(ang) * 0.2);
    leaf.rotation.y = ang;
    leaf.rotation.x = 0.3;
    plantGroup.add(leaf);
  }
  group.add(plantGroup);

  // Part 5: Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(4.4, 3.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getRectShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  group.add(shadow);

  // Collider
  const colliderGeo = new THREE.BoxGeometry(3.6, 1.2, 2.8);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.position.y = 0.6;
  (collider as any).userData = { tableId: table.id, isTableTarget: true };
  group.add(collider);

  return group;
}

/**
 * Master Factory: Build the 3D model for any table shape
 */
export function buildTableMesh(table: SeatingTable): THREE.Group {
  switch (table.shape) {
    case 'round':
      return createRoundTableGroup(table);
    case 'rectangle':
      return createRectangleTableGroup(table);
    case 'cocktail':
      return createCocktailTableGroup(table);
    case 'stage':
      return createStageGroup(table);
    case 'dance_floor':
      return createDanceFloorGroup(table);
    case 'bar':
      return createBarGroup(table);
    case 'lounge':
      return createLoungeGroup(table);
    default:
      return createRoundTableGroup(table);
  }
}
