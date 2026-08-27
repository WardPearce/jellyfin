<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { getLibraryImageUrl } from '$lib/jellyfin/client';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { page } from '$app/state';
	import { InfiniteLoader, LoaderState } from 'svelte-infinite';

	const auth = getAuth();
	const media = getMedia();
	const loaderState = new LoaderState();

	let libraryName = $derived(
		media.libraries.find((l) => l.Id === page.params.id)?.Name ?? 'Library'
	);

	const headerImage = $derived.by(() => {
		const lib = media.libraries.find((l) => l.Id === page.params.id);
		if (!lib?.Id) return undefined;
		if (lib.ImageTags?.['Banner']) {
			return getLibraryImageUrl(lib.Id, 'Banner', { maxWidth: 1600 });
		}
		if (lib.ImageTags?.['Thumb']) {
			return getLibraryImageUrl(lib.Id, 'Thumb', { maxWidth: 1600 });
		}
		if (lib.ImageTags?.['Primary']) {
			return getLibraryImageUrl(lib.Id, 'Primary', { maxWidth: 1600 });
		}
		return undefined;
	});

	$effect(() => {
		const libId = page.params.id;
		if (auth.user?.Id && libId) {
			media.loadLibraryItems(auth.user.Id, libId);
		}
	});

	$effect(() => {
		return () => {
			media.clearLibraryItems();
		};
	});

	async function loadMore() {
		if (!auth.user?.Id) return;
		await media.loadMoreLibraryItems(auth.user.Id);
		if (!media.hasMore) {
			loaderState.complete();
		}
	}
</script>

<svelte:head>
	<title>{libraryName} - Jellyfin</title>
</svelte:head>

<div class="relative">
	{#if headerImage}
		<div class="pointer-events-none absolute inset-x-0 top-0 h-72">
			<img src={headerImage} alt="" class="h-full w-full object-cover object-top" />
			<div
				class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-zinc-950/70 via-transparent to-transparent"
			></div>
		</div>
	{/if}

	<div class="relative space-y-8 px-4 pt-4 lg:px-6">
		<div class="pt-16 sm:pt-24">
			<p class="text-xs font-semibold tracking-[0.18em] text-[var(--accent-400)] uppercase">
				Library
			</p>
			<h1 class="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
				{libraryName}
			</h1>
		</div>

		{#if media.loading}
			<div class="flex min-h-[40vh] items-center justify-center">
				<Spinner size="lg" />
			</div>
		{:else}
			<InfiniteLoader {loaderState} triggerLoad={loadMore}>
				<MediaGrid items={media.libraryItems} aspectRatio="portrait" />

				{#snippet loading()}
					<div class="flex justify-center py-4">
						<Spinner size="md" />
					</div>
				{/snippet}

				{#snippet noData()}
					{#if media.libraryItems.length > 0}
						<div class="py-4 text-center text-sm text-zinc-500">All items loaded</div>
					{/if}
				{/snippet}
			</InfiniteLoader>
		{/if}
	</div>
</div>
