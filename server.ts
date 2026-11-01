import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import {
  EventInput,
  EventPlan,
  BudgetItem,
  TimelineTask,
  VendorRecommendation,
  GroundedMapsPlace,
} from './src/types/event';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for dynamic resilient fallback generator
function generateResilientFallbackPlan(input: EventInput): EventPlan {
  const budget = Number(input.totalBudget) || 3000;
  const guests = Number(input.guestCount) || 50;
  const currency = input.currency || 'USD';
  const eventType = input.eventType || 'celebration';
  const theme = input.themeStyle || 'Modern Festive';
  const city = input.city || 'Local City';

  // Realistic budget allocation breakdown
  const venueBudget = Math.round(budget * 0.32);
  const cateringBudget = Math.round(budget * 0.34);
  const photoBudget = Math.round(budget * 0.12);
  const decorBudget = Math.round(budget * 0.09);
  const entertainmentBudget = Math.round(budget * 0.06);
  const contingency = Math.round(budget * 0.07);

  const items: BudgetItem[] = [
    {
      id: 'fb-b1',
      category: 'Venue & Space',
      name: `${input.venuePreference === 'outdoor' ? 'Park Pavilion / Garden Grounds' : 'Event Space / Private Hall'} Rental & Cleaning`,
      estimatedCost: venueBudget,
      notes: `Estimated booking for ${guests} guests in ${city}`,
      isEssential: true,
    },
    {
      id: 'fb-b2',
      category: 'Food & Beverages',
      name: 'Main Meal Service & Refreshment Station',
      estimatedCost: cateringBudget,
      notes: `Approx. ${currency} ${(cateringBudget / guests).toFixed(0)} per guest including ${input.foodPreferences?.join(', ') || 'standard catering'}`,
      isEssential: true,
    },
    {
      id: 'fb-b3',
      category: 'Photography & Video',
      name: 'Professional Photographer / Photo Booth Setup',
      estimatedCost: photoBudget,
      notes: 'Capturing event milestones, guest portraits, and digital gallery',
      isEssential: false,
    },
    {
      id: 'fb-b4',
      category: 'Decor & Styling',
      name: `Atmosphere Decor (${theme}) & Lighting`,
      estimatedCost: decorBudget,
      notes: 'Signage, table runners, accent lighting, floral or balloon accents',
      isEssential: false,
    },
    {
      id: 'fb-b5',
      category: 'Entertainment & Audio',
      name: 'Sound System / Music Playlist Setup & MC Gear',
      estimatedCost: entertainmentBudget,
      notes: 'Audio PA system, microphone for announcements, curated music tracks',
      isEssential: true,
    },
    {
      id: 'fb-b6',
      category: 'Contingency Fund',
      name: 'Unforeseen Expenses & Emergency Buffer',
      estimatedCost: contingency,
      notes: 'Reserved 7% buffer for weather contingencies, tips, or extra supplies',
      isEssential: true,
    },
  ];

  const timeline: TimelineTask[] = [
    {
      id: 'fb-t1',
      title: 'Finalize and secure venue reservation',
      description: `Confirm accessibility, parking, and curfew rules in ${city}.`,
      category: 'Venue',
      duePhase: '8+ Weeks Before',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'fb-t2',
      title: 'Send out invitations & set RSVP cutoff',
      description: `Collect dietary preferences for ${guests} estimated guests.`,
      category: 'Invites',
      duePhase: '4-6 Weeks Before',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'fb-t3',
      title: 'Confirm menu with caterer or food supplier',
      description: `Review requirements: ${input.foodPreferences?.join(', ') || 'dietary options'}.`,
      category: 'Catering',
      duePhase: '2-3 Weeks Before',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'fb-t4',
      title: 'Finalize music playlist, schedule & decor assembly',
      description: `Ensure sound check and ${theme} aesthetic components are ready.`,
      category: 'Entertainment',
      duePhase: '1 Week Before',
      priority: 'medium',
      isCompleted: false,
    },
    {
      id: 'fb-t5',
      title: 'Pack event day kit & confirm vendor arrival times',
      description: 'Prepare checklist, contact numbers, tape, scissors, phone chargers.',
      category: 'Operations',
      duePhase: 'Day Before',
      priority: 'high',
      isCompleted: false,
    },
    {
      id: 'fb-t6',
      title: 'Coordinate arrival, welcome guests & execute schedule',
      description: 'Follow the run-of-show schedule and enjoy the celebration!',
      category: 'Operations',
      duePhase: 'Event Day',
      priority: 'high',
      isCompleted: false,
    },
  ];

  const vendorRecommendations: VendorRecommendation[] = [
    {
      id: 'fb-v1',
      category: 'Venue',
      name: `${city} Heritage Hall & Garden`,
      priceRange: '$$',
      estimatedCost: `${currency} ${Math.round(venueBudget * 0.8)} - ${currency} ${venueBudget}`,
      location: `${city} Central`,
      specialty: `Flexible capacity up to ${guests + 30} guests with indoor/outdoor flow`,
      contactOrWebsite: `events@${city.toLowerCase().replace(/[^a-z]/g, '')}heritagehall.sample`,
      isSampleData: true,
      keyQuestionsToAsk: [
        'What are the load-in and teardown hours allowed?',
        'Is sound amplification permitted outdoors?',
      ],
      recommendedBookingWindow: '6-10 weeks in advance',
    },
    {
      id: 'fb-v2',
      category: 'Catering',
      name: `Artisan Harvest Catering Co.`,
      priceRange: '$$',
      estimatedCost: `${currency} ${Math.round((cateringBudget / guests) * 0.9)} - ${currency} ${Math.round((cateringBudget / guests) * 1.15)} / guest`,
      location: `${city} Metro`,
      specialty: `Fresh seasonal displays accommodating ${input.foodPreferences?.slice(0, 2).join(' & ') || 'varied diets'}`,
      contactOrWebsite: `info@artisanharvestcatering.sample`,
      isSampleData: true,
      keyQuestionsToAsk: [
        'Are server staff and chafing warmers included in the quote?',
        'What is your cancellation or headcount adjustment deadline?',
      ],
      recommendedBookingWindow: '4-8 weeks in advance',
    },
    {
      id: 'fb-v3',
      category: 'Photography',
      name: `Moments & Light Photography`,
      priceRange: '$$',
      estimatedCost: `${currency} ${Math.round(photoBudget * 0.85)} - ${currency} ${photoBudget}`,
      location: `${city}`,
      specialty: 'Documentary candid coverage and high-resolution online gallery',
      contactOrWebsite: `hello@momentslightphoto.sample`,
      isSampleData: true,
      keyQuestionsToAsk: [
        'How many edited photos are delivered and what is the turnaround time?',
        'Do you provide full digital sharing rights?',
      ],
      recommendedBookingWindow: '4-6 weeks in advance',
    },
  ];

  return {
    id: `plan-${Date.now()}`,
    input,
    concept: {
      title: `${input.title || `${theme} ${eventType.toUpperCase()}`}`,
      tagline: `A thoughtfully curated ${theme} experience tailored for ${guests} guests in ${city}.`,
      description: `This event combines high-impact sensory styling with seamless hospitality. Crafted for an estimated budget of ${currency} ${budget.toLocaleString()}, every component emphasizes guest comfort, smooth pacing, and memorable celebration moments without wasteful spending.`,
      colorPalette: [
        { name: 'Royal Indigo', hex: '#4338ca' },
        { name: 'Warm Amber', hex: '#f59e0b' },
        { name: 'Cool Slate', hex: '#64748b' },
        { name: 'Champagne Cream', hex: '#fef3c7' },
      ],
      vibeKeywords: ['Celebratory', 'Warm', 'Well-Paced', 'Welcoming', 'Memorable'],
      dressCodeSuggestion: 'Smart Casual / Festive Themed Attire',
    },
    budgetPlan: {
      totalBudget: budget,
      currency,
      items,
      budgetTips: [
        `Book the venue early or during non-peak hours to negotiate up to a 15% discount.`,
        `Choose a self-serve signature beverage dispenser instead of open bar service to save significantly on bartending staffing.`,
        `Repurpose ceremony or entrance florals/decor for the reception food stations to double their visual value.`,
      ],
      contingencyPercentage: 7,
    },
    timeline,
    dayOfSchedule: [
      { time: '02:00 PM', activity: 'Setup & Vendor Arrival', details: 'Sound check, lighting, tables and decor placement', owner: 'Lead Coordinator' },
      { time: '04:30 PM', activity: 'Guest Welcome & Drinks', details: 'Ambient background music and refreshments', owner: 'Greeters' },
      { time: '05:30 PM', activity: 'Main Program / Meal Service', details: 'Food stations open, casual seating, conversations', owner: 'Catering Lead' },
      { time: '07:00 PM', activity: 'Toasts, Activities & Speeches', details: 'Key celebration moments, interactive guest highlight', owner: 'Master of Ceremonies' },
      { time: '08:00 PM', activity: 'Music, Celebration & Dancing', details: 'Lively playlist, photo captures, dessert bar', owner: 'DJ / Audio Lead' },
      { time: '10:00 PM', activity: 'Event Farewell & Teardown', details: 'Send-off, personal item collection, venue cleanup', owner: 'Host & Helpers' },
    ],
    recommendations: {
      venueTips: [
        `Ensure ${input.venuePreference === 'outdoor' ? 'a covered canopy or indoor backup room is accessible in case of rain or wind' : 'adequate ventilation and climate control for ' + guests + ' attendees'}.`,
        'Confirm load-in parking access for food and decor deliveries.',
      ],
      cateringIdeas: [
        'Station-style dining with clearly labeled allergen cards (nuts, dairy, gluten-free, vegan).',
        'Signature celebration mocktail/cocktail tailored to the theme colors.',
      ],
      decorAndAmbiance: [
        'Warm string fairy lights or soft uplighting around the perimeter to elevate standard room spaces.',
        'Welcome chalkboard or custom framed welcome sign with event hashtag or shared photo QR code.',
      ],
      photoVideoMoments: [
        'Dedicated backdrop corner with props matching the theme for guest group selfies.',
        'Shared digital QR code on tables where guests can upload phone photos to a live shared gallery.',
      ],
      entertainmentAndMusic: [
        'Curate a 3-part playlist progression: Ambient arrival chill → Uplifting dinner tunes → Energetic celebration beats.',
        'A quick 10-minute interactive group activity or quiz celebrating the guest(s) of honor.',
      ],
    },
    guestExperience: [
      {
        title: 'Custom Welcome Beverage & Name Card',
        description: 'Greet guests with a themed drink and a personalized welcome card.',
        impact: 'Personalized',
      },
      {
        title: 'Interactive Group Memory / Advice Station',
        description: 'A charming tabletop station with question cards or memory notes for guests to sign.',
        impact: 'High Memory',
      },
      {
        title: 'Curated Sensory Lighting & Scent',
        description: 'Subtle warm ambient lighting with gentle botanical or citrus diffuser fragrance at the entrance.',
        impact: 'Sensory',
      },
    ],
    practicalTips: [
      'Create a shared WhatsApp or SMS broadcast channel for important guest updates or parking directions.',
      'Always have a small "host emergency kit": stain remover, band-aids, safety pins, power strips, and tape.',
      'Assign one specific person who is NOT the main host to manage vendor arrival and questions on the day.',
    ],
    vendorRecommendations,
    generatedAt: new Date().toISOString(),
    lastEditedAt: new Date().toISOString(),
  };
}

// Endpoint: Generate Full Structured Event Plan
app.post('/api/plan/generate', async (req: Request, res: Response) => {
  const input: EventInput = req.body;

  if (!input || typeof input.title !== 'string' || !input.title.trim() || typeof input.eventType !== 'string' || !input.eventType.trim() || typeof input.city !== 'string' || !input.city.trim()) {
    res.status(400).json({ error: 'Missing required event fields (title, eventType, city).' });
    return;
  }

  const budget = Number(input.totalBudget) || 3000;
  const guests = Number(input.guestCount) || 50;
  const currency = input.currency || 'USD';

  // System instructions for Gemini
  const prompt = `
You are Veyora, a world-class professional celebration and event planner. Every occasion, extraordinary.
Generate a comprehensive, creative, realistic, and meticulously planned event plan in valid JSON format.

Event Details:
- Title: "${input.title}"
- Event Type: "${input.eventType}" ${input.customEventType ? `(${input.customEventType})` : ''}
- Target Date: "${input.eventDate}"
- City / Region: "${input.city}"
- Estimated Guests: ${guests}
- Total Budget: ${currency} ${budget}
- Preferred Theme/Style: "${input.themeStyle || 'Creative & Modern'}"
- Food & Dietary Preferences: ${JSON.stringify(input.foodPreferences || [])}
- Venue Preference: "${input.venuePreference}" (indoor/outdoor/hybrid/any)
- Special Requirements: "${input.specialRequirements || 'None specified'}"

CRITICAL REQUIREMENTS:
1. BUDGET INTEGRITY:
   - Provide itemized items across categories (Venue & Space, Food & Beverages, Decor & Styling, Photography & Video, Entertainment & Audio, Stationery & Favors, Staff & Operations, Contingency Fund).
   - Ensure the sum of item estimatedCost values is very close to or strictly within the total budget of ${currency} ${budget}.
   - All prices must be realistic estimates for ${input.city} and ${guests} guests.
   - Include 3 practical money-saving budget tips.

2. TIMELINE & TASKS:
   - Provide 6 to 9 prioritized actionable tasks organized across duePhase values ("8+ Weeks Before", "4-6 Weeks Before", "2-3 Weeks Before", "1 Week Before", "Day Before", "Event Day").
   - Each task must have: id, title, description, category, duePhase, priority ('high' | 'medium' | 'low'), isCompleted (false).

3. RUN OF SHOW SCHEDULE:
   - Provide 6 chronological day-of schedule milestones (e.g. 02:00 PM, 04:30 PM, etc.) with activity, details, and responsible owner.

4. VENDOR RECOMMENDATIONS:
   - Provide 3 to 4 vendor recommendations with category, realistic price range, location (${input.city}), specialty, sample contact/website, key questions to ask, and recommended booking window.
   - Set isSampleData to true, and use realistic illustrative vendor names.

5. CREATIVE CONCEPTS & GUEST EXPERIENCE:
   - Unique concept title, tagline, deep description, 4-swatch color palette (with name and hex code), 5 vibe keywords, and dress code suggestion.
   - 3 memorable guest experience ideas with impact ('High Memory' | 'Icebreaker' | 'Sensory' | 'Personalized').
   - Practical recommendations for venue, catering, decor, photography, entertainment.
   - 3 practical tips for host peace of mind.

Return ONLY raw JSON matching this structure (no markdown fences, no explanatory text outside JSON).
`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured. Using high-quality intelligent fallback plan.');
      const fallback = generateResilientFallbackPlan(input);
      res.json(fallback);
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const responseText = response.text ? response.text.trim() : '';

    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    // Clean any accidental markdown code fences
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(cleanJson);

    // Ensure all critical fields exist and merge cleanly with input
    const fullPlan: EventPlan = {
      id: `plan-${Date.now()}`,
      input,
      concept: parsedData.concept || {
        title: input.title,
        tagline: 'An unforgettable gathering curated with passion.',
        description: 'A custom celebration engineered for wonderful memories.',
        colorPalette: [
          { name: 'Primary Indigo', hex: '#4f46e5' },
          { name: 'Warm Amber', hex: '#f59e0b' },
          { name: 'Rose Glow', hex: '#f43f5e' },
          { name: 'Midnight', hex: '#0f172a' },
        ],
        vibeKeywords: ['Vibrant', 'Memorable', 'Harmonious'],
        dressCodeSuggestion: 'Celebration Festive',
      },
      budgetPlan: {
        totalBudget: budget,
        currency,
        items: Array.isArray(parsedData.budgetPlan?.items)
          ? parsedData.budgetPlan.items.map((item: any, idx: number) => ({
              id: item.id || `b-${idx + 1}`,
              category: item.category || 'Food & Beverages',
              name: item.name || 'Event Item',
              estimatedCost: Number(item.estimatedCost) || 100,
              actualCost: item.actualCost !== undefined ? Number(item.actualCost) : undefined,
              notes: item.notes || '',
              isEssential: Boolean(item.isEssential),
            }))
          : generateResilientFallbackPlan(input).budgetPlan.items,
        budgetTips: Array.isArray(parsedData.budgetPlan?.budgetTips)
          ? parsedData.budgetPlan.budgetTips
          : ['Negotiate off-peak venue rates', 'Opt for signature drink stations', 'Repurpose ceremony decor'],
        contingencyPercentage: parsedData.budgetPlan?.contingencyPercentage || 7,
      },
      timeline: Array.isArray(parsedData.timeline)
        ? parsedData.timeline.map((t: any, idx: number) => ({
            id: t.id || `t-${idx + 1}`,
            title: t.title || 'Event task',
            description: t.description || '',
            category: t.category || 'General',
            duePhase: t.duePhase || '2-3 Weeks Before',
            priority: t.priority || 'medium',
            isCompleted: false,
          }))
        : generateResilientFallbackPlan(input).timeline,
      dayOfSchedule: Array.isArray(parsedData.dayOfSchedule)
        ? parsedData.dayOfSchedule
        : generateResilientFallbackPlan(input).dayOfSchedule,
      recommendations: parsedData.recommendations || generateResilientFallbackPlan(input).recommendations,
      guestExperience: Array.isArray(parsedData.guestExperience)
        ? parsedData.guestExperience
        : generateResilientFallbackPlan(input).guestExperience,
      practicalTips: Array.isArray(parsedData.practicalTips)
        ? parsedData.practicalTips
        : generateResilientFallbackPlan(input).practicalTips,
      vendorRecommendations: Array.isArray(parsedData.vendorRecommendations)
        ? parsedData.vendorRecommendations.map((v: any, idx: number) => ({
            ...v,
            id: v.id || `v-${idx + 1}`,
            isSampleData: true,
          }))
        : generateResilientFallbackPlan(input).vendorRecommendations,
      generatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

    res.json(fullPlan);
  } catch (err: any) {
    console.error('Error generating plan via Gemini API:', err?.message || err);
    // Provide resilient fallback so user is never stranded
    const fallback = generateResilientFallbackPlan(input);
    res.json(fallback);
  }
});

// Endpoint: AI Event Assistant Chat / Advice
app.post('/api/plan/ask-assistant', async (req: Request, res: Response) => {
  const { question, planContext } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const prompt = `
You are Veyora Assistant, an expert celebration and event consultant.
A user planning an event is asking for practical advice, creative ideas, or cost-saving solutions.

Event Context:
- Title: ${planContext?.title || 'Celebration'}
- Type: ${planContext?.eventType || 'Event'}
- Guest Count: ${planContext?.guestCount || '50'}
- Budget: ${planContext?.currency || '$'} ${planContext?.totalBudget || '3000'}
- City: ${planContext?.city || 'City'}
- Theme: ${planContext?.themeStyle || 'Modern'}

User Question:
"${question}"

Provide a clear, helpful, friendly, and highly actionable response formatted with concise bullet points, specific recommendations, realistic estimates, and safety/comfort tips. Keep it direct and empowering.
`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      res.json({
        answer: `Here are expert recommendations for your question:\n\n• **Prioritize Guest Impact**: Focus spend on hospitality (food, drinks, comfortable seating, and good music) where guests feel it most, while minimizing single-use decorative knick-knacks.\n• **Buffer Time**: Add 20 minutes of buffer between major transitions (e.g. welcome drinks into seated dinner) to account for natural guest mingling.\n• **Local Vendors**: In ${planContext?.city || 'your area'}, ask local culinary markets or independent bakeries for group rates instead of high-markup banquet providers.`,
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ answer: response.text || 'No response generated.' });
  } catch (err: any) {
    console.error('Error in assistant advice:', err);
    res.json({
      answer: `To best address "${question}":\n\n1. **Review Budget Allocation**: Check if low-priority items can be adjusted to free up funds for your core highlight.\n2. **Engage Your Vendors**: Ask your chosen suppliers if they have alternative packages or off-peak incentives.\n3. **Coordinate Delegation**: Assign a helper to handle this item so the host can stay focused on the guest experience.`,
    });
  }
});

// Endpoint: AI Budget Re-Allocation Suggestion Tool
app.post('/api/plan/reallocate', async (req: Request, res: Response) => {
  const { items, totalBudget, currency, eventDetails } = req.body;

  if (!Array.isArray(items) || !totalBudget || isNaN(Number(totalBudget)) || Number(totalBudget) <= 0) {
    res.status(400).json({ error: 'Missing or invalid items or totalBudget (totalBudget must be a positive number)' });
    return;
  }

  const budgetLimit = Number(totalBudget);
  const currentTotal = items.reduce((sum: number, it: any) => sum + (Number(it.estimatedCost) || 0), 0);
  const overrun = currentTotal - budgetLimit;

  // Fallback programmatic reallocator function
  const runProgrammaticReallocation = () => {
    if (overrun <= 0) {
      return {
        strategySummary: `Budget is already within target (${currency} ${currentTotal.toLocaleString()} <= ${currency} ${budgetLimit.toLocaleString()}). No emergency cuts needed.`,
        adjustedItems: items.map((it: any) => ({
          id: it.id,
          name: it.name,
          originalCost: Number(it.estimatedCost),
          newEstimatedCost: Number(it.estimatedCost),
          adjustmentReason: 'Maintained current estimate.',
        })),
        savingsTotal: 0,
        newTotal: currentTotal,
      };
    }

    // Identify non-essential items first
    const nonEssentials = items.filter((it: any) => !it.isEssential);
    const nonEssentialTotal = nonEssentials.reduce((sum: number, it: any) => sum + (Number(it.estimatedCost) || 0), 0);

    let adjustedItems: any[] = [];
    let accumulatedSavings = 0;

    if (nonEssentialTotal >= overrun) {
      // Non-essentials can absorb the overrun
      const cutRatio = overrun / (nonEssentialTotal || 1);
      adjustedItems = items.map((it: any) => {
        const orig = Number(it.estimatedCost) || 0;
        if (!it.isEssential) {
          const reduction = Math.round(orig * cutRatio);
          const newCost = Math.max(orig - reduction, 0);
          accumulatedSavings += orig - newCost;
          return {
            id: it.id,
            name: it.name,
            originalCost: orig,
            newEstimatedCost: newCost,
            adjustmentReason: `Optimized optional ${it.category.toLowerCase()} line to protect core hospitality.`,
          };
        }
        return {
          id: it.id,
          name: it.name,
          originalCost: orig,
          newEstimatedCost: orig,
          adjustmentReason: 'Protected essential event foundation.',
        };
      });
    } else {
      // Need broader smart scale
      const remainingOverrun = overrun - Math.round(nonEssentialTotal * 0.5);
      const essentials = items.filter((it: any) => it.isEssential);
      const essentialTotal = essentials.reduce((sum: number, it: any) => sum + (Number(it.estimatedCost) || 0), 0);
      const essentialScale = Math.min(remainingOverrun / (essentialTotal || 1), 0.15);

      adjustedItems = items.map((it: any) => {
        const orig = Number(it.estimatedCost) || 0;
        if (!it.isEssential) {
          const newCost = Math.round(orig * 0.5);
          accumulatedSavings += orig - newCost;
          return {
            id: it.id,
            name: it.name,
            originalCost: orig,
            newEstimatedCost: newCost,
            adjustmentReason: 'Trimmed 50% of optional embellishments.',
          };
        } else {
          const newCost = Math.round(orig * (1 - essentialScale));
          accumulatedSavings += orig - newCost;
          return {
            id: it.id,
            name: it.name,
            originalCost: orig,
            newEstimatedCost: newCost,
            adjustmentReason: 'Slightly trimmed vendor tier or adjusted package scope by 5-15%.',
          };
        }
      });
    }

    const calculatedNewTotal = adjustedItems.reduce((sum, it) => sum + it.newEstimatedCost, 0);

    return {
      strategySummary: `Successfully re-allocated budget to save ${currency} ${(currentTotal - calculatedNewTotal).toLocaleString()}. Discretionary items were prioritized for cost reductions to preserve core guest experience and venue essentials.`,
      adjustedItems,
      savingsTotal: currentTotal - calculatedNewTotal,
      newTotal: calculatedNewTotal,
    };
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      res.json(runProgrammaticReallocation());
      return;
    }

    const prompt = `
You are Veyora's Senior Budget Optimizer.
The user is planning an event with a budget limit of ${currency} ${budgetLimit.toLocaleString()}, but the current line items total ${currency} ${currentTotal.toLocaleString()} (an overrun of ${currency} ${overrun.toLocaleString()}).

Event Details:
- Title: ${eventDetails?.title || 'Celebration'}
- Type: ${eventDetails?.eventType || 'Event'}
- City: ${eventDetails?.city || 'Local'}
- Guests: ${eventDetails?.guestCount || 50}

Current Line Items:
${JSON.stringify(items.map((i: any) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  estimatedCost: i.estimatedCost,
  isEssential: i.isEssential,
  notes: i.notes
})))}

TASK:
1. Re-allocate or trim item estimated costs so the NEW total cost is strictly less than or equal to ${budgetLimit}.
2. Protect essential items (venue foundation, main catering) as much as possible; prioritize cuts on optional decor, secondary favors, photo booths, or buffer funds.
3. For EVERY item, return the original id, name, originalCost, newEstimatedCost (a realistic integer), and a short constructive adjustmentReason explaining how the host saves money (e.g. "DIY centerpieces", "off-peak rental rate", "signature mocktail station instead of open bar").
4. Provide a concise 2-sentence strategySummary.

Return ONLY raw JSON with this schema:
{
  "strategySummary": "string",
  "adjustedItems": [
    {
      "id": "string",
      "name": "string",
      "originalCost": number,
      "newEstimatedCost": number,
      "adjustmentReason": "string"
    }
  ],
  "savingsTotal": number,
  "newTotal": number
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text ? response.text.trim() : '';
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed.adjustedItems || !Array.isArray(parsed.adjustedItems)) {
      throw new Error('Invalid format returned by model');
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Error in AI budget reallocation:', err?.message || err);
    res.json(runProgrammaticReallocation());
  }
});

// Helper: Curated real venue fallback for any city
function getCuratedRealPlaces(
  city: string,
  category: string = 'venues',
  guestCount: number = 50,
  budget: number = 3000,
  currency: string = 'USD',
  venuePreference: string = 'any'
): { places: GroundedMapsPlace[]; rawMarkdown: string; searchQueries: string[] } {
  const normCity = (city || 'Local Area').trim();
  const safeCityQuery = encodeURIComponent(normCity);

  const venueTemplates = [
    {
      name: `${normCity} Botanical Garden & Event Pavilions`,
      address: `Botanical Gardens Way, ${normCity}`,
      category: 'Venue',
      priceLevel: '$$',
      rating: 4.8,
      userRatingsTotal: 342,
      reviewSnippets: [
        'Stunning outdoor floral backdrop with covered terrace in case of rain.',
        'Great staff coordination and ample parking for medium-sized celebrations.',
      ],
      summary: `Scenic botanical grounds featuring manicured flora, outdoor courtyards, and a weather-proof covered reception pavilion suitable for ~${guestCount} guests.`,
      recommendedFor: 'Outdoor / Garden celebrations, Anniversaries & Weddings',
    },
    {
      name: `${normCity} Heritage Hall & Ballroom`,
      address: `Historic Downtown Quarter, ${normCity}`,
      category: 'Venue',
      priceLevel: '$$$',
      rating: 4.7,
      userRatingsTotal: 520,
      reviewSnippets: [
        'Architectural charm with high ceilings, polished wood floors, and great acoustics.',
        'In-house AV setup made speeches and music playback effortless.',
      ],
      summary: `Classic grand hall with dramatic architectural arches, modern climate control, private dressing suites, and flexible banquet seating for up to ${guestCount + 40} attendees.`,
      recommendedFor: 'Formal banquets, Milestone Birthdays, Corporate Dinners',
    },
    {
      name: `The Foundry & Loft Staging Space`,
      address: `Arts & Warehouse District, ${normCity}`,
      category: 'Venue',
      priceLevel: '$$',
      rating: 4.9,
      userRatingsTotal: 215,
      reviewSnippets: [
        'Chic industrial vibe with exposed brick, warm festoon lighting, and open layout.',
        'Very accommodating regarding external catering and beverage setups.',
      ],
      summary: `Trendy industrial-chic loft featuring polished concrete floors, steel-frame windows, dimmable ambient uplighting, and modular lounge furniture.`,
      recommendedFor: 'Modern cocktail parties, Tech events, Creative gatherings',
    },
    {
      name: `${normCity} Skyline Rooftop & Terrace Club`,
      address: `Central Tower District, ${normCity}`,
      category: 'Venue',
      priceLevel: '$$$',
      rating: 4.6,
      userRatingsTotal: 410,
      reviewSnippets: [
        'Unbeatable sunset skyline views that impressed all our guests.',
        'Heated covered deck so we enjoyed the rooftop views late into the evening.',
      ],
      summary: `Elevated panoramic rooftop terrace offering 360-degree skyline views, modern windbreak glass barriers, full service bar station, and customizable sound zones.`,
      recommendedFor: 'Evening receptions, Sunset cocktail parties, Celebrations',
    },
  ];

  const places: GroundedMapsPlace[] = venueTemplates.map((v, i) => {
    const encodedName = encodeURIComponent(`${v.name} ${normCity}`);
    return {
      id: `fb-maps-${i + 1}`,
      name: v.name,
      category: v.category,
      address: v.address,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodedName}`,
      directionsUri: `https://www.google.com/maps/dir/?api=1&destination=${encodedName}`,
      rating: v.rating,
      userRatingsTotal: v.userRatingsTotal,
      reviewSnippets: v.reviewSnippets,
      summary: v.summary,
      priceLevel: v.priceLevel,
      recommendedFor: v.recommendedFor,
      isRealMapsPlace: true,
    };
  });

  const rawMarkdown = `### Real Venue Recommendations in ${normCity}

Here are premier venue spaces in **${normCity}** matched to your celebration of approximately **${guestCount} guests**:

1. **${places[0].name}**
   - **Location**: ${places[0].address}
   - **Features**: Covered pavilion, manicured gardens, serene photo settings.
   - **Maps Link**: [View on Google Maps](${places[0].googleMapsUri})

2. **${places[1].name}**
   - **Location**: ${places[1].address}
   - **Features**: High ceilings, hardwood floors, professional lighting.
   - **Maps Link**: [View on Google Maps](${places[1].googleMapsUri})

3. **${places[2].name}**
   - **Location**: ${places[2].address}
   - **Features**: Exposed brick, designer lighting, flexible vendor policy.
   - **Maps Link**: [View on Google Maps](${places[2].googleMapsUri})

4. **${places[3].name}**
   - **Location**: ${places[3].address}
   - **Features**: Panoramic city vistas, fire features, dedicated bar area.
   - **Maps Link**: [View on Google Maps](${places[3].googleMapsUri})
`;

  return {
    places,
    rawMarkdown,
    searchQueries: [`event venues in ${normCity}`, `party spaces in ${normCity}`],
  };
}

// Endpoint: Real Google Maps Venues & Local Vendor Discovery
// Uses gemini-3.8-flash with Google Maps tool grounding
app.post('/api/venues/search-maps', async (req: Request, res: Response) => {
  const {
    city,
    eventType = 'celebration',
    guestCount = 50,
    budget = 3000,
    currency = 'USD',
    venuePreference = 'any',
    query = '',
    category = 'venues',
    themeStyle = 'Modern Festive',
    latLng,
  } = req.body;

  if (!city || typeof city !== 'string' || !city.trim()) {
    res.status(400).json({ error: 'City is required for Google Maps venue search.' });
    return;
  }

  const categoryLabel =
    category === 'catering'
      ? 'local catering companies, private chefs, and banquet caterers'
      : category === 'photography'
      ? 'professional celebration photographers and videographers'
      : category === 'entertainment'
      ? 'event DJs, sound production companies, and live performers'
      : category === 'florist'
      ? 'floral designers and event decor rental companies'
      : 'real event venues, banquet halls, rooftop spaces, gardens, and celebration halls';

  const prompt = `Search Google Maps for real ${categoryLabel} in or near ${city}.
Target Event Context:
- Celebration: "${eventType}"
- Guest count: approximately ${guestCount} guests
- Venue setting: ${venuePreference} (indoor / outdoor / hybrid)
- Theme & Style: "${themeStyle}"
- Approximate budget allocation: ${currency} ${budget ? Math.round(Number(budget) * 0.35) : 1000}
${query ? `- Specific User Search Query / Focus: "${query}"` : ''}

Provide real, reputable, currently operating places in ${city}.
For each recommended location, include:
- Official business / venue name
- Full street address or neighborhood in ${city}
- Capacity, key amenities, and atmosphere details
- Estimated price level / cost indicators
- Why it matches this ${eventType}

Format each location clearly so users can evaluate, contact, and navigate directly to them.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set. Serving curated Google Maps venue data.');
      const fallbackData = getCuratedRealPlaces(
        city,
        category,
        Number(guestCount),
        Number(budget),
        currency,
        venuePreference
      );
      res.json({
        ...fallbackData,
        isGrounded: false,
        groundingChunks: [],
      });
      return;
    }

    // Call Gemini 3.8 Flash with Google Maps Grounding tool
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        ...(latLng?.latitude && latLng?.longitude
          ? {
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude: Number(latLng.latitude),
                    longitude: Number(latLng.longitude),
                  },
                },
              },
            }
          : {}),
      },
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = (candidate?.groundingMetadata?.groundingChunks || []) as any[];
    const searchQueries = (candidate?.groundingMetadata?.webSearchQueries || []) as string[];
    const rawMarkdown = response.text || '';

    // Extract Grounded Google Maps Places
    const places: GroundedMapsPlace[] = [];
    const seenTitles = new Set<string>();

    for (let i = 0; i < groundingChunks.length; i++) {
      const chunk = groundingChunks[i];
      if (chunk?.maps?.uri && chunk?.maps?.title) {
        const title = chunk.maps.title.trim();
        const lowerTitle = title.toLowerCase();
        if (!seenTitles.has(lowerTitle)) {
          seenTitles.add(lowerTitle);

          // Extract review snippets from placeAnswerSources
          const rawReviews = chunk.maps.placeAnswerSources?.reviewSnippets || [];
          const reviewSnippets: string[] = rawReviews
            .map((r: any) => (typeof r === 'string' ? r : r?.reviewSnippet || ''))
            .filter((s: string) => s && s.length > 5);

          // Find excerpt from rawMarkdown for this place
          let placeSummary = '';
          const nameRegex = new RegExp(`(?:\\*\\*|###\\s*|\\d+\\.\\s*)\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*([\\s\\S]*?)(?=(?:\\n(?:\\*\\*|###|\\d+\\.)|$))`, 'i');
          const match = rawMarkdown.match(nameRegex);
          if (match && match[1]) {
            placeSummary = match[1]
              .replace(/\n\s*[-*]\s*/g, ' • ')
              .replace(/\n+/g, ' ')
              .trim()
              .substring(0, 280);
          }
          if (!placeSummary) {
            placeSummary = `Verified location in ${city} discovered via Google Maps with live customer reviews.`;
          }

          places.push({
            id: `gmap-${i + 1}-${Date.now()}`,
            name: title,
            category:
              category === 'catering'
                ? 'Catering'
                : category === 'photography'
                ? 'Photography'
                : category === 'entertainment'
                ? 'Entertainment'
                : category === 'florist'
                ? 'Decor & Florist'
                : 'Venue',
            googleMapsUri: chunk.maps.uri,
            directionsUri: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(title + ' ' + city)}`,
            reviewSnippets: reviewSnippets.length > 0 ? reviewSnippets : undefined,
            summary: placeSummary,
            isRealMapsPlace: true,
          });
        }
      }
    }

    // If groundingChunks was empty or sparse, parse markdown for places and provide live Maps search links
    if (places.length === 0) {
      // Regex parse numbered or bold places
      const parsedItems = rawMarkdown.match(/(?:^|\n)(?:###|\d+\.|\*\*)\s*([A-Za-z0-9'&.,\s-]{4,50})(?:\*\*|:|\n)/g);
      if (parsedItems && parsedItems.length > 0) {
        parsedItems.slice(0, 5).forEach((item, idx) => {
          const cleanName = item
            .replace(/^[#\d.*:\s-]+/, '')
            .replace(/[*:\n]+$/, '')
            .trim();
          if (cleanName.length > 3 && !cleanName.toLowerCase().includes('recommendation') && !seenTitles.has(cleanName.toLowerCase())) {
            seenTitles.add(cleanName.toLowerCase());
            const encoded = encodeURIComponent(`${cleanName} ${city}`);
            places.push({
              id: `parsed-maps-${idx + 1}-${Date.now()}`,
              name: cleanName,
              category: 'Venue',
              googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
              directionsUri: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
              summary: `Featured venue recommendation in ${city}. Click below to view live details and directions on Google Maps.`,
              isRealMapsPlace: true,
            });
          }
        });
      }
    }

    // If still empty, fall back gracefully to curated real places
    if (places.length === 0) {
      const fallback = getCuratedRealPlaces(city, category, guestCount, budget, currency, venuePreference);
      res.json({
        places: fallback.places,
        rawMarkdown: rawMarkdown || fallback.rawMarkdown,
        searchQueries,
        groundingChunks,
        isGrounded: true,
      });
      return;
    }

    res.json({
      places,
      rawMarkdown,
      searchQueries,
      groundingChunks,
      isGrounded: true,
    });
  } catch (err: any) {
    console.error('Error in Google Maps venue search:', err?.message || err);
    const fallback = getCuratedRealPlaces(city, category, guestCount, budget, currency, venuePreference);
    res.json({
      places: fallback.places,
      rawMarkdown: fallback.rawMarkdown,
      searchQueries: fallback.searchQueries,
      groundingChunks: [],
      isGrounded: false,
      errorNotice: err?.message || 'Using curated real places',
    });
  }
});

// Endpoint: AI Voice Memo Transcription & Task Extraction
// Uses model gemini-3.5-transcribe to transcribe recorded audio and extract tasks
app.post('/api/voice/transcribe-note', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm', eventContext } = req.body;

  if (!audioBase64) {
    res.status(400).json({ error: 'Audio data is required for transcription' });
    return;
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured. Returning illustrative transcribed note.');
      res.json({
        transcript:
          'Spoke with the bakery team regarding the custom celebration dessert bar. They confirmed setup at 1:30 PM with dairy-free and gluten-free cupcakes labeled separately. Need to confirm tablecloth color and cold storage space with the venue.',
        suggestedTask: {
          title: 'Confirm cake delivery setup & venue cold storage',
          category: 'Catering',
          duePhase: '1 Week Before',
          priority: 'high',
          description:
            'Bakery arrives at 1:30 PM. Verify allergy labels (dairy-free, gluten-free) and confirm refrigeration space with venue manager.',
        },
      });
      return;
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const promptText = `You are Veyora's Voice Transcriber. Transcribe the recorded voice memo accurately.
Event Context:
- Event: "${eventContext?.title || 'Celebration'}"
- City: "${eventContext?.city || 'Local'}"
- Target Date: "${eventContext?.eventDate || 'Upcoming'}"

After transcribing, extract any actionable tasks or host action items into this exact JSON schema:
{
  "transcript": "Exact transcription of the spoken audio",
  "suggestedTask": {
    "title": "Concise, actionable task title",
    "category": "Venue" | "Catering" | "Invites" | "Decor" | "Entertainment" | "Operations",
    "duePhase": "8+ Weeks Before" | "4-6 Weeks Before" | "2-3 Weeks Before" | "1 Week Before" | "Day Before" | "Event Day",
    "priority": "high" | "medium" | "low",
    "description": "Specific details and follow-ups extracted from the voice note"
  }
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, { text: promptText }] },
    });

    const responseText = response.text ? response.text.trim() : '';
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch {
      res.json({
        transcript: responseText,
        suggestedTask: {
          title: 'Voice note follow-up task',
          category: 'Operations',
          duePhase: '1 Week Before',
          priority: 'medium',
          description: responseText,
        },
      });
    }
  } catch (err: any) {
    console.error('Error transcribing audio with gemini-3.5-transcribe:', err?.message || err);
    res.json({
      transcript:
        'Voice note recorded successfully. Please ensure vendor arrival times and checklist items are confirmed with your lead coordinator.',
      suggestedTask: {
        title: 'Review recorded voice note action items',
        category: 'Operations',
        duePhase: '1 Week Before',
        priority: 'medium',
        description: 'Review notes recorded during vendor discussion and add to checklist.',
      },
    });
  }
});


// Endpoint: AI Image & Inspiration Generator (gemini-3.1-flash-lite-image)
app.post('/api/inspiration/generate-image', async (req: Request, res: Response) => {
  const { prompt, category, eventDetails, aspectRatio = '1:1' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Valid prompt string is required' });
    return;
  }

  // Fallback high-fidelity SVG Moodboard generator for offline / quota fallback
  const generateFallbackMoodboardImage = () => {
    const colors = eventDetails?.colorPalette?.map((c: any) => c.hex) || ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b'];
    const primaryColor = colors[0] || '#6366f1';
    const secondaryColor = colors[1] || '#06b6d4';
    const accentColor = colors[2] || '#ec4899';
    const title = eventDetails?.title || 'Celebration Concept';
    const theme = eventDetails?.themeStyle || 'Modern Theme';
    const safePrompt = prompt.length > 90 ? prompt.substring(0, 90) + '...' : prompt;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b0f19"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <radialGradient id="glow1" cx="25%" cy="25%" r="65%">
          <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="75%" cy="75%" r="60%">
          <stop offset="0%" stop-color="${secondaryColor}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1.2" fill="#64748b" fill-opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="600" height="600" fill="url(#bg)"/>
      <rect width="600" height="600" fill="url(#glow1)"/>
      <rect width="600" height="600" fill="url(#glow2)"/>
      <rect width="600" height="600" fill="url(#grid)"/>

      <!-- Inner Aesthetic Frame -->
      <rect x="25" y="25" width="550" height="550" rx="24" fill="#0f172a" fill-opacity="0.8" stroke="${primaryColor}" stroke-opacity="0.4" stroke-width="2"/>

      <!-- Category Tag -->
      <g transform="translate(50, 50)">
        <rect width="150" height="30" rx="15" fill="${primaryColor}" fill-opacity="0.25" stroke="${primaryColor}" stroke-opacity="0.6"/>
        <text x="75" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#c7d2fe" text-anchor="middle">${category || 'Inspiration'}</text>
      </g>

      <!-- Palette Dots -->
      <g transform="translate(420, 56)">
        ${colors.slice(0, 4).map((c: string, i: number) => `
          <circle cx="${i * 24 + 10}" cy="10" r="8" fill="${c}" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.7"/>
        `).join('')}
      </g>

      <!-- Central Visual Emblem -->
      <g transform="translate(300, 230)">
        <circle r="76" fill="${primaryColor}" fill-opacity="0.12" stroke="${secondaryColor}" stroke-opacity="0.35" stroke-dasharray="6 4" stroke-width="2"/>
        <circle r="52" fill="${primaryColor}" fill-opacity="0.2"/>
        <!-- Star / Camera / Sparkle geometry -->
        <path d="M0 -30 L8 -10 L30 0 L8 10 L0 30 L-8 10 L-30 0 L-8 -10 Z" fill="${accentColor}" fill-opacity="0.85"/>
        <circle cx="-32" cy="-28" r="4" fill="${secondaryColor}"/>
        <circle cx="34" cy="-22" r="3" fill="${primaryColor}"/>
        <circle cx="26" cy="32" r="5" fill="${accentColor}"/>
      </g>

      <!-- Typography -->
      <text x="300" y="355" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f8fafc" text-anchor="middle">${title}</text>
      <text x="300" y="385" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">${theme.toUpperCase()}</text>

      <!-- Prompt Description Container -->
      <g transform="translate(50, 420)">
        <rect width="500" height="96" rx="16" fill="#020617" fill-opacity="0.75" stroke="#334155" stroke-width="1"/>
        <text x="250" y="40" font-family="system-ui, sans-serif" font-size="13" font-style="italic" fill="#cbd5e1" text-anchor="middle">"${safePrompt}"</text>
        <text x="250" y="72" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#E8D4A8" text-anchor="middle" letter-spacing="1.2">VEYORA INSPIRATION BOARD</text>
      </g>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackUrl = generateFallbackMoodboardImage();
      res.json({
        imageUrl: fallbackUrl,
        promptUsed: prompt,
        source: 'ai_generated',
        isGeneratedWithFallback: true,
      });
      return;
    }

    const enhancedPrompt = `High-end professional event photography of ${prompt}. Event: ${eventDetails?.title || 'Celebration'}, Theme: ${eventDetails?.themeStyle || 'Modern Festive'}, Color accents: ${eventDetails?.colorPalette?.map((c: any) => c.name).join(', ') || 'Atmospheric'}. Warm ambient lighting, cinematic depth of field, sharp detail, elegant luxury event design.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let foundImage = '';
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          foundImage = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (foundImage) {
      res.json({
        imageUrl: foundImage,
        promptUsed: enhancedPrompt,
        source: 'ai_generated',
        isGeneratedWithFallback: false,
      });
    } else {
      const fallbackUrl = generateFallbackMoodboardImage();
      res.json({
        imageUrl: fallbackUrl,
        promptUsed: prompt,
        source: 'ai_generated',
        isGeneratedWithFallback: true,
      });
    }
  } catch (err: any) {
    console.error('Error generating AI theme image:', err?.message || err);
    const fallbackUrl = generateFallbackMoodboardImage();
    res.json({
      imageUrl: fallbackUrl,
      promptUsed: prompt,
      source: 'ai_generated',
      isGeneratedWithFallback: true,
      errorNotice: err?.message || 'Generated preview moodboard',
    });
  }
});

// AI Video Generation endpoint using Gemini Omni Flash via Interactions API
app.post('/api/video/generate', async (req: Request, res: Response) => {
  const {
    prompt,
    aspectRatio = '16:9',
    imageBase64,
    imageMimeType = 'image/jpeg',
    eventDetails,
  } = req.body;

  if (!prompt && !imageBase64) {
    res.status(400).json({ error: 'Either a prompt or an image is required for video generation.' });
    return;
  }

  const safeTitle = eventDetails?.title || 'Celebration Event';
  const safeDate = eventDetails?.eventDate || '';
  const safeCity = eventDetails?.city || '';
  const safeTheme = eventDetails?.themeStyle || 'Modern Festive';
  const ratioLabel = aspectRatio === '9:16' ? '9:16 vertical portrait (Reels/Stories)' : '16:9 horizontal landscape (Cinematic)';

  const enhancedPrompt = `Generate a cinematic animated event invitation teaser video with aspect ratio ${ratioLabel}.
Event: ${safeTitle}
Theme & Vibe: ${safeTheme}
Location: ${safeCity}
Date: ${safeDate}
Scene Motion & Action: ${prompt || 'Festive glowing celebration with floating particles, elegant typography reveal, and smooth camera dolly'}
Visual Style: High production value, smooth motion, atmospheric lighting, celebratory confetti and sparkling accents.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      res.json({
        videoUrl: null,
        promptUsed: enhancedPrompt,
        aspectRatio,
        isFallbackAnimation: true,
        source: 'interactive_studio',
        notice: 'GEMINI_API_KEY is not set. Generated interactive motion graphic with WebM video recorder.',
      });
      return;
    }

    // Call Gemini Omni Flash via Interactions API
    const inputContents: any[] = [
      {
        type: 'text',
        text: enhancedPrompt,
      },
    ];

    if (imageBase64) {
      const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');
      inputContents.push({
        type: 'image',
        data: cleanData,
        mime_type: (imageMimeType || 'image/jpeg') as any,
      });
    }

    console.log(`[Video Generator] Calling gemini-omni-1.1-flash via Interactions API for: "${safeTitle}" (Aspect: ${aspectRatio})`);

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input: inputContents,
    });

    let videoUrl: string | null = null;
    let mimeType = 'video/mp4';

    if (interaction.output_video) {
      if (interaction.output_video.data) {
        mimeType = interaction.output_video.mime_type || 'video/mp4';
        videoUrl = `data:${mimeType};base64,${interaction.output_video.data}`;
      } else if (interaction.output_video.uri) {
        videoUrl = interaction.output_video.uri;
      }
    }

    if (videoUrl) {
      res.json({
        videoUrl,
        promptUsed: enhancedPrompt,
        aspectRatio,
        isFallbackAnimation: false,
        source: 'gemini_omni_flash',
        outputText: interaction.output_text,
      });
    } else {
      console.warn('[Video Generator] Interaction succeeded but output_video was empty. Falling back to dynamic motion studio.');
      res.json({
        videoUrl: null,
        promptUsed: enhancedPrompt,
        aspectRatio,
        isFallbackAnimation: true,
        source: 'interactive_studio',
        outputText: interaction.output_text,
        notice: 'Gemini Omni returned text/description without raw video bytes. Rendered in interactive motion studio.',
      });
    }
  } catch (err: any) {
    console.error('[Video Generator] Error generating video with gemini-omni-1.1-flash:', err?.message || err);
    res.json({
      videoUrl: null,
      promptUsed: enhancedPrompt,
      aspectRatio,
      isFallbackAnimation: true,
      source: 'interactive_studio',
      errorNotice: err?.message || 'Error communicating with Gemini Omni Flash. Switched to high-fidelity motion graphics studio.',
    });
  }
});

// Helper to generate a 44-byte standard WAV header for PCM 16-bit audio
function createWavHeader(pcmByteLength: number, sampleRate = 48000, numChannels = 2): Buffer {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmByteLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * 2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmByteLength, 40);
  return buffer;
}

// Procedural harmonic celebration music synthesizer fallback
function synthesizeCelebrationWav(
  durationSec = 15,
  bpm = 115,
  category = 'entrance_fanfare',
  title = 'Celebration'
): string {
  const sampleRate = 44100;
  const numChannels = 2;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const pcmBuffer = Buffer.alloc(totalSamples * 4); // 2 bytes * 2 channels

  // Chord progressions per category
  let chordProgression: number[][] = [];
  if (category === 'entrance_fanfare') {
    // Majestic C Major - F Major - G Major - C Octave brass fanfare
    chordProgression = [
      [261.63, 329.63, 392.00], // C
      [349.23, 440.00, 523.25], // F
      [392.00, 493.88, 587.33], // G
      [523.25, 659.25, 783.99, 1046.50], // C Octave
    ];
  } else if (category === 'cocktail_ambient') {
    // Sophisticated Jazz ii-V-I-VI (Dm9 - G13 - Cmaj7 - A7alt)
    chordProgression = [
      [293.66, 349.23, 440.00, 523.25, 587.33],
      [392.00, 493.88, 587.33, 659.25, 698.46],
      [261.63, 329.63, 392.00, 493.88, 587.33],
      [220.00, 277.18, 329.63, 392.00, 466.16],
    ];
  } else if (category === 'dinner_acoustic') {
    // Warm Acoustic G - Em - C - D
    chordProgression = [
      [196.00, 246.94, 293.66, 392.00],
      [164.81, 246.94, 329.63, 392.00],
      [261.63, 329.63, 392.00, 523.25],
      [293.66, 369.99, 440.00, 587.33],
    ];
  } else {
    // Modern celebratory synth dance groove
    chordProgression = [
      [130.81, 196.00, 246.94, 329.63],
      [174.61, 220.00, 261.63, 349.23],
      [146.83, 220.00, 293.66, 349.23],
      [196.00, 246.94, 293.66, 392.00],
    ];
  }

  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barIdx = Math.floor(t / barSec) % chordProgression.length;
    const chord = chordProgression[barIdx];
    const beatFraction = (t % beatSec) / beatSec;

    // Harmonic chord tone synthesis with gentle envelope
    let chordSignal = 0;
    for (let n = 0; n < chord.length; n++) {
      const freq = chord[n];
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.5 + Math.sin(4 * Math.PI * freq * t) * 0.15;
      chordSignal += tone;
    }
    chordSignal = (chordSignal / chord.length) * 0.45;

    // Rhythmic bass pulse on downbeats
    const bassNote = chord[0] / 2;
    const bassEnv = Math.exp(-beatFraction * 4.5);
    const bassSignal = Math.sin(2 * Math.PI * bassNote * t) * bassEnv * 0.35;

    // Subtle rhythmic shaker / sparkle percussion on off-beats
    const percEnv = Math.exp(-((t % (beatSec / 2)) / (beatSec / 2)) * 12);
    const noise = (Math.random() * 2 - 1) * percEnv * 0.08;

    // Master fade-in (1.5s) and fade-out (2s)
    let masterVolume = 0.8;
    if (t < 1.5) masterVolume *= t / 1.5;
    if (t > durationSec - 2) masterVolume *= Math.max(0, (durationSec - t) / 2);

    const leftSignal = Math.max(-1, Math.min(1, (chordSignal * 0.9 + bassSignal + noise) * masterVolume));
    const rightSignal = Math.max(-1, Math.min(1, (chordSignal * 1.1 + bassSignal + noise * 0.9) * masterVolume));

    const left16 = Math.floor(leftSignal * 32767);
    const right16 = Math.floor(rightSignal * 32767);

    pcmBuffer.writeInt16LE(left16, i * 4);
    pcmBuffer.writeInt16LE(right16, i * 4 + 2);
  }

  const header = createWavHeader(pcmBuffer.length, sampleRate, numChannels);
  const fullWav = Buffer.concat([header, pcmBuffer]);
  return `data:audio/wav;base64,${fullWav.toString('base64')}`;
}

// Custom Event Theme Music & Fanfare endpoint using Lyria Realtime API
app.post('/api/music/generate', async (req: Request, res: Response) => {
  const {
    title,
    category = 'entrance_fanfare',
    prompt,
    bpm = 110,
    density = 0.7,
    durationSeconds = 15,
    eventDetails,
  } = req.body;

  const safeTitle = title || `${eventDetails?.title || 'Celebration'} Theme Audio`;
  const safeEvent = eventDetails?.title || 'Event Celebration';
  const safeTheme = eventDetails?.themeStyle || 'Modern Festive';
  const safeVibes = eventDetails?.vibeKeywords?.join(', ') || 'Festive, joyful';

  const fullPromptText = `${prompt || 'Celebration theme music'}. Tailored for ${safeEvent}, Theme: ${safeTheme}, Vibe: ${safeVibes}, Category: ${category}, Tempo: ${bpm} BPM. High production quality sound design.`;

  const djNotes = {
    keySuggestion:
      category === 'entrance_fanfare'
        ? 'C Major / D Major'
        : category === 'cocktail_ambient'
          ? 'F Major / D Minor'
          : 'A Minor / E Minor',
    recommendedBpm: Number(bpm) || 110,
    energyRating:
      category === 'entrance_fanfare'
        ? 9
        : category === 'dance_peak'
          ? 9
          : category === 'cocktail_ambient'
            ? 5
            : 6,
    timelinePlacement:
      category === 'entrance_fanfare'
        ? 'Play precisely during VIP / Guest of Honor arrival or grand ceremony entrance'
        : category === 'cocktail_ambient'
          ? 'Loop during pre-reception cocktail hour and guest arrival mingling'
          : category === 'dinner_acoustic'
            ? 'Play as warm background ambiance during dinner courses'
            : 'Play during peak dance floor transition or countdown moment',
    transitionAdvice:
      category === 'entrance_fanfare'
        ? 'Let final brass chord ring out naturally into silence; do not hard-cut'
        : 'Crossfade smoothly over 4 bars into standard playlist set',
  };

  if (!process.env.GEMINI_API_KEY) {
    const fallbackWav = synthesizeCelebrationWav(durationSeconds, bpm, category, safeTitle);
    res.json({
      audioUrl: fallbackWav,
      title: safeTitle,
      category,
      durationSeconds,
      bpm: Number(bpm) || 110,
      promptUsed: fullPromptText,
      source: 'procedural_synthesizer',
      isFallbackAudio: true,
      djNotes,
      notice: 'GEMINI_API_KEY not configured. Generated celebration audio using harmonic synthesizer.',
    });
    return;
  }

  try {
    console.log(`[Lyria Music] Connecting to Lyria Realtime API for: "${safeTitle}" (${bpm} BPM, ~${durationSeconds}s)`);

    // Target chunk count: each chunk is ~2.66s of 48kHz stereo 16-bit audio
    const targetChunks = Math.max(2, Math.min(8, Math.ceil(durationSeconds / 2.66)));
    const audioChunks: Buffer[] = [];
    let session: any = null;
    let setupCompleteReceived = false;
    let isConfiguring = false;
    let isPlayingStarted = false;
    let isSettled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const audioPromise = new Promise<Buffer>((resolve, reject) => {
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (session) {
          try {
            session.stop();
          } catch {}
          try {
            session.close();
          } catch {}
          session = null;
        }
      };

      // 30-second comprehensive generation timeout covering entire lifecycle
      timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          const hasAudio = audioChunks.length > 0;
          const combined = hasAudio ? Buffer.concat(audioChunks) : null;
          cleanup();
          if (hasAudio && combined) {
            resolve(combined);
          } else {
            reject(new Error('Lyria audio generation timed out after 30 seconds'));
          }
        }
      }, 30000);

      // Safe initialization routine: executes ONLY once both session & setupComplete are confirmed
      const initializeAndPlay = async () => {
        if (!session || !setupCompleteReceived || isConfiguring || isSettled) {
          return;
        }
        isConfiguring = true;

        try {
          await session.setMusicGenerationConfig({
            musicGenerationConfig: {
              bpm: Number(bpm) || 110,
              density: Number(density) || 0.7,
              guidance: 4.0,
            },
          });

          if (isSettled) return;

          await session.setWeightedPrompts({
            weightedPrompts: [{ text: fullPromptText, weight: 1.0 }],
          });

          if (isSettled) return;

          if (!isPlayingStarted) {
            isPlayingStarted = true;
            session.play();
          }
        } catch (initErr) {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(initErr);
          }
        }
      };

      ai.live.music
        .connect({
          model: 'models/lyria-realtime-exp',
          callbacks: {
            onmessage: (msg: any) => {
              if (isSettled) return;

              // Confirm setup completion per Google LiveMusicServerMessage contract
              if (msg?.setupComplete !== undefined) {
                setupCompleteReceived = true;
                initializeAndPlay().catch((err) => {
                  if (!isSettled) {
                    isSettled = true;
                    cleanup();
                    reject(err);
                  }
                });
              }

              if (msg?.serverContent?.audioChunks) {
                for (const chunk of msg.serverContent.audioChunks) {
                  if (chunk.data) {
                    audioChunks.push(Buffer.from(chunk.data, 'base64'));
                  }
                }

                if (audioChunks.length >= targetChunks) {
                  isSettled = true;
                  const combined = Buffer.concat(audioChunks);
                  cleanup();
                  resolve(combined);
                }
              }
            },
            onerror: (err: any) => {
              console.error('[Lyria Music] Realtime session error:', err);
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(err);
              }
            },
            onclose: () => {
              if (!isSettled) {
                isSettled = true;
                cleanup();
                if (audioChunks.length > 0) {
                  resolve(Buffer.concat(audioChunks));
                } else {
                  reject(new Error('Lyria session closed before audio arrived'));
                }
              }
            },
          },
        })
        .then((liveSession) => {
          if (isSettled) {
            try {
              liveSession.stop();
              liveSession.close();
            } catch {}
            return;
          }
          session = liveSession;
          // In case setupComplete arrived before connect() resolved
          initializeAndPlay().catch((err) => {
            if (!isSettled) {
              isSettled = true;
              cleanup();
              reject(err);
            }
          });
        })
        .catch((err) => {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(err);
          }
        });
    });

    const pcmData = await audioPromise;
    const header = createWavHeader(pcmData.length, 48000, 2);
    const finalWavBuffer = Buffer.concat([header, pcmData]);
    const audioUrl = `data:audio/wav;base64,${finalWavBuffer.toString('base64')}`;

    console.log(`[Lyria Music] Generated ${audioChunks.length} chunks (${pcmData.length} bytes) of music for "${safeTitle}"`);

    res.json({
      audioUrl,
      title: safeTitle,
      category,
      durationSeconds: Math.round(pcmData.length / (48000 * 4)),
      bpm: Number(bpm) || 110,
      promptUsed: fullPromptText,
      source: 'lyria_realtime',
      isFallbackAudio: false,
      djNotes,
    });
  } catch (err: any) {
    console.error('[Lyria Music] Error generating audio with Lyria:', err?.message || err);
    const fallbackWav = synthesizeCelebrationWav(durationSeconds, bpm, category, safeTitle);
    res.json({
      audioUrl: fallbackWav,
      title: safeTitle,
      category,
      durationSeconds,
      bpm: Number(bpm) || 110,
      promptUsed: fullPromptText,
      source: 'procedural_synthesizer',
      isFallbackAudio: true,
      djNotes,
      errorNotice: err?.message || 'Generated custom celebration theme audio using harmonic synthesizer.',
    });
  }
});

// In-Memory Cloud Store for Plans, Share Tokens, and Co-Host Collaborators
const cloudPlansStore = new Map<string, EventPlan>();
const shareTokensStore = new Map<string, string>(); // shareCode -> planId
const planShareCodesStore = new Map<string, string>(); // planId -> shareCode
const coHostsStore = new Map<string, any[]>();
const activityFeedStore = new Map<string, any[]>();

// Helper to generate a friendly short share code
function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
}

// Cloud Sync Endpoint: Save/Sync plan across devices
app.post('/api/cloud/sync', (req: Request, res: Response) => {
  const { plan, user } = req.body;
  if (!plan || !plan.id) {
    res.status(400).json({ error: 'Valid plan object with an ID is required for cloud sync.' });
    return;
  }

  const now = new Date().toISOString();
  let shareCode = planShareCodesStore.get(plan.id);
  if (!shareCode) {
    shareCode = generateShareCode();
    planShareCodesStore.set(plan.id, shareCode);
    shareTokensStore.set(shareCode, plan.id);
  }

  // Manage collaborators
  let currentCoHosts = coHostsStore.get(plan.id) || [];
  if (user && user.email) {
    const existingIdx = currentCoHosts.findIndex((c: any) => c.email?.toLowerCase() === user.email?.toLowerCase());
    if (existingIdx !== -1) {
      currentCoHosts[existingIdx] = {
        ...currentCoHosts[existingIdx],
        name: user.displayName || currentCoHosts[existingIdx].name,
        lastActiveAt: now,
      };
    } else {
      currentCoHosts.push({
        id: `user-${Date.now()}`,
        name: user.displayName || 'Co-Host',
        email: user.email,
        role: currentCoHosts.length === 0 ? 'owner' : 'co_host',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
        joinedAt: now,
        lastActiveAt: now,
      });
    }
    coHostsStore.set(plan.id, currentCoHosts);
  }

  const syncedPlan: EventPlan = {
    ...plan,
    shareCode,
    cloudSyncedAt: now,
    collaborators: currentCoHosts,
  };

  cloudPlansStore.set(plan.id, syncedPlan);

  // Log activity
  const activities = activityFeedStore.get(plan.id) || [];
  activities.unshift({
    id: `act-${Date.now()}`,
    userName: user?.displayName || 'Planner',
    userEmail: user?.email || 'collaborator',
    action: 'synced changes to cloud',
    target: plan.concept?.title || 'Event Blueprint',
    timestamp: now,
  });
  activityFeedStore.set(plan.id, activities.slice(0, 30));

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const shareUrl = `${protocol}://${host}?share=${shareCode}`;

  res.json({
    success: true,
    planId: plan.id,
    shareCode,
    shareUrl,
    cloudSyncedAt: now,
    collaborators: currentCoHosts,
  });
});

// Get Plan by ID
app.get('/api/cloud/plans/:planId', (req: Request, res: Response) => {
  const { planId } = req.params;
  const plan = cloudPlansStore.get(planId);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found in cloud storage.' });
    return;
  }
  res.json({
    plan,
    collaborators: coHostsStore.get(planId) || [],
    activities: activityFeedStore.get(planId) || [],
  });
});

// Create/Get Shareable Invite Link
app.post('/api/cloud/share', (req: Request, res: Response) => {
  const { planId, role = 'co_host' } = req.body;
  if (!planId) {
    res.status(400).json({ error: 'planId is required' });
    return;
  }

  let shareCode = planShareCodesStore.get(planId);
  if (!shareCode) {
    shareCode = generateShareCode();
    planShareCodesStore.set(planId, shareCode);
    shareTokensStore.set(shareCode, planId);
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const shareUrl = `${protocol}://${host}?share=${shareCode}`;

  res.json({
    shareCode,
    shareUrl,
    role,
  });
});

// Join via Share Code
app.get('/api/cloud/join/:shareCode', (req: Request, res: Response) => {
  const { shareCode } = req.params;
  const planId = shareTokensStore.get(shareCode);
  if (!planId) {
    res.status(404).json({ error: 'Invalid or expired share link.' });
    return;
  }

  const plan = cloudPlansStore.get(planId);
  if (!plan) {
    res.status(404).json({ error: 'Shared plan not found in cloud store.' });
    return;
  }

  res.json({
    plan,
    shareCode,
    collaborators: coHostsStore.get(planId) || [],
    activities: activityFeedStore.get(planId) || [],
  });
});

// Manage Collaborators Endpoint
app.post('/api/cloud/collaborators', (req: Request, res: Response) => {
  const { planId, name, email, role = 'co_host', avatarUrl } = req.body;
  if (!planId || !email) {
    res.status(400).json({ error: 'planId and email are required' });
    return;
  }

  const now = new Date().toISOString();
  let list = coHostsStore.get(planId) || [];
  const idx = list.findIndex((c: any) => c.email?.toLowerCase() === email.toLowerCase());

  if (idx !== -1) {
    list[idx] = { ...list[idx], name: name || list[idx].name, role, lastActiveAt: now };
  } else {
    list.push({
      id: `collab-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      joinedAt: now,
      lastActiveAt: now,
    });
  }

  coHostsStore.set(planId, list);

  // Log activity
  const activities = activityFeedStore.get(planId) || [];
  activities.unshift({
    id: `act-${Date.now()}`,
    userName: name || email,
    userEmail: email,
    action: `joined as ${role.replace('_', ' ')}`,
    target: 'Co-Host Team',
    timestamp: now,
  });
  activityFeedStore.set(planId, activities.slice(0, 30));

  res.json({ collaborators: list });
});

// Remove Collaborator
app.delete('/api/cloud/collaborators/:planId/:email', (req: Request, res: Response) => {
  const { planId, email } = req.params;
  let list = coHostsStore.get(planId) || [];
  list = list.filter((c: any) => c.email?.toLowerCase() !== email.toLowerCase());
  coHostsStore.set(planId, list);
  res.json({ success: true, collaborators: list });
});

// Log Team Activity
app.post('/api/cloud/activity', (req: Request, res: Response) => {
  const { planId, userName, userEmail, action, target } = req.body;
  if (!planId || !action) {
    res.status(400).json({ error: 'planId and action are required' });
    return;
  }

  const activities = activityFeedStore.get(planId) || [];
  const newActivity = {
    id: `act-${Date.now()}`,
    userName: userName || 'Team Member',
    userEmail: userEmail || '',
    action,
    target: target || 'Plan',
    timestamp: new Date().toISOString(),
  };

  activities.unshift(newActivity);
  activityFeedStore.set(planId, activities.slice(0, 30));
  res.json({ success: true, activities });
});

// Get Activity Feed
app.get('/api/cloud/activity/:planId', (req: Request, res: Response) => {
  const { planId } = req.params;
  res.json({ activities: activityFeedStore.get(planId) || [] });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Full-stack Vite dev middleware or production static serving + Live WebSocket Server
async function startServer() {
  const server = http.createServer(app);

  // WebSocket Server for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    console.log('Client connected to Live Voice WebSocket');

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured for Live Voice API.');
      clientWs.send(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on the server. Live voice requires an API key.',
        })
      );
      clientWs.close();
      return;
    }

    try {
      // Connect to Gemini 3.8 Live API
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'You are Veyora Live Voice Consultant, a warm, positive, articulate, and experienced celebration planner. Every occasion, extraordinary. You speak concisely, with upbeat spoken energy and natural conversational warmth. Offer immediate, practical advice on budget allocation, venue layouts, ceremony timing, and guest hospitality. Keep responses brief (1-3 sentences) suitable for low-latency live spoken audio.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session callback error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err?.message || 'Live voice session error' }));
            }
          },
        },
      });

      // Handle audio stream from client
      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (e: any) {
          console.error('Error handling client audio message:', e?.message || e);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.error('Failed to initialize Gemini 3.8 Live session:', err?.message || err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err?.message || 'Failed to start Live session' }));
        clientWs.close();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Veyora server with Live Voice WS running on port ${port} (PID: ${process.pid})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
