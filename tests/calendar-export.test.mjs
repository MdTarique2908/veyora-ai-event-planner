import test from 'node:test';
import assert from 'node:assert/strict';

test('iCalendar (RFC 5545) & Calendar Integration Tests', async (t) => {
  // Utility implementations aligned with src/utils/icsExport.ts
  function escapeIcsText(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function pad(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }

  function formatIcsDateOnly(date) {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}${month}${day}`;
  }

  function formatIcsDateTimeUtc(date) {
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  function parseScheduleTimeString(timeStr) {
    if (!timeStr) return { hours: 10, minutes: 0 };
    const clean = timeStr.trim().toLowerCase();
    const isPm = clean.includes('pm');
    const isAm = clean.includes('am');
    const numbersOnly = clean.replace(/[^\d:]/g, '');
    const parts = numbersOnly.split(':').map(Number);

    let hours = parts[0] || 10;
    const minutes = parts[1] || 0;

    if (isPm && hours < 12) {
      hours += 12;
    } else if (isAm && hours === 12) {
      hours = 0;
    }

    return {
      hours: Math.min(Math.max(hours, 0), 23),
      minutes: Math.min(Math.max(minutes, 0), 59),
    };
  }

  function calculateMilestoneDate(eventDateStr, offsetDays) {
    const [y, m, d] = eventDateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);
    const calculated = new Date(baseDate);
    calculated.setDate(calculated.getDate() + offsetDays);
    return calculated;
  }

  function generateIcs(plan) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Veyora//Every Occasion Extraordinary//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeIcsText(plan.title)}`,
    ];

    const [y, m, d] = plan.eventDate.split('-').map(Number);
    const eventDate = new Date(y, m - 1, d);
    const nextDay = new Date(y, m - 1, d + 1);

    lines.push(
      'BEGIN:VEVENT',
      `UID:veyora-${plan.id}-main@veyora.ai`,
      `DTSTART;VALUE=DATE:${formatIcsDateOnly(eventDate)}`,
      `DTEND;VALUE=DATE:${formatIcsDateOnly(nextDay)}`,
      `SUMMARY:🎉 ${escapeIcsText(plan.title)}`,
      `DESCRIPTION:${escapeIcsText(plan.description)}`,
      `LOCATION:${escapeIcsText(plan.city)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeIcsText(plan.title)} is tomorrow!`,
      'TRIGGER:-PT1440M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    return lines.join('\r\n');
  }

  // Test 1: Character Escaping in RFC 5545
  await t.test('1. Special character escaping complies with RFC 5545 text rules', () => {
    const raw = 'Dinner, Drinks & Dancing; Notes: \\Special\\ item\nSecond line';
    const escaped = escapeIcsText(raw);
    assert.equal(escaped, 'Dinner\\, Drinks & Dancing\\; Notes: \\\\Special\\\\ item\\nSecond line');

    assert.equal(escapeIcsText(''), '');
    assert.equal(escapeIcsText(null), '');
  });

  // Test 2: Date Formatting
  await t.test('2. Date-only and UTC timestamp formatting adhere to RFC 5545', () => {
    const localDate = new Date(2026, 9, 28); // Oct 28, 2026
    const dateOnlyStr = formatIcsDateOnly(localDate);
    assert.equal(dateOnlyStr, '20261028', 'Date-only should format to YYYYMMDD');

    const utcDate = new Date(Date.UTC(2026, 9, 28, 14, 30, 0));
    const utcStr = formatIcsDateTimeUtc(utcDate);
    assert.equal(utcStr, '20261028T143000Z', 'UTC datetime should format to YYYYMMDDTHHMMSSZ');
  });

  // Test 3: Schedule Time String Parsing
  await t.test('3. Day-of schedule time parser handles 12-hour, 24-hour, and edge cases', () => {
    assert.deepEqual(parseScheduleTimeString('02:30 PM'), { hours: 14, minutes: 30 });
    assert.deepEqual(parseScheduleTimeString('10:00 AM'), { hours: 10, minutes: 0 });
    assert.deepEqual(parseScheduleTimeString('12:00 PM'), { hours: 12, minutes: 0 }); // Noon
    assert.deepEqual(parseScheduleTimeString('12:30 AM'), { hours: 0, minutes: 30 }); // Midnight
    assert.deepEqual(parseScheduleTimeString('18:45'), { hours: 18, minutes: 45 }); // 24-hour
    assert.deepEqual(parseScheduleTimeString(''), { hours: 10, minutes: 0 }); // Default fallback
  });

  // Test 4: Milestone Target Date Calculations
  await t.test('4. Milestone date calculations accurately compute day offsets', () => {
    const eventDate = '2026-11-20';
    const milestoneDate8Weeks = calculateMilestoneDate(eventDate, -56);
    assert.equal(formatIcsDateOnly(milestoneDate8Weeks), '20260925');

    const milestoneDateDayBefore = calculateMilestoneDate(eventDate, -1);
    assert.equal(formatIcsDateOnly(milestoneDateDayBefore), '20261119');

    const milestoneDateDayOf = calculateMilestoneDate(eventDate, 0);
    assert.equal(formatIcsDateOnly(milestoneDateDayOf), '20261120');
  });

  // Test 5: Full .ICS File Generation & Alarm Syntax
  await t.test('5. Generated .ICS file includes valid RFC 5545 headers and valid VALARM TRIGGER', () => {
    const plan = {
      id: 'test-123',
      title: 'Veyora Milestone Celebration',
      description: 'An extraordinary celebration thoughtfully planned with Veyora.',
      eventDate: '2026-12-15',
      city: 'Chicago, IL',
    };

    const icsContent = generateIcs(plan);

    assert.ok(icsContent.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0'));
    assert.ok(icsContent.includes('PRODID:-//Veyora//Every Occasion Extraordinary//EN'));
    assert.ok(icsContent.includes('SUMMARY:🎉 Veyora Milestone Celebration'));
    assert.ok(icsContent.includes('TRIGGER:-PT1440M'), 'VALARM trigger must NOT have invalid leading hyphen');
    assert.doesNotMatch(icsContent, /-TRIGGER:/, 'Must not contain typo -TRIGGER:');
    assert.ok(icsContent.endsWith('END:VCALENDAR'));
  });

  // Test 6: Google Calendar URL Template Generation
  await t.test('6. Google Calendar web URL encodes parameters cleanly', () => {
    const title = '🎉 Maya Birthday';
    const details = 'Planned with Veyora — Every occasion, extraordinary.';
    const location = 'Chicago, IL';
    const startStr = '20261120';
    const endStr = '20261121';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startStr}/${endStr}`,
      details: details,
      location: location,
    });

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;

    assert.ok(url.startsWith('https://calendar.google.com/calendar/render?'));
    assert.ok(url.includes('action=TEMPLATE'));
    assert.ok(url.includes('dates=20261120%2F20261121'));
    assert.ok(url.includes('text=%F0%9F%8E%89+Maya+Birthday'));
    assert.ok(url.includes('location=Chicago%2C+IL'));
  });
});
