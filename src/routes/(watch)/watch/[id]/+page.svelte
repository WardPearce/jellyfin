<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import {
		getItem,
		getPlaybackInfo,
		getBestStreamUrl,
		getTrickplayStoryboard,
		getSubtitleTracks,
		getMediaSegments,
		getNextUp,
		getEpisodes,
		reportPlaybackStart,
		reportPlaybackProgress,
		reportPlaybackStopped
	} from '$lib/jellyfin/api';
	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
	import type { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response';
	import type { ThumbnailSrc } from 'vidstack';
	import { SlidersHorizontal } from '@lucide/svelte';

	interface QualityOption {
		id: string;
		label: string;
		bitrate?: number;
		direct: boolean;
	}

	const auth = getAuth();

	let item = $state<BaseItemDto | null>(null);
	let playItem = $state<BaseItemDto | null>(null);
	let streamUrl = $state('');
	let posterUrl = $state('');
	let subtitleTracks = $state<
		Array<{
			src: string;
			label: string;
			language: string;
			kind: 'subtitles' | 'captions';
			type: 'vtt' | 'srt' | 'ass' | 'ssa';
			default: boolean;
		}>
	>([]);
	let thumbnails = $state<ThumbnailSrc>(null);
	let segments = $state<MediaSegmentDto[]>([]);
	let startTime = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let qualityOptions = $state<QualityOption[]>([]);
	let currentQualityId = $state('source');
	let qualityOpen = $state(false);
	let qualityKey = $state(0);
	let streaming = $state(false);

	let playSessionId: string | undefined;
	let lastPositionTicks = 0;
	let lastReportAt = 0;
	let lastPauseReportAt = 0;
	let hasStartedPlayback = false;

	async function findNextEpisode(series: BaseItemDto): Promise<BaseItemDto | null> {
		const userId = auth.user?.Id;
		if (!series.Id || !userId) return null;

		const nextUp = await getNextUp(userId, 20);
		const nextEpisode =
			nextUp.Items?.find((i) => i.SeriesId === series.Id && i.UserData && !i.UserData.Played) ??
			nextUp.Items?.find((i) => i.SeriesId === series.Id);
		if (nextEpisode) return nextEpisode;

		const episodes = await getEpisodes(series.Id, userId);
		return (
			episodes.find((e) => e.UserData && !e.UserData.Played) ??
			episodes.find((e) => e.Type === 'Episode') ??
			null
		);
	}

	async function resolvePlayableItem(raw: BaseItemDto): Promise<BaseItemDto> {
		const userId = auth.user?.Id;
		if (raw.Type === 'Series') {
			return (await findNextEpisode(raw)) ?? raw;
		}
		if (raw.Type === 'Season' && raw.SeriesId && raw.Id && userId) {
			const episodes = await getEpisodes(raw.SeriesId, userId, raw.Id);
			const next = episodes.find((e) => e.UserData && !e.UserData.Played) ?? episodes[0];
			return next ?? raw;
		}
		return raw;
	}

	function saveStopped() {
		if (!playItem?.Id || !hasStartedPlayback) return;
		hasStartedPlayback = false;
		reportPlaybackStopped(playItem.Id, lastPositionTicks, playSessionId).catch(() => {});
	}

	function handleEnded() {
		saveStopped();
		const userId = auth.user?.Id;
		if (playItem?.SeriesId && userId) {
			getNextUp(userId, 20)
				.then((result) => result.Items?.find((i) => i.SeriesId === playItem?.SeriesId))
				.then((next) => {
					if (next?.Id) goto(resolve(`/watch/${next.Id}`));
				})
				.catch(() => {});
		}
	}

	function buildQualityOptions(info: PlaybackInfoResponse): QualityOption[] {
		const mediaSource = info.MediaSources?.[0];
		if (!mediaSource) return [];

		const options: QualityOption[] = [{ id: 'source', label: 'Source', direct: true }];

		const canTranscode = !!mediaSource.SupportsTranscoding || !!mediaSource.TranscodingUrl;
		if (!canTranscode) return options;

		const video = mediaSource.MediaStreams?.find((stream) => stream.Type === 'Video');
		const sourceRes = video?.Height ?? 0;

		const tiers = [
			{ h: 1080, bitrate: 20_000_000, label: '1080p' },
			{ h: 720, bitrate: 8_000_000, label: '720p' },
			{ h: 480, bitrate: 4_000_000, label: '480p' },
			{ h: 360, bitrate: 1_500_000, label: '360p' },
			{ h: 240, bitrate: 1_000_000, label: '240p' }
		];

		for (const tier of tiers) {
			if (tier.h < sourceRes) {
				options.push({
					id: `trans-${tier.h}`,
					label: tier.label,
					bitrate: tier.bitrate,
					direct: false
				});
			}
		}

		return options;
	}

	async function selectQuality(option: QualityOption) {
		if (option.id === currentQualityId || !playItem?.Id || streaming) return;
		streaming = true;
		const positionTicks = lastPositionTicks;
		try {
			const info = await getPlaybackInfo(playItem.Id, {
				maxBitrate: option.bitrate,
				directPlay: option.direct,
				startPositionTicks: positionTicks
			});
			const mediaSource = info.MediaSources?.[0];
			if (mediaSource) {
				currentQualityId = option.id;
				streamUrl = getBestStreamUrl(playItem.Id, mediaSource);
				startTime = positionTicks / 10_000_000;
				qualityOpen = false;
				qualityKey += 1;
			}
		} catch {
			// Keep playing the current stream if a quality switch fails.
		} finally {
			streaming = false;
		}
	}

	function handleProgress(positionSeconds: number, playing: boolean) {
		if (!playItem?.Id) return;
		lastPositionTicks = Math.round(positionSeconds * 10_000_000);
		const now = Date.now();
		if (!playing) {
			if (now - lastPauseReportAt >= 15_000) {
				lastPauseReportAt = now;
				reportPlaybackProgress(playItem.Id, lastPositionTicks, {
					playSessionId,
					isPaused: true
				}).catch(() => {});
			}
		} else if (now - lastReportAt >= 60_000) {
			lastReportAt = now;
			reportPlaybackProgress(playItem.Id, lastPositionTicks, { playSessionId }).catch(() => {});
		}
	}

	function handleStart() {
		if (playItem?.Id) {
			hasStartedPlayback = true;
			reportPlaybackStart(playItem.Id, playSessionId).catch(() => {});
		}
	}

	onMount(() => {
		const itemId = page.params.id;
		if (!itemId) {
			error = 'No item ID provided';
			loading = false;
			return;
		}

		void (async () => {
			try {
				const fetchedItem = await getItem(itemId, auth.user?.Id);
				if (!fetchedItem) {
					error = 'Item not found';
					loading = false;
					return;
				}

				item = fetchedItem;
				const playable = await resolvePlayableItem(fetchedItem);
				playItem = playable;

				const [playbackInfo, mediaSegments] = await Promise.all([
					getPlaybackInfo(playable.Id ?? itemId),
					playable.Id ? getMediaSegments(playable.Id) : Promise.resolve([] as MediaSegmentDto[])
				]);

				playSessionId = playbackInfo.PlaySessionId ?? undefined;

				const mediaSource = playbackInfo.MediaSources?.[0];

				if (!playable.Id) {
					error = 'Item not found';
					loading = false;
					return;
				}

				if (!mediaSource) {
					error = 'No media sources available';
					loading = false;
					return;
				}

				streamUrl = getBestStreamUrl(playable.Id, mediaSource);
				qualityOptions = buildQualityOptions(playbackInfo);
				currentQualityId = 'source';

				if (mediaSource.MediaStreams) {
					subtitleTracks = getSubtitleTracks(mediaSource.MediaStreams);
				}

				if (playable.Id && mediaSource.Id) {
					thumbnails = getTrickplayStoryboard(playable, mediaSource.Id);
				}

				if (playable.Id) {
					const { getItemImageUrl } = await import('$lib/jellyfin/client');
					posterUrl = getItemImageUrl(playable.Id, 'Primary', { maxWidth: 400 }) ?? '';
				}

				segments = mediaSegments;

				const resumeSeconds = (playable.UserData?.PlaybackPositionTicks ?? 0) / 10_000_000;
				if (resumeSeconds >= 5) {
					startTime = resumeSeconds;
				}
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load media';
			} finally {
				loading = false;
			}
		})();

		const onBeforeUnload = () => saveStopped();
		window.addEventListener('beforeunload', onBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', onBeforeUnload);
			saveStopped();
		};
	});

	function handleBack() {
		if (item?.Id) {
			goto(resolve(`/item/${item.Id}`));
		} else {
			goto(resolve('/'));
		}
	}
</script>

<svelte:head>
	<title>Watch {playItem?.Name ?? item?.Name ?? ''} - Jellyfin</title>
</svelte:head>

<div class="page-enter flex flex-col">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<Spinner size="lg" />
		</div>
	{:else if error}
		<div class="flex min-h-screen flex-col items-center justify-center gap-4">
			<p class="text-red-400">{error}</p>
			<Button variant="outline" onclick={handleBack}>Go Back</Button>
		</div>
	{:else if streamUrl}
		<div class="relative h-screen w-full bg-black">
			{#key qualityKey}
				<MediaPlayer
					src={streamUrl}
					poster={posterUrl}
					title={playItem?.Name ?? item?.Name ?? ''}
					subtitle={playItem?.Type === 'Episode' && playItem?.SeriesName
						? `${playItem.SeriesName} - S${playItem.ParentIndexNumber ?? '?'}E${playItem.IndexNumber ?? '?'}`
						: undefined}
					onBack={handleBack}
					subtitles={subtitleTracks}
					{thumbnails}
					{startTime}
					{segments}
					onStart={handleStart}
					onProgress={handleProgress}
					onEnded={handleEnded}
				/>
			{/key}

			{#if qualityOptions.length > 1}
				<div class="absolute top-4 right-4 z-40">
					<button
						type="button"
						onclick={() => (qualityOpen = !qualityOpen)}
						class="flex items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-black/90"
					>
						<SlidersHorizontal class="h-4 w-4" />
						{currentQualityId === 'source'
							? 'Auto'
							: qualityOptions.find((o) => o.id === currentQualityId)?.label}
					</button>

					{#if qualityOpen}
						<div
							class="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-black/85 p-1.5 shadow-2xl backdrop-blur-xl"
						>
							{#each qualityOptions as option (option.id)}
								<button
									type="button"
									onclick={() => selectQuality(option)}
									disabled={streaming}
									class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors
										{option.id === currentQualityId
										? 'bg-white/10 font-medium text-white'
										: 'text-white/70 hover:bg-white/5 hover:text-white'} disabled:opacity-50"
								>
									<span>{option.label}</span>
									{#if option.id === currentQualityId}
										<span class="text-[var(--accent-400)]">&#10003;</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if streaming}
				<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
					<Spinner size="lg" />
				</div>
			{/if}
		</div>
	{/if}
</div>
