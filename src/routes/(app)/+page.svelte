<script lang="ts">
	import { getAuth, getMedia, getSettings } from '$lib/state/index.svelte';
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { onMount } from 'svelte';

	const auth = getAuth();
	const media = getMedia();
	const settings = getSettings();

	const heroItems = $derived([...media.continueWatching, ...media.recentlyAdded]);

	const combinedResumeNext = $derived.by(() => {
		if (!settings.home.combineResumeNext) return [];
		const watchedSeries = new Set(media.continueWatching.map((item) => item.SeriesId ?? item.Id));
		return [
			...media.continueWatching,
			...media.nextUp.filter((item) => !watchedSeries.has(item.SeriesId ?? item.Id))
		];
	});

	const isEmpty = $derived(
		media.continueWatching.length === 0 &&
			media.nextUp.length === 0 &&
			media.recentlyAddedMovies.length === 0 &&
			media.recentlyAddedTv.length === 0
	);

	onMount(async () => {
		if (auth.user?.Id) {
			await Promise.all([media.loadLibraries(auth.user.Id), media.loadHomePage(auth.user.Id)]);
		}
	});
</script>

<svelte:head>
	<title>Home - Jellyfin</title>
</svelte:head>

<div class="space-y-12 px-4 pt-24 lg:px-6">
	{#if media.loading}
		<div class="flex min-h-[60vh] items-center justify-center">
			<Spinner size="lg" />
		</div>
	{:else}
		{#if heroItems.length > 0}
			<HeroBanner items={heroItems} />
		{/if}

		{#if isEmpty}
			<EmptyState
				title="No media yet"
				description="Add some movies or shows to your Jellyfin server to get started."
			/>
		{/if}

		{#if settings.home.combineResumeNext}
			{#if combinedResumeNext.length > 0}
				<section class="space-y-4">
					<SectionHeader title="Continue Watching" level="muted">
					</SectionHeader>
					<MediaGrid
						items={combinedResumeNext}
						layout="row"
						aspectRatio="square"
						prefix="crn"
						linkTarget="watch"
					/>
				</section>
			{/if}
		{:else}
			{#if media.continueWatching.length > 0}
				<section class="space-y-4">
					<SectionHeader title="Continue Watching" level="muted">
					</SectionHeader>
					<MediaGrid
						items={media.continueWatching}
						layout="row"
						aspectRatio="square"
						prefix="cw"
						linkTarget="watch"
					/>
				</section>
			{/if}

			{#if media.nextUp.length > 0}
				<section class="space-y-4">
					<SectionHeader title="Next Up" level="muted" />
					<MediaGrid
						items={media.nextUp}
						layout="row"
						aspectRatio="square"
						prefix="nu"
						linkTarget="watch"
					/>
				</section>
			{/if}
		{/if}

		{#if media.recentlyAddedMovies.length > 0}
			<section class="space-y-4">
				<SectionHeader title="Recently Added Movies" level="muted" />
				<MediaGrid
					items={media.recentlyAddedMovies}
					layout="row"
					aspectRatio="portrait"
					prefix="ram"
				/>
			</section>
		{/if}

		{#if media.recentlyAddedTv.length > 0}
			<section class="space-y-4">
				<SectionHeader title="Recently Added TV Shows" level="muted" />
				<MediaGrid
					items={media.recentlyAddedTv}
					layout="row"
					aspectRatio="portrait"
					prefix="ratv"
				/>
			</section>
		{/if}
	{/if}
</div>
