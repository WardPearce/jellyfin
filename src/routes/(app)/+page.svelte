<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	const auth = getAuth();
	const media = getMedia();

	const heroItems = $derived([...media.continueWatching, ...media.recentlyAdded]);

	const homeLibraries = $derived(
		media.libraries.filter(
			(lib) => lib.CollectionType === 'movies' || lib.CollectionType === 'tvshows'
		)
	);

	const isEmpty = $derived(
		media.continueWatching.length === 0 &&
			media.nextUp.length === 0 &&
			media.recentlyAddedMovies.length === 0 &&
			media.recentlyAddedTv.length === 0
	);

	const collectionIcons: Record<string, string> = {
		movies:
			'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5',
		tvshows:
			'M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z'
	};

	function getIcon(type?: string | null): string {
		return collectionIcons[type ?? ''] ?? collectionIcons.movies;
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

		{#if homeLibraries.length > 0}
			<section>
				<SectionHeader title="Your Libraries" level="muted" className="mb-4" />
				<nav class="flex items-stretch gap-5 overflow-x-auto p-2" aria-label="Libraries">
					{#each homeLibraries as lib (lib.Id)}
						<a
							href={resolve(`/library/${lib.Id}`)}
							class="group flex h-44 w-72 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-br from-[color-mix(in_srgb,var(--accent-500)_45%,#27272a)] to-[color-mix(in_srgb,var(--accent-600)_30%,#18181b)] shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-xl hover:ring-2 hover:shadow-black/40 hover:ring-[var(--accent-500)] sm:h-52 sm:w-80"
						>
							<span
								class="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/25 text-white transition-colors duration-300 group-hover:bg-black/35"
							>
								<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d={getIcon(lib.CollectionType)}
									/>
								</svg>
							</span>
							<span class="text-lg font-semibold text-white">{lib.Name}</span>
						</a>
					{/each}
				</nav>
			</section>
		{/if}

		{#if media.continueWatching.length > 0}
			<section class="space-y-4">
				<SectionHeader title="Continue Watching" level="muted">
					{#snippet action()}
						<span class="text-xs text-zinc-500">Resume right where you left off</span>
					{/snippet}
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
