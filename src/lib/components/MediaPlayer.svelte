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
		thumbnails = null
	}: {
		src: string;
		poster?: string;
		title?: string;
		subtitle?: string;
		onBack?: () => void;
		subtitles?: SubtitleTrack[];
		thumbnails?: ThumbnailSrc;
	} = $props();

	let playerEl: HTMLElement | null = $state(null);
	let headerVisible = $state(true);

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

		playerEl.addEventListener('provider-change', onProviderChange);
		playerEl.addEventListener('controls-change', onControlsChange);

		return () => {
			playerEl?.removeEventListener('provider-change', onProviderChange);
			playerEl?.removeEventListener('controls-change', onControlsChange);
		};
	});

	$effect(() => {
		if (!playerEl || !subtitles.length) return;

		const player = playerEl as unknown as MediaPlayerElement;
		const existing = player.textTracks?.size ?? 0;
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
</script>

<media-player
	bind:this={playerEl}
	{src}
	{poster}
	{title}
	crossorigin
	playsinline
	logLevel="error"
	class="vds-player w-full"
>
	<media-provider></media-provider>
	<media-captions></media-captions>

	{#if thumbnails}
		<media-slider-thumbnail class="vds-slider-thumbnail" src={thumbnails}></media-slider-thumbnail>
	{/if}

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

	<media-video-layout></media-video-layout>
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
</style>
