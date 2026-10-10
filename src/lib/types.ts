export type CaptionStyle = "word_highlight" | "box_minimal" | "kinetic_pop";
export type SafeZone = "center" | "bottom_clean";
export type ProjectMode = "talking_head" | "full_animated";
export type ProjectStatus =
  | "draft"
  | "generating_script"
  | "audio_ready"
  | "timeline_ready"
  | "rendering"
  | "completed"
  | "failed";
export type VisualDensity = "minimal" | "moderate" | "intense";

export interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  font_family: string;
  caption_style: CaptionStyle;
  logo_url: string | null;
  safe_zone: SafeZone;
}

/** Contract allows arbitrary props; known keys are listed for typed access. */
export type Props = Record<string, any> &
  Partial<Record<"title" | "value" | "label" | "headline" | "imageUrl" | "items" | "emoji", any>>;

export interface Overlay {
  component: string;
  fromFrame: number;
  durationInFrames: number;
  props: Props;
  sfx: string;
}

export interface Scene {
  id: string;
  fromFrame: number;
  durationInFrames: number;
  layout: string;
  layoutProps: Props;
  overlays: Overlay[];
}

export interface TimelineData {
  fps: number;
  width: number;
  height: number;
  theme: { primaryColor: string; accentColor: string; backgroundColor: string; fontFamily: string };
  audioTrack: { voiceoverUrl: string; bgmUrl: string; bgmVolume: number };
  scenes: Scene[];
  captions: { word: string; startFrame: number; endFrame: number }[];
}

export interface VideoProject {
  id: string;
  brand_kit_id: string;
  title: string;
  mode: ProjectMode;
  status: ProjectStatus;
  raw_video_url: string | null;
  script_text: string | null;
  audio_url: string | null;
  voice_id: string;
  visual_density: VisualDensity;
  sfx_enabled: boolean;
  timeline_data: TimelineData | null;
  export_url: string | null;
  created_at: string;
}

/** Palabra alineada con el audio (segundos). Se convierte a frames en el timeline. */
export type AlignedWord = { word: string; start: number; end: number };
