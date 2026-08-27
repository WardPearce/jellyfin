<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { getLibraryImageUrl } from '$lib/jellyfin/client';
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

	const auth = getAuth();
	const media = getMedia();

	const heroItems = $derived([...media.continueWatching, ...media.recentlyAdded]);

	const homeLibraries = $derived(
		media.libraries.filter(
			(lib) => lib.CollectionType === 'movies' || lib.CollectionType === 'tvshows'
		)
	);

	function getLibraryImage(lib: BaseItemDto): string | undefined {
		if (!lib.Id) return undefined;
		if (lib.ImageTags?.['Banner']) {
			return getLibraryImageUrl(lib.Id, 'Banner', { maxWidth: 400 });
		}
		if (lib.ImageTags?.['Primary']) {
			return getLibraryImageUrl(lib.Id, 'Primary', { maxWidth: 400 });
		}
		return undefined;
	}

	onMount(async () => {
		if (auth.user?.Id) {
			await Promise.all([media.loadLibraries(auth.user.Id), media.loadHomePage(auth.user.Id)]);
		}
	});
</script>

<svelte:head>
	<title>Home - Jellyfin</title>
</svelte:head>

<div class="space-y-6 px-4 pt-4 lg:px-6">
	{#if media.loading}
		<Spinner size="lg" />
	{:else}
		{#if heroItems.length > 0}
			<HeroBanner items={heroItems} />
		{/if}

		{#if homeLibraries.length > 0}
			<nav class="mt-4 flex gap-4 overflow-x-auto pb-1" aria-label="Libraries">
				{#each homeLibraries as lib (lib.Id)}
					<a
						href={resolve('/library/[id]', { id: lib.Id ?? '' })}
						class="group relative flex-shrink-0 overflow-hidden rounded-lg transition-all hover:ring-2 hover:ring-[var(--accent-500)]"
					>
						{#if getLibraryImage(lib)}
							<img
								src={getLibraryImage(lib)}
								alt={lib.Name ?? ''}
								class="h-40 w-64 object-cover sm:h-48 sm:w-80"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
							<span
								class="absolute bottom-3 left-4 text-base font-semibold text-white drop-shadow-lg"
							>
								{lib.Name}
							</span>
						{:else}
							<div class="flex h-40 w-64 items-center justify-center bg-zinc-800 sm:h-48 sm:w-80">
								<span class="text-base font-medium text-zinc-300">{lib.Name}</span>
							</div>
						{/if}
					</a>
				{/each}
			</nav>
		{/if}

		{#if media.continueWatching.length > 0}
			<section>
				<h2 class="mb-4 text-xl font-semibold text-white">Continue Watching</h2>
				<MediaGrid items={media.continueWatching} layout="row" aspectRatio="square" prefix="cw" />
			</section>
		{/if}

		{#if media.nextUp.length > 0}
			<section>
				<h2 class="mb-4 text-xl font-semibold text-white">Next Up</h2>
				<MediaGrid items={media.nextUp} layout="row" aspectRatio="square" prefix="nu" />
			</section>
		{/if}

		{#if media.recentlyAddedMovies.length > 0}
			<section>
				<h2 class="mb-4 text-xl font-semibold text-white">Recently Added Movies</h2>
				<MediaGrid
					items={media.recentlyAddedMovies}
					layout="row"
					aspectRatio="portrait"
					prefix="ram"
				/>
			</section>
		{/if}

		{#if media.recentlyAddedTv.length > 0}
			<section>
				<h2 class="mb-4 text-xl font-semibold text-white">Recently Added TV Shows</h2>
				<MediaGrid
					items={media.recentlyAddedTv}
					layout="row"
					aspectRatio="portrait"
					prefix="ratv"
				/>
			</section>
		{/if}

		{#if media.continueWatching.length === 0 && media.nextUp.length === 0 && media.recentlyAddedMovies.length === 0 && media.recentlyAddedTv.length === 0}
			<div class="flex flex-col items-center justify-center py-24">
				<svg class="h-16 w-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1"
						d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
				<h2 class="mt-4 text-lg font-medium text-zinc-400">No media yet</h2>
				<p class="mt-1 text-sm text-zinc-500">
					Add some movies or shows to your Jellyfin server to get started.
				</p>
			</div>
		{/if}
	{/if}
</div>
