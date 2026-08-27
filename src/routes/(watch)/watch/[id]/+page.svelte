<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import {
		getItem,
		getPlaybackInfo,
		getBestStreamUrl,
		getTrickplayStoryboard,
		getSubtitleTracks
	} from '$lib/jellyfin/api';
	import MediaPlayer from '$lib/components/MediaPlayer.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import type { ThumbnailSrc } from 'vidstack';

	const auth = getAuth();

	let item = $state<BaseItemDto | null>(null);
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
	let startTime = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		const itemId = page.params.id;
		if (!itemId) {
			error = 'No item ID provided';
			loading = false;
			return;
		}

		try {
			const [fetchedItem, playbackInfo] = await Promise.all([
				getItem(itemId, auth.user?.Id),
				getPlaybackInfo(itemId)
			]);

			item = fetchedItem;

			if (!fetchedItem) {
				error = 'Item not found';
				loading = false;
				return;
			}

			const mediaSource = playbackInfo.MediaSources?.[0];
			if (!mediaSource) {
				error = 'No media sources available';
				loading = false;
				return;
			}

			streamUrl = getBestStreamUrl(itemId, mediaSource);

			if (mediaSource.MediaStreams) {
				subtitleTracks = getSubtitleTracks(mediaSource.MediaStreams);
			}

			if (fetchedItem.Id && mediaSource.Id) {
				thumbnails = getTrickplayStoryboard(fetchedItem, mediaSource.Id);
			}

			if (fetchedItem.Id) {
				const { getItemImageUrl } = await import('$lib/jellyfin/client');
				posterUrl = getItemImageUrl(fetchedItem.Id, 'Primary', { maxWidth: 400 }) ?? '';
			}

			const resumeSeconds = (fetchedItem.UserData?.PlaybackPositionTicks ?? 0) / 10_000_000;
			if (resumeSeconds >= 5) {
				startTime = resumeSeconds;
			}
		} catch (e: unknown) {
			error = (e as Error)?.message ?? 'Failed to load media';
		} finally {
			loading = false;
		}
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
	<title>Watch {item?.Name ?? ''} - Jellyfin</title>
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
		<div class="h-screen w-full bg-black">
			<MediaPlayer
				src={streamUrl}
				poster={posterUrl}
				title={item?.Name ?? ''}
				subtitle={item?.Type === 'Episode' && item?.SeriesName
					? `${item.SeriesName} - S${item.ParentIndexNumber ?? '?'}E${item.IndexNumber ?? '?'}`
					: undefined}
				onBack={handleBack}
				subtitles={subtitleTracks}
				{thumbnails}
				{startTime}
			/>
		</div>
	{/if}
</div>
