export type EventType =
  | 'birthday'
  | 'wedding'
  | 'college'
  | 'community'
  | 'corporate'
  | 'anniversary'
  | 'baby_shower'
  | 'other';

export type VenueType = 'indoor' | 'outdoor' | 'hybrid' | 'any';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type TaskPhase =
  | '8+ Weeks Before'
  | '4-6 Weeks Before'
  | '2-3 Weeks Before'
  | '1 Week Before'
  | 'Day Before'
  | 'Event Day'
  | 'Post Event';

export interface EventInput {
  id: string;
  title: string;
  eventType: EventType;
  customEventType?: string;
  eventDate: string; // YYYY-MM-DD
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  themeStyle: string;
  foodPreferences: string[];
  customDietary?: string;
  venuePreference: VenueType;
  specialRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  category:
    | 'Venue & Space'
    | 'Food & Beverages'
    | 'Decor & Styling'
    | 'Photography & Video'
    | 'Entertainment & Audio'
    | 'Stationery & Favors'
    | 'Staff & Operations'
    | 'Contingency Fund';
  name: string;
  estimatedCost: number;
  actualCost?: number;
  notes: string;
  isEssential: boolean;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  category: string;
  duePhase: TaskPhase;
  dueDate?: string;
  priority: PriorityLevel;
  isCompleted: boolean;
  assignedTo?: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
  details: string;
  owner: string;
}

export interface GroundedMapsPlace {
  id: string;
  name: string;
  category: string;
  address?: string;
  googleMapsUri: string;
  directionsUri?: string;
  rating?: number;
  userRatingsTotal?: number;
  reviewSnippets?: string[];
  summary: string;
  priceLevel?: string;
  suitabilityScore?: string;
  recommendedFor?: string;
  isRealMapsPlace: boolean;
}

export interface VendorRecommendation {
  id: string;
  category:
    | 'Venue'
    | 'Catering'
    | 'Photography'
    | 'Entertainment'
    | 'Decor & Florist'
    | 'Day-of Coordination';
  name: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  estimatedCost: string;
  location: string;
  specialty: string;
  contactOrWebsite: string;
  isSampleData: boolean;
  keyQuestionsToAsk: string[];
  recommendedBookingWindow: string;
  googleMapsUri?: string;
  directionsUri?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  reviewSnippets?: string[];
  isPrimaryVenue?: boolean;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface GuestExperienceIdea {
  title: string;
  description: string;
  impact: 'High Memory' | 'Icebreaker' | 'Sensory' | 'Personalized';
}

export interface InspirationItem {
  id: string;
  source: 'ai_generated' | 'camera_capture' | 'upload' | 'curated_theme';
  imageUrl: string;
  title: string;
  category:
    | 'Decor & Floral'
    | 'Table Setting'
    | 'Lighting & Ambience'
    | 'Attire & Vibe'
    | 'Cake & Desserts'
    | 'Venue Staging'
    | 'General';
  notes?: string;
  promptUsed?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9';
  createdAt: string;
}

export type TableShape =
  | 'round'
  | 'rectangle'
  | 'cocktail'
  | 'stage'
  | 'dance_floor'
  | 'bar'
  | 'lounge';

export interface SeatingTable {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  seatedGuests: number;
  notes?: string;
  x: number; // grid position X (-12 to 12)
  z: number; // grid position Z (-12 to 12)
  rotation?: number; // radians
  color?: string; // custom accent or theme color
}

export interface Venue3DLayout {
  presetName: string;
  lightingMode: 'daylight' | 'evening' | 'neon';
  floorTexture: 'wood' | 'marble' | 'carpet' | 'terrazzo';
  tables: SeatingTable[];
}

export interface EventPlan {
  id: string;
  input: EventInput;
  concept: {
    title: string;
    tagline: string;
    description: string;
    colorPalette: ColorSwatch[];
    vibeKeywords: string[];
    dressCodeSuggestion: string;
  };
  budgetPlan: {
    totalBudget: number;
    currency: string;
    items: BudgetItem[];
    budgetTips: string[];
    contingencyPercentage: number;
  };
  timeline: TimelineTask[];
  dayOfSchedule: ScheduleItem[];
  recommendations: {
    venueTips: string[];
    cateringIdeas: string[];
    decorAndAmbiance: string[];
    photoVideoMoments: string[];
    entertainmentAndMusic: string[];
  };
  guestExperience: GuestExperienceIdea[];
  practicalTips: string[];
  vendorRecommendations: VendorRecommendation[];
  selectedVenue?: GroundedMapsPlace;
  seatingLayout?: Venue3DLayout;
  inspirationBoard?: InspirationItem[];
  videoInvites?: EventVideoInvite[];
  themeMusicTracks?: EventThemeTrack[];
  collaborators?: EventCollaborator[];
  shareCode?: string;
  cloudSyncedAt?: string;
  cloudOwnerEmail?: string;
  generatedAt: string;
  lastEditedAt: string;
}

export type CollaboratorRole = 'owner' | 'co_host' | 'budget_manager' | 'viewer';

export interface EventCollaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
  avatarUrl?: string;
  joinedAt: string;
  lastActiveAt?: string;
  isCurrentUser?: boolean;
}

export interface CollaborationActivity {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface EventThemeTrack {
  id: string;
  title: string;
  category:
    | 'entrance_fanfare'
    | 'cocktail_ambient'
    | 'dinner_acoustic'
    | 'dance_peak'
    | 'farewell_warm'
    | 'custom';
  audioUrl: string;
  durationSeconds: number;
  bpm?: number;
  prompt: string;
  vibeDescription?: string;
  djNotes?: string;
  createdAt: string;
}

export interface EventVideoInvite {
  id: string;
  title: string;
  videoUrl: string;
  aspectRatio: '16:9' | '9:16';
  sourceImage?: string;
  prompt: string;
  createdAt: string;
  durationSeconds?: number;
}


