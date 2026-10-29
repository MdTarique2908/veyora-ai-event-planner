import { Venue3DLayout, SeatingTable } from '../types/event';

export function generateInitialVenueLayout(
  guestCount: number = 50,
  eventType: string = 'celebration',
  themeColor: string = '#6366f1'
): Venue3DLayout {
  const tables: SeatingTable[] = [];

  // Determine number of banquet tables needed
  // Standard round tables seat 8 to 10 guests
  const tableCapacity = 8;
  const numRoundTables = Math.max(Math.ceil(guestCount / tableCapacity), 4);

  // Center stage at the front (Z = -9)
  tables.push({
    id: 'stage-main',
    name: 'Main Stage & Presentation Dais',
    shape: 'stage',
    capacity: 0,
    seatedGuests: 0,
    notes: 'Speaker podium, backdrop lighting, microphone setup',
    x: 0,
    z: -10,
    rotation: 0,
    color: '#334155',
  });

  // Dance floor or central celebration area right in front of stage (Z = -4.5)
  tables.push({
    id: 'dance-floor-main',
    name: 'Dance Floor & Celebration Center',
    shape: 'dance_floor',
    capacity: 0,
    seatedGuests: 0,
    notes: 'Inlaid parquet floor with corner sound monitors',
    x: 0,
    z: -4.5,
    rotation: 0,
    color: '#1e293b',
  });

  // Bar and beverage station at the back right
  tables.push({
    id: 'bar-main',
    name: 'Artisan Bar & Refreshments',
    shape: 'bar',
    capacity: 0,
    seatedGuests: 0,
    notes: 'Signature cocktail & mocktail service station',
    x: 9,
    z: 7,
    rotation: -Math.PI / 4,
    color: '#0f172a',
  });

  // Lounge area at the back left
  tables.push({
    id: 'lounge-main',
    name: 'VIP Guest Lounge & Photo Area',
    shape: 'lounge',
    capacity: 6,
    seatedGuests: 4,
    notes: 'Plush sofa seating, coffee table, accent greenery',
    x: -8.5,
    z: 7,
    rotation: Math.PI / 4,
    color: '#1e1b4b',
  });

  // Arrange round tables in semi-circular or 2-column arc around the dance floor
  // Left column and Right column positions
  const tablePositions: Array<{ x: number; z: number }> = [
    { x: -5.5, z: -1 },
    { x: 5.5, z: -1 },
    { x: -6.5, z: 3.5 },
    { x: 6.5, z: 3.5 },
    { x: -2.8, z: 5.5 },
    { x: 2.8, z: 5.5 },
    { x: -7.5, z: 8 },
    { x: 7.5, z: 8 },
    { x: 0, z: 9 },
    { x: -5, z: 11 },
    { x: 5, z: 11 },
  ];

  let remainingGuests = guestCount;

  for (let i = 0; i < numRoundTables && i < tablePositions.length; i++) {
    const pos = tablePositions[i];
    const seatsToAssign = Math.min(tableCapacity, remainingGuests);
    remainingGuests = Math.max(0, remainingGuests - seatsToAssign);

    tables.push({
      id: `table-round-${i + 1}`,
      name: i === 0 ? 'VIP Family Table' : i === 1 ? 'Honorees Table' : `Guest Table ${i + 1}`,
      shape: 'round',
      capacity: tableCapacity,
      seatedGuests: seatsToAssign,
      notes: i === 0 ? 'Prime view near stage & dance floor' : 'Center banquet seating',
      x: pos.x,
      z: pos.z,
      rotation: 0,
      color: themeColor,
    });
  }

  // Add 2 cocktail high-tops on the perimeter
  tables.push({
    id: 'cocktail-1',
    name: 'Cocktail High-Top A',
    shape: 'cocktail',
    capacity: 3,
    seatedGuests: 2,
    notes: 'High-top barstool mingling area',
    x: 9,
    z: 1,
    rotation: 0,
    color: '#06b6d4',
  });

  tables.push({
    id: 'cocktail-2',
    name: 'Cocktail High-Top B',
    shape: 'cocktail',
    capacity: 3,
    seatedGuests: 2,
    notes: 'High-top barstool mingling area',
    x: -9,
    z: 1,
    rotation: 0,
    color: '#06b6d4',
  });

  return {
    presetName: 'Banquet Celebration',
    lightingMode: 'evening',
    floorTexture: 'wood',
    tables,
  };
}
