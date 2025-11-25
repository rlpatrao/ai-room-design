export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioUrl?: string; // Blob URL for TTS
  timestamp: number;
}

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  styleName: string;
  description: string;
}

export enum DesignStyle {
  Modern = 'Modern',
  MidCentury = 'Mid-Century Modern',
  Scandinavian = 'Scandinavian',
  Industrial = 'Industrial',
  Bohemian = 'Bohemian',
  Minimalist = 'Minimalist',
  Farmhouse = 'Farmhouse',
  ArtDeco = 'Art Deco'
}

export interface GroundingLink {
  title: string;
  url: string;
}