import test from 'node:test';
import assert from 'node:assert/strict';

test('Core Product Features: Video Invites, Seating, Voice & Collaboration', async (t) => {
  // Test 1: Video Invitation Studio & Teaser Export Payload
  await t.test('1. Video invitation creation, aspect ratio support, and download filename sanitization', () => {
    function createVideoInvite(planTitle, aspectRatio, customPrompt = '') {
      const id = `invite-${Date.now()}`;
      const defaultPrompt = `Cinematic golden confetti and glowing sparkles bursting in slow motion, revealing "${planTitle}".`;
      return {
        id,
        title: `${planTitle} — Official Teaser`,
        videoUrl: `blob:http://localhost:3000/${id}`,
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
        prompt: customPrompt || defaultPrompt,
        createdAt: new Date().toISOString(),
        durationSeconds: 5,
      };
    }

    function formatDownloadFilename(title, aspectRatio) {
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const ratio = aspectRatio.replace(':', 'x');
      return `${safeTitle}-${ratio}-invitation.webm`;
    }

    // 16:9 Landscape invite
    const invite16x9 = createVideoInvite('Golden Jubilee 2026', '16:9');
    assert.equal(invite16x9.aspectRatio, '16:9');
    assert.equal(invite16x9.durationSeconds, 5);
    assert.match(invite16x9.prompt, /Golden Jubilee 2026/);

    // 9:16 Portrait / Reel invite
    const invite9x16 = createVideoInvite('Summer Gala', '9:16');
    assert.equal(invite9x16.aspectRatio, '9:16');

    // Filename sanitization
    const filename1 = formatDownloadFilename('Grand Gala: 25th Year! (VIP)', '16:9');
    assert.equal(filename1, 'grand_gala__25th_year___vip_-16x9-invitation.webm');
    assert.doesNotMatch(filename1, /[:\s!]/, 'Filename must contain no spaces, colons, or exclamation marks');

    // Video collection management
    let invites = [invite16x9, invite9x16];
    assert.equal(invites.length, 2);

    // Remove video by ID
    invites = invites.filter((v) => v.id !== invite16x9.id);
    assert.equal(invites.length, 1);
    assert.equal(invites[0].id, invite9x16.id);
  });

  // Test 2: Seating 3D Venue Layout, Table Capacities & Headcount Tracker
  await t.test('2. 3D seating planner accurately calculates table capacities and coordinate bounds', () => {
    const TABLE_SHAPES = {
      round: { defaultCapacity: 8, radius: 1.6 },
      rectangle: { defaultCapacity: 8, width: 3.2, depth: 1.4 },
      cocktail: { defaultCapacity: 4, radius: 0.9 },
    };

    function calculateVenueMetrics(tables, targetGuests) {
      const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || TABLE_SHAPES[t.shape]?.defaultCapacity || 8), 0);
      const totalSeated = tables.reduce((acc, t) => acc + (t.assignedGuests?.length || 0), 0);
      const seatingDiff = totalCapacity - targetGuests;

      return {
        totalCapacity,
        totalSeated,
        targetGuests,
        seatingDiff,
        isSufficient: totalCapacity >= targetGuests,
      };
    }

    const testTables = [
      { id: 't1', shape: 'round', capacity: 8, x: -4, z: -4, assignedGuests: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'] },
      { id: 't2', shape: 'round', capacity: 8, x: 4, z: -4, assignedGuests: ['g9', 'g10'] },
      { id: 't3', shape: 'rectangle', capacity: 8, x: -4, z: 4, assignedGuests: [] },
      { id: 't4', shape: 'cocktail', capacity: 4, x: 4, z: 4, assignedGuests: [] },
    ];

    const metrics50 = calculateVenueMetrics(testTables, 50);
    assert.equal(metrics50.totalCapacity, 28, '4 tables should total 8+8+8+4 = 28 capacity');
    assert.equal(metrics50.totalSeated, 10, '10 guests currently assigned');
    assert.equal(metrics50.seatingDiff, -22, 'Deficit of 22 seats for 50 target guests');
    assert.equal(metrics50.isSufficient, false);

    const metrics25 = calculateVenueMetrics(testTables, 25);
    assert.equal(metrics25.isSufficient, true, '28 seats is sufficient for 25 target guests');
    assert.equal(metrics25.seatingDiff, 3, 'Surplus of 3 seats');

    // Venue Coordinate Boundary Guard: Room boundaries are +/- 14 meters
    function isWithinVenueBounds(table, maxBoundary = 14) {
      return Math.abs(table.x) <= maxBoundary && Math.abs(table.z) <= maxBoundary;
    }

    assert.equal(isWithinVenueBounds({ x: 10, z: -12 }), true, 'Table at (10, -12) is inside bounds');
    assert.equal(isWithinVenueBounds({ x: 15, z: 2 }), false, 'Table at (15, 2) exceeds x-boundary');
    assert.equal(isWithinVenueBounds({ x: 0, z: -16 }), false, 'Table at (0, -16) exceeds z-boundary');
  });

  // Test 3: Voice Note Recording & Media Capture Resilience
  await t.test('3. Voice memo failure handling gracefully manages permission and hardware errors', () => {
    function handleRecordingError(err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return {
          canRecord: false,
          fallbackMode: 'text-memo',
          userMessage: 'Microphone permission was denied. Please allow microphone access in your browser or type notes manually.',
        };
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return {
          canRecord: false,
          fallbackMode: 'text-memo',
          userMessage: 'No microphone was detected on this device. You can type voice memo notes manually below.',
        };
      }
      return {
        canRecord: false,
        fallbackMode: 'text-memo',
        userMessage: 'Audio recording could not start. Please use manual note entry.',
      };
    }

    // Permission denied error
    const permError = new Error('Permission denied');
    permError.name = 'NotAllowedError';
    const permRecovery = handleRecordingError(permError);
    assert.equal(permRecovery.canRecord, false);
    assert.equal(permRecovery.fallbackMode, 'text-memo');
    assert.match(permRecovery.userMessage, /Microphone permission was denied/);

    // Missing device error
    const notFoundError = new Error('No mic');
    notFoundError.name = 'NotFoundError';
    const notFoundRecovery = handleRecordingError(notFoundError);
    assert.equal(notFoundRecovery.canRecord, false);
    assert.match(notFoundRecovery.userMessage, /No microphone was detected/);

    // MIME type selection logic
    function selectRecordingMimeType(supportedTypes) {
      if (supportedTypes.includes('audio/webm')) return 'audio/webm';
      if (supportedTypes.includes('audio/mp4')) return 'audio/mp4';
      return 'audio/wav';
    }

    assert.equal(selectRecordingMimeType(['audio/webm', 'audio/mp4']), 'audio/webm');
    assert.equal(selectRecordingMimeType(['audio/mp4']), 'audio/mp4');
    assert.equal(selectRecordingMimeType([]), 'audio/wav');
  });

  // Test 4: Co-Host Collaboration & Role Permission Matrix
  await t.test('4. Co-Host role hierarchy enforces permissions and records activity audits', () => {
    const ROLE_PERMISSIONS = {
      owner: { canEditPlan: true, canInvite: true, canDeletePlan: true, canView: true },
      co_host: { canEditPlan: true, canInvite: true, canDeletePlan: false, canView: true },
      viewer: { canEditPlan: false, canInvite: false, canDeletePlan: false, canView: true },
    };

    function checkPermission(role, action) {
      const perms = ROLE_PERMISSIONS[role] || { canEditPlan: false, canInvite: false, canDeletePlan: false, canView: false };
      return Boolean(perms[action]);
    }

    // Owner checks
    assert.equal(checkPermission('owner', 'canDeletePlan'), true);
    assert.equal(checkPermission('owner', 'canEditPlan'), true);

    // Co-host checks
    assert.equal(checkPermission('co_host', 'canEditPlan'), true);
    assert.equal(checkPermission('co_host', 'canInvite'), true);
    assert.equal(checkPermission('co_host', 'canDeletePlan'), false, 'Co-hosts must NOT be permitted to delete plans');

    // Viewer checks
    assert.equal(checkPermission('viewer', 'canView'), true);
    assert.equal(checkPermission('viewer', 'canEditPlan'), false, 'Viewers must NOT edit plans');
    assert.equal(checkPermission('viewer', 'canInvite'), false, 'Viewers must NOT invite users');

    // Activity logging
    function logActivity(actorName, role, action, detail) {
      return {
        id: `act-${Date.now()}`,
        actorName,
        role,
        action,
        detail,
        timestamp: new Date().toISOString(),
      };
    }

    const log1 = logActivity('Alex Rivera', 'co_host', 'reallocated_budget', 'Shifted $300 from decor to catering');
    assert.equal(log1.actorName, 'Alex Rivera');
    assert.equal(log1.role, 'co_host');
    assert.equal(log1.action, 'reallocated_budget');
    assert.ok(log1.timestamp, 'Log must contain ISO timestamp');
  });

  // Test 5: Printable Event Summary & Brief Generation
  await t.test('5. Printable event brief compiles complete text representation without missing essentials', () => {
    function generatePrintableBrief(plan) {
      const lines = [];
      lines.push(`====================================================`);
      lines.push(`VEYORA EVENT BRIEF: ${plan.concept.title.toUpperCase()}`);
      lines.push(`====================================================`);
      lines.push(`Occasion Date: ${plan.input.eventDate}`);
      lines.push(`Location:      ${plan.input.city}`);
      lines.push(`Guest Count:   ${plan.input.guestCount} guests`);
      lines.push(`Total Budget:  ${plan.budgetPlan.currency} ${plan.budgetPlan.totalBudget.toLocaleString()}`);
      lines.push(``);
      lines.push(`--- ITEMISED BUDGET ---`);
      plan.budgetPlan.items.forEach((it) => {
        lines.push(`• [${it.category}] ${it.name}: ${plan.budgetPlan.currency} ${it.estimatedCost}`);
      });
      lines.push(``);
      lines.push(`--- RUN OF SHOW SCHEDULE ---`);
      plan.dayOfSchedule.forEach((s) => {
        lines.push(`${s.time} — ${s.activity} (${s.details})`);
      });
      return lines.join('\n');
    }

    const mockPlan = {
      concept: { title: 'Golden Gala' },
      input: { eventDate: '2026-12-31', city: 'London, UK', guestCount: 120 },
      budgetPlan: {
        currency: 'GBP',
        totalBudget: 15000,
        items: [
          { category: 'Venue & Space', name: 'Westminster Hall', estimatedCost: 6000 },
          { category: 'Food & Beverages', name: 'Canapes & Dinner', estimatedCost: 5500 },
        ],
      },
      dayOfSchedule: [
        { time: '06:00 PM', activity: 'Guest Arrival', details: 'Welcome drinks' },
        { time: '08:00 PM', activity: 'Banquet Dinner', details: 'Three-course meal' },
      ],
    };

    const brief = generatePrintableBrief(mockPlan);
    assert.match(brief, /GOLDEN GALA/);
    assert.match(brief, /Occasion Date: 2026-12-31/);
    assert.match(brief, /Location:      London, UK/);
    assert.match(brief, /Guest Count:   120 guests/);
    assert.match(brief, /Total Budget:  GBP 15,000/);
    assert.match(brief, /Westminster Hall/);
    assert.match(brief, /06:00 PM — Guest Arrival/);
  });
});
