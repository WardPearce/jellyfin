<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { page } from '$app/state';
	import { InfiniteLoader, LoaderState } from 'svelte-infinite';

	const auth = getAuth();
	const media = getMedia();
	const loaderState = new LoaderState();

	let libraryName = $state('');

	$effect(() => {
		const libId = page.params.id;
		if (auth.user?.Id && libId) {
			media.loadLibraryItems(auth.user.Id, libId);
			const lib = media.libraries.find((l) => l.Id === libId);
			libraryName = lib?.Name ?? 'Library';
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

<div class="space-y-6 px-4 pt-4 lg:px-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-white">{libraryName}</h1>
	</div>

	{#if media.loading}
		<Spinner size="lg" />
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
