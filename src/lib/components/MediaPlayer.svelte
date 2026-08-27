<script lang="ts">
	import 'vidstack/player';
	import 'vidstack/player/ui';
	import 'vidstack/player/layouts/default';

	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/default/theme.css';
	import 'vidstack/player/styles/default/controls.css';
	import 'vidstack/player/styles/default/buttons.css';
	import 'vidstack/player/styles/default/sliders.css';
	import 'vidstack/player/styles/default/menus.css';
	import 'vidstack/player/styles/default/tooltips.css';
	import 'vidstack/player/styles/default/captions.css';
	import 'vidstack/player/styles/default/poster.css';
	import 'vidstack/player/styles/default/buffering.css';
	import 'vidstack/player/styles/default/gestures.css';
	import 'vidstack/player/styles/default/icons.css';
	import 'vidstack/player/styles/default/layouts/video.css';
	import { onMount } from 'svelte';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import type { ThumbnailSrc } from 'vidstack';

	interface SubtitleTrack {
		src: string;
		label: string;
		language: string;
		kind?: 'subtitles' | 'captions';
		type?: 'vtt' | 'srt' | 'ass' | 'ssa';
		default?: boolean;
	}

	let {
		src,
		poster,
		title,
		subtitle,
		onBack,
		subtitles = [],
		thumbnails = null,
		startTime = 0
	}: {
		src: string;
		poster?: string;
		title?: string;
		subtitle?: string;
		onBack?: () => void;
		subtitles?: SubtitleTrack[];
		thumbnails?: ThumbnailSrc;
		startTime?: number;
	} = $props();

	let playerEl: HTMLElement | null = $state(null);
	let headerVisible = $state(true);
	let posterVisible = $state(true);

	onMount(() => {
		if (!playerEl) return;

		const onProviderChange = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail?.type === 'hls') {
				detail.config = {
					maxBufferLength: 30,
					backBufferLength: 30,
					startLevel: -1
				};
			}
		};

		const onControlsChange = (e: Event) => {
			headerVisible = (e as CustomEvent).detail;
		};

		// Hide the poster once playback actually starts (guards against the poster
		// staying visible forever when autoplay is blocked by the browser).
		const onPlay = () => {
			posterVisible = false;
		};

		playerEl.addEventListener('provider-change', onProviderChange);
		playerEl.addEventListener('controls-change', onControlsChange);
		playerEl.addEventListener('play', onPlay);

		return () => {
			playerEl?.removeEventListener('provider-change', onProviderChange);
			playerEl?.removeEventListener('controls-change', onControlsChange);
			playerEl?.removeEventListener('play', onPlay);
		};
	});

	$effect(() => {
		if (!playerEl || !subtitles.length) return;

		const player = playerEl as unknown as MediaPlayerElement;
		const existing = player.textTracks?.length ?? 0;
		if (existing >= subtitles.length) return;

		for (const track of subtitles) {
			player.textTracks?.add({
				kind: track.kind ?? 'subtitles',
				src: track.src,
				label: track.label,
				language: track.language,
				type: track.type ?? 'vtt',
				default: track.default ?? false
			});
		}
	});

	$effect(() => {
		if (!playerEl || !startTime) return;
		(playerEl as unknown as MediaPlayerElement).currentTime = startTime;
	});
</script>

<media-player
	bind:this={playerEl}
	{src}
	{poster}
	{title}
	crossorigin
	playsinline
	logLevel="error"
	autoplay
	class="vds-player aspect-auto h-full w-full"
>
	<media-provider></media-provider>
	{#if posterVisible && poster}
		<media-poster src={poster} alt={title}></media-poster>
	{/if}
	<media-captions></media-captions>

	<div class="vds-overlay-header" class:vds-hidden={!headerVisible}>
		{#if onBack}
			<button type="button" onclick={onBack} class="vds-overlay-btn" aria-label="Go back">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
					/>
				</svg>
			</button>
		{/if}
		{#if title}
			<div class="vds-overlay-title">
				<h1 class="text-lg font-semibold text-white drop-shadow-lg">{title}</h1>
				{#if subtitle}
					<p class="text-sm text-zinc-300 drop-shadow-lg">{subtitle}</p>
				{/if}
			</div>
		{/if}
	</div>

	<media-video-layout {thumbnails}></media-video-layout>
</media-player>

<style>
	:global(.vds-overlay-header) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		z-index: 20;
		pointer-events: none;
		opacity: 1;
		visibility: visible;
		transition:
			opacity 0.2s ease-in,
			visibility 0.2s ease-in;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
	}

	:global(.vds-overlay-header.vds-hidden) {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 0.2s ease-out,
			visibility 0.2s ease-out;
	}

	:global(.vds-overlay-btn) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.8);
		background: none;
		border: none;
		cursor: pointer;
		pointer-events: auto;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	:global(.vds-overlay-btn:hover) {
		background-color: rgba(255, 255, 255, 0.15);
		color: white;
	}

	:global(.vds-overlay-title) {
		min-width: 0;
		pointer-events: auto;
	}

	:global(.vds-overlay-title h1) {
		margin: 0;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 50vw;
	}

	:global(.vds-overlay-title p) {
		margin: 0;
		line-height: 1.3;
	}

	/* -------- Theming overrides for the default layout -------- */

	/* Slider thumb & track sizing */
	:global(media-player .vds-time-slider) {
		--media-slider-track-height: 4px;
	}

	:global(media-player .vds-volume-slider) {
		--media-slider-track-height: 4px;
		--media-slider-thumb-size: 12px;
	}

	/* Round control buttons */
	:global(media-player .vds-button) {
		border-radius: 9999px;
	}

	/* Poster / large center play button uses the brand accent */
	:global(media-player .vds-default-play-button) {
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: color-mix(in srgb, var(--media-brand, #00a4dc) 25%, rgba(0, 0, 0, 0.55));
		backdrop-filter: blur(4px);
	}

	/* Poster fills the entire player (stretches to cover the full screen) */
	:global(media-player media-poster),
	:global(media-player .vds-poster),
	:global(media-player media-poster img),
	:global(media-player .vds-poster img) {
		position: absolute;
		inset: 0;
		top: 0;
		transform: none;
		width: 100%;
		height: 100%;
	}

	:global(media-player .vds-poster img),
	:global(media-player media-poster img) {
		object-fit: cover;
	}

	/* Bottom scrim gradient */
	:global(media-player .vds-scrim) {
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.75),
			rgba(0, 0, 0, 0.35) 40%,
			transparent 80%
		) !important;
	}

	/* Control buttons: subtle hover bubble matching the accent */
	:global(media-player .vds-button:hover) {
		background-color: rgba(255, 255, 255, 0.14);
	}

	:global(media-player .vds-button[data-pressed]) {
		color: var(--media-brand, #00a4dc);
	}
</style>
