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
	import { SvelteSet } from 'svelte/reactivity';
	import { getSettings } from '$lib/state/index.svelte';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import type { ThumbnailSrc } from 'vidstack';
	import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
	import { ArrowLeft } from '@lucide/svelte';

	interface SubtitleTrack {
		src: string;
		label: string;
		language: string;
		kind?: 'subtitles' | 'captions';
		type?: 'vtt' | 'srt' | 'ass' | 'ssa';
		default?: boolean;
	}

	interface ActiveSegment {
		type: string;
		start: number;
		end: number;
		key: string;
	}

	const SEGMENT_LABELS: Record<string, string> = {
		Intro: 'intro',
		Outro: 'credits',
		Recap: 'recap',
		Preview: 'preview',
		Commercial: 'commercial'
	};

	const SKIPPABLE_SEGMENT_TYPES = new Set(Object.keys(SEGMENT_LABELS));
	const SKIP_COUNTDOWN_SECONDS = 3;

	const playerSettings = getSettings();

	let {
		src,
		poster,
		title,
		subtitle,
		onBack,
		subtitles = [],
		thumbnails = null,
		startTime = 0,
		segments = [],
		onStart,
		onProgress,
		onEnded
	}: {
		src: string;
		poster?: string;
		title?: string;
		subtitle?: string;
		onBack?: () => void;
		subtitles?: SubtitleTrack[];
		thumbnails?: ThumbnailSrc;
		startTime?: number;
		segments?: MediaSegmentDto[];
		onStart?: () => void;
		onProgress?: (positionSeconds: number, playing: boolean) => void;
		onEnded?: () => void;
	} = $props();

	const activeSegments = $derived(
		(segments ?? [])
			.map((s) => ({
				type: s.Type ?? 'Unknown',
				start: (s.StartTicks ?? 0) / 10_000_000,
				end: (s.EndTicks ?? 0) / 10_000_000,
				key: `${s.Id ?? `${s.Type ?? 'Unknown'}:${s.StartTicks ?? 0}`}`
			}))
			.filter((s) => SKIPPABLE_SEGMENT_TYPES.has(s.type) && s.end > s.start)
	);

	let playerEl: HTMLElement | null = $state(null);
	let headerVisible = $state(true);
	let posterVisible = $state(true);

	let prompt = $state<ActiveSegment | null>(null);
	let countdown = $state(0);

	const dismissedSegments: SvelteSet<string> = new SvelteSet();
	const handledSegments: SvelteSet<string> = new SvelteSet();
	let lastTime = 0;
	let hasReportedStart = false;
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	function applyStartSeek() {
		if (!playerEl || !startTime) return;
		const player = playerEl as unknown as MediaPlayerElement;
		if (Math.abs(player.currentTime - startTime) > 1) {
			player.currentTime = startTime;
			lastTime = startTime;
		}
	}

	function clearCountdown() {
		if (countdownTimer !== null) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
	}

	function skipSegment(segment: ActiveSegment) {
		const player = playerEl as unknown as MediaPlayerElement | null;
		if (player) player.currentTime = segment.end;
		prompt = null;
		clearCountdown();
	}

	function dismissSegment() {
		if (prompt) dismissedSegments.add(prompt.key);
		prompt = null;
		clearCountdown();
	}

	function startPrompt(segment: ActiveSegment) {
		prompt = segment;
		countdown = SKIP_COUNTDOWN_SECONDS;
		clearCountdown();
		countdownTimer = setInterval(() => {
			const player = playerEl as unknown as MediaPlayerElement | null;
			if (!player || player.paused) return;
			countdown -= 1;
			if (countdown <= 0) {
				clearCountdown();
				skipSegment(segment);
			}
		}, 1000);
	}

	function checkSegmentOverlay(player: MediaPlayerElement) {
		if (!activeSegments.length) return;
		const time = player.currentTime;
		const active = activeSegments.find((s) => time >= s.start && time < s.end);
		if (active && !handledSegments.has(active.key) && !dismissedSegments.has(active.key)) {
			const leadIn = Math.min(60, (active.end - active.start) * 0.3);
			if (
				!player.paused &&
				lastTime < active.start &&
				time >= active.start &&
				time - active.start < leadIn
			) {
				handledSegments.add(active.key);
				startPrompt(active);
			}
		}
		lastTime = time;
	}

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
			if (!hasReportedStart) {
				hasReportedStart = true;
				onStart?.();
			}
		};

		const onTimeUpdate = () => {
			const player = playerEl as unknown as MediaPlayerElement;
			onProgress?.(player.currentTime, !player.paused);
			checkSegmentOverlay(player);
		};

		const onEndedEvent = () => {
			const player = playerEl as unknown as MediaPlayerElement;
			onProgress?.(player.currentTime, false);
			prompt = null;
			clearCountdown();
			onEnded?.();
		};

		const onVolumeChange = (e: Event) => {
			const detail = (e as CustomEvent).detail as { volume?: number; muted?: boolean } | null;
			if (detail && typeof detail.volume === 'number' && playerSettings) {
				playerSettings.setPlayback({ volume: detail.volume });
			}
		};

		const restoreVolume = () => {
			const player = playerEl as unknown as MediaPlayerElement;
			const saved = playerSettings?.playback.volume ?? 1;
			if (typeof player.volume === 'number' && player.volume !== saved) {
				player.volume = saved;
			}
		};

		playerEl.addEventListener('provider-change', onProviderChange);
		playerEl.addEventListener('controls-change', onControlsChange);
		playerEl.addEventListener('play', onPlay);
		playerEl.addEventListener('time-update', onTimeUpdate);
		playerEl.addEventListener('ended', onEndedEvent);
		playerEl.addEventListener('volume-change', onVolumeChange);
		playerEl.addEventListener('loaded-metadata', applyStartSeek);
		playerEl.addEventListener('loaded-metadata', restoreVolume);

		return () => {
			playerEl?.removeEventListener('provider-change', onProviderChange);
			playerEl?.removeEventListener('controls-change', onControlsChange);
			playerEl?.removeEventListener('play', onPlay);
			playerEl?.removeEventListener('time-update', onTimeUpdate);
			playerEl?.removeEventListener('ended', onEndedEvent);
			playerEl?.removeEventListener('volume-change', onVolumeChange);
			playerEl?.removeEventListener('loaded-metadata', applyStartSeek);
			playerEl?.removeEventListener('loaded-metadata', restoreVolume);
			clearCountdown();
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
		applyStartSeek();
	});

	$effect(() => {
		if (!playerEl) return;
		const player = playerEl as unknown as MediaPlayerElement;
		const saved = playerSettings?.playback.volume ?? 1;
		if (typeof player.volume === 'number' && player.volume !== saved) {
			player.volume = saved;
		}
	});
</script>

<div class="relative h-full w-full">
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
		<media-captions class="vds-captions"></media-captions>

		<div class="vds-overlay-header" class:vds-hidden={!headerVisible}>
			{#if onBack}
				<button type="button" onclick={onBack} class="vds-overlay-btn" aria-label="Go back">
					<ArrowLeft class="h-5 w-5" />
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

	{#if prompt}
		<div
			class="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex items-end justify-center px-4 sm:justify-end sm:px-8"
		>
			<div
				class="pointer-events-auto flex animate-fade-in items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/85 p-3 shadow-2xl backdrop-blur-md"
			>
				<div class="min-w-0">
					<p class="text-sm font-semibold text-white">
						Skip {SEGMENT_LABELS[prompt.type] ?? prompt.type}?
					</p>
					<p class="text-xs text-zinc-400">Auto-skipping in {countdown}s</p>
				</div>
				<button
					type="button"
					onclick={() => prompt && skipSegment(prompt)}
					class="rounded-xl bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-700)] active:scale-[0.98]"
				>
					Skip
				</button>
				<button
					type="button"
					onclick={dismissSegment}
					class="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-white active:scale-[0.98]"
				>
					Keep watching
				</button>
			</div>
		</div>
	{/if}
</div>

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

	/* ---------- Frosted-glass panels for the settings/captions menus ---------- */
	/* Menus are portaled to document.body, so these can't be scoped to media-player */
	:global(.vds-menu-items) {
		--media-menu-bg: var(--menu-bg);
		--media-menu-border: var(--menu-border);
		--media-menu-border-radius: 12px;
		--media-menu-box-shadow: 0 12px 40px rgb(0 0 0 / 0.5);
		--media-menu-section-bg: var(--menu-section-bg);
		--media-menu-top-bar-bg: var(--menu-top-bar-bg);
		--media-menu-item-hover-bg: rgb(255 255 255 / 0.08);
		--media-menu-slider-track-fill-bg: var(--accent-600);
		/* Idle `will-change` keeps the panel on a permanent compositor layer; when a
		   submenu opens, its backdrop-filter + the animated height render inside that
		   layer and Chromium drops painting of the menu items (blank panel). Let the
		   layer be created on demand instead. */
		will-change: auto;
	}

	/* Slider thumb, track sizing and accent colors */
	:global(media-player .vds-time-slider),
	:global(media-player .vds-volume-slider) {
		--media-slider-track-height: 4px;
		--media-slider-track-fill-bg: var(--accent-600);
		--media-slider-track-progress-bg: color-mix(in srgb, var(--accent-600) 40%, transparent);
		--media-slider-thumb-bg: var(--accent-400);
		--media-slider-focused-thumb-shadow: 0 0 0 4px var(--accent-ring);
	}

	:global(media-player .vds-volume-slider) {
		--media-slider-thumb-size: 12px;
	}

	/* Fill brightens while hovering or dragging */
	:global(media-player .vds-slider:hover .vds-slider-track-fill),
	:global(media-player .vds-slider[data-active] .vds-slider-track-fill) {
		background-color: var(--accent-500);
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

	/* Captions must be a full-bleed overlay centered under the video */
	:global(media-player .vds-captions) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
	}

	:global(media-player .vds-captions [data-part='cue-display']) {
		text-align: center;
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
