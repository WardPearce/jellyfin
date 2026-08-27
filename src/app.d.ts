import 'vidstack/player';
import 'vidstack/player/ui';
import 'vidstack/player/layouts/default';

declare module 'svelte' {
	interface IntrinsicElements {
		'media-player': Record<string, unknown>;
		'media-provider': Record<string, unknown>;
		'media-poster': Record<string, unknown>;
		'media-video-layout': Record<string, unknown>;
		'media-controls': Record<string, unknown>;
		'media-controls-group': Record<string, unknown>;
		'media-play-button': Record<string, unknown>;
		'media-mute-button': Record<string, unknown>;
		'media-volume-slider': Record<string, unknown>;
		'media-time': Record<string, unknown>;
		'media-time-slider': Record<string, unknown>;
		'media-slider-preview': Record<string, unknown>;
		'media-slider-value': Record<string, unknown>;
		'media-slider-thumbnail': Record<string, unknown>;
		'media-fullscreen-button': Record<string, unknown>;
		'media-seek-button': Record<string, unknown>;
		'media-caption-button': Record<string, unknown>;
		'media-captions': Record<string, unknown>;
		'media-spinner': Record<string, unknown>;
		'media-gesture': Record<string, unknown>;
		'media-icon': Record<string, unknown>;
		'media-chapter-title': Record<string, unknown>;
	}
}

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			status?: number;
		}
		interface Locals {
			serverUrl?: string;
			accessToken?: string;
		}
		interface PageData {
			user?: {
				Name?: string | null;
				Id?: string;
				PrimaryImageTag?: string | null;
			};
			serverUrl?: string;
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageState {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Platform {}
	}
}

export {};
