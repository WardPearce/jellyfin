import { writable } from '@macfja/svelte-persistent-store';

export type PlaybackQuality = 'auto' | '4320' | '2160' | '1440' | '1080' | '720' | '480' | '360';

export type SubtitleMode = 'none' | 'foreign' | 'always';

export interface PlaybackPreferences {
	quality: PlaybackQuality;
	subtitleMode: SubtitleMode;
	subtitleLanguage: string;
	audioLanguage: string;
	autoPlayNext: boolean;
	resume: boolean;
	volume: number;
}

export interface HomePreferences {
	combineResumeNext: boolean;
}

export type GridDensity = 'compact' | 'cozy' | 'comfortable';

export type BrowseLayout = 'grid' | 'list';

export interface PosterPreferences {
	density: GridDensity;
	layout: BrowseLayout;
}

export type AccentColor =
	| 'indigo'
	| 'purple'
	| 'blue'
	| 'cyan'
	| 'teal'
	| 'emerald'
	| 'lime'
	| 'amber'
	| 'rose'
	| 'red'
	| 'pink';

export interface AccentPalette {
	400: string;
	500: string;
	600: string;
	700: string;
	ring: string;
	swatch: string;
}

export interface BackgroundPalette {
	surface: string;
	surfaceBorder: string;
	glass: string;
	glassBorder: string;
	menu: string;
	menuBorder: string;
	menuSection: string;
	menuTopBar: string;
	bodyGlowA: string;
	bodyGlowB: string;
	bodyGlowC: string;
	fxIntenseA: string;
	fxSubtleA: string;
	fxIntenseB: string;
	fxSubtleB: string;
	fxIntenseC: string;
	fxSubtleC: string;
}

function hueOf(color: string): number {
	const match = /^hsl\((\d+)/.exec(color);
	return match ? Number(match[1]) : 234;
}

const ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
	indigo: {
		400: 'hsl(234 80% 74%)',
		500: 'hsl(234 70% 64%)',
		600: 'hsl(234 60% 54%)',
		700: 'hsl(234 50% 44%)',
		ring: 'hsl(234 70% 64% / 0.5)',
		swatch: '#6366f1'
	},
	purple: {
		400: 'hsl(270 70% 72%)',
		500: 'hsl(270 60% 62%)',
		600: 'hsl(270 50% 52%)',
		700: 'hsl(270 40% 42%)',
		ring: 'hsl(270 60% 62% / 0.5)',
		swatch: '#a855f7'
	},
	blue: {
		400: 'hsl(217 80% 70%)',
		500: 'hsl(217 70% 60%)',
		600: 'hsl(217 60% 50%)',
		700: 'hsl(217 50% 40%)',
		ring: 'hsl(217 70% 60% / 0.5)',
		swatch: '#3b82f6'
	},
	cyan: {
		400: 'hsl(185 70% 66%)',
		500: 'hsl(185 65% 56%)',
		600: 'hsl(185 60% 46%)',
		700: 'hsl(185 50% 36%)',
		ring: 'hsl(185 65% 56% / 0.5)',
		swatch: '#06b6d4'
	},
	teal: {
		400: 'hsl(170 55% 62%)',
		500: 'hsl(170 50% 52%)',
		600: 'hsl(170 45% 42%)',
		700: 'hsl(170 40% 34%)',
		ring: 'hsl(170 50% 52% / 0.5)',
		swatch: '#14b8a6'
	},
	emerald: {
		400: 'hsl(152 55% 62%)',
		500: 'hsl(152 50% 52%)',
		600: 'hsl(152 45% 42%)',
		700: 'hsl(152 40% 34%)',
		ring: 'hsl(152 50% 52% / 0.5)',
		swatch: '#10b981'
	},
	lime: {
		400: 'hsl(84 60% 60%)',
		500: 'hsl(84 55% 50%)',
		600: 'hsl(84 50% 40%)',
		700: 'hsl(84 45% 32%)',
		ring: 'hsl(84 55% 50% / 0.5)',
		swatch: '#84cc16'
	},
	amber: {
		400: 'hsl(38 80% 66%)',
		500: 'hsl(38 70% 56%)',
		600: 'hsl(38 60% 46%)',
		700: 'hsl(38 50% 36%)',
		ring: 'hsl(38 70% 56% / 0.5)',
		swatch: '#f59e0b'
	},
	rose: {
		400: 'hsl(340 70% 70%)',
		500: 'hsl(340 60% 60%)',
		600: 'hsl(340 50% 50%)',
		700: 'hsl(340 40% 40%)',
		ring: 'hsl(340 60% 60% / 0.5)',
		swatch: '#f43f5e'
	},
	red: {
		400: 'hsl(0 75% 66%)',
		500: 'hsl(0 70% 56%)',
		600: 'hsl(0 65% 48%)',
		700: 'hsl(0 55% 38%)',
		ring: 'hsl(0 70% 56% / 0.5)',
		swatch: '#ef4444'
	},
	pink: {
		400: 'hsl(330 75% 70%)',
		500: 'hsl(330 65% 60%)',
		600: 'hsl(330 55% 50%)',
		700: 'hsl(330 45% 40%)',
		ring: 'hsl(330 65% 60% / 0.5)',
		swatch: '#ec4899'
	}
};

export const accentColors: AccentColor[] = [
	'indigo',
	'purple',
	'blue',
	'cyan',
	'teal',
	'emerald',
	'lime',
	'amber',
	'rose',
	'red',
	'pink'
];

const accentStore = writable<AccentColor>('jellyfin_accent', 'indigo');
const glassStore = writable<boolean>('jellyfin_glass', true);

const homeStore = writable<HomePreferences>('jellyfin_home', {
	combineResumeNext: false
});

const playbackStore = writable<PlaybackPreferences>('jellyfin_playback', {
	quality: 'auto',
	subtitleMode: 'foreign',
	subtitleLanguage: 'default',
	audioLanguage: 'default',
	autoPlayNext: true,
	resume: true,
	volume: 1
});

const posterStore = writable<PosterPreferences>('jellyfin_poster', {
	density: 'compact',
	layout: 'grid'
});

let accent = $state<AccentColor>('indigo');
let glass = $state<boolean>(true);
let home = $state<HomePreferences>({ combineResumeNext: false });
let playback = $state<PlaybackPreferences>({
	quality: 'auto',
	subtitleMode: 'foreign',
	subtitleLanguage: 'default',
	audioLanguage: 'default',
	autoPlayNext: true,
	resume: true,
	volume: 1
});
let poster = $state<PosterPreferences>({ density: 'compact', layout: 'grid' });

accentStore.subscribe((v) => (accent = v));
glassStore.subscribe((v) => (glass = v));
homeStore.subscribe((v) => (home = v));
playbackStore.subscribe((v) => (playback = v));
posterStore.subscribe((v) => (poster = v));

const palette = $derived(ACCENT_PALETTES[accent]);

const background = $derived.by<BackgroundPalette>(() => {
	const h = hueOf(palette[400]);
	const companion = (h - 70 + 360) % 360;
	const highlight = (h + 15) % 360;
	const warm = (h + 70) % 360;
	return {
		surface: `hsl(${h} 6% 9% / 0.72)`,
		surfaceBorder: `hsl(${h} 6% 16% / 0.8)`,
		glass: `hsl(${h} 6% 10% / var(--glass-bg-opacity))`,
		glassBorder: `hsl(${h} 6% 15% / var(--glass-border-opacity))`,
		menu: `hsl(${h} 6% 10% / var(--glass-bg-opacity, 0.8))`,
		menuBorder: `1px solid hsl(${h} 6% 15% / var(--glass-border-opacity, 0.8))`,
		menuSection: `hsl(${h} 6% 12% / 0.5)`,
		menuTopBar: `hsl(${h} 6% 14% / 0.5)`,
		bodyGlowA: `hsl(${h} 60% 24% / 0.35)`,
		bodyGlowB: `hsl(${companion} 80% 26% / 0.32)`,
		bodyGlowC: `hsl(${highlight} 55% 18% / 0.3)`,
		fxIntenseA: `hsl(${h} 60% 48% / 0.45)`,
		fxSubtleA: `hsl(${h} 60% 40% / 0.28)`,
		fxIntenseB: `hsl(${companion} 80% 42% / 0.42)`,
		fxSubtleB: `hsl(${companion} 80% 36% / 0.26)`,
		fxIntenseC: `hsl(${warm} 60% 44% / 0.35)`,
		fxSubtleC: `hsl(${warm} 55% 34% / 0.22)`
	};
});

export function getSettingsState() {
	return {
		get accent() {
			return accent;
		},
		get glass() {
			return glass;
		},
		get palette() {
			return palette;
		},
		get background() {
			return background;
		},
		get home() {
			return home;
		},
		get playback() {
			return playback;
		},
		get poster() {
			return poster;
		},
		getPalette(color: AccentColor) {
			return ACCENT_PALETTES[color];
		},
		setAccent(color: AccentColor) {
			accentStore.set(color);
		},
		toggleGlass() {
			glassStore.set(!glass);
		},
		setHome(patch: Partial<HomePreferences>) {
			homeStore.set({ ...home, ...patch });
		},
		setPlayback(patch: Partial<PlaybackPreferences>) {
			playbackStore.set({ ...playback, ...patch });
		},
		setPoster(patch: Partial<PosterPreferences>) {
			posterStore.set({ ...poster, ...patch });
		}
	};
}

export type SettingsState = ReturnType<typeof getSettingsState>;
