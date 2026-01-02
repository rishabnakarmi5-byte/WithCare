export enum RecipientType {
  PARENT = 'Parent',
  GRANDPARENT = 'Grandparent',
  PARTNER = 'Partner',
  FRIEND = 'Friend',
  RELATIVE = 'Relative',
  AUTHORITY = 'Person of Authority',
  GENERAL = 'General Society'
}

export enum ToneType {
  EMPATHETIC = 'Empathetic & Soft',
  SCIENTIFIC = 'Logical & Scientific',
  ASSERTIVE = 'Assertive but Kind',
  EDUCATIONAL = 'Educational & Explanatory'
}

export enum VoiceOption {
  KORE = 'Kore (Calm Female)',
  ZEPHYR = 'Zephyr (Energetic Female)',
  PUCK = 'Puck (Soft Male/Young)',
  CHARON = 'Charon (Deep Male)',
  FENRIR = 'Fenrir (Assertive Male)'
}

export enum LanguageOption {
  ENGLISH = 'English',
  NEPALI_SCRIPT = 'Nepali (Devanagari)',
  NEPALI_ROMANIZED = 'Nepali (Romanized)',
  THAI = 'Thai'
}

export interface GenerationRequest {
  userInput: string;
  recipient: RecipientType;
  tone: ToneType;
  voice: VoiceOption;
  language: LanguageOption;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeneratedContent {
  message: string;
  sources: GroundingSource[];
  audioBase64?: string;
  originalRequest: GenerationRequest; // Store original request for context/editing
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}
