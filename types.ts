export enum Language {
  ENGLISH = 'English',
  CHINESE = 'Chinese (Simplified)',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  KOREAN = 'Korean',
  RUSSIAN = 'Russian',
  PORTUGUESE = 'Portuguese',
  ARABIC = 'Arabic'
}

export interface Example {
  sentence: string;
  translation: string;
}

export interface PragmaticVariant {
  expression: string;
  scenario: 'Academic' | 'Formal' | 'Social' | 'Meme' | 'Daily';
  posture: 'Neutral' | 'Friendly' | 'Ironic' | 'Reserved' | 'Direct';
  pragmaticNote: string; // 文化与逻辑解析
}

export interface WordEntry {
  id: string;
  term: string;
  nativeDefinition: string;
  variants: PragmaticVariant[];
  usageNote: string;
  synonyms: string[];
  imageUrl?: string;
  createdAt: number;
}

export interface ScanResult {
  original: string;
  phonetic: string;
  translation: string;
}

export interface AppState {
  nativeLang: Language;
  targetLang: Language;
  hasOnboarded: boolean;
}

export type ViewMode = 'SEARCH' | 'NOTEBOOK' | 'STORY' | 'FLASHCARDS' | 'SCAN';