import { writable } from '@macfja/svelte-persistent-store';

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

let accent = $state<AccentColor>('indigo');
let glass = $state<boolean>(true);

accentStore.subscribe((v) => (accent = v));
glassStore.subscribe((v) => (glass = v));

const palette = $derived(ACCENT_PALETTES[accent]);

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
		getPalette(color: AccentColor) {
			return ACCENT_PALETTES[color];
		},
		setAccent(color: AccentColor) {
			accentStore.set(color);
		},
		toggleGlass() {
			glassStore.set(!glass);
		}
	};
}

export type SettingsState = ReturnType<typeof getSettingsState>;
