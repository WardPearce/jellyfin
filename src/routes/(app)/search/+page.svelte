<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { searchItems, BaseItemKind } from '$lib/jellyfin';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

	const auth = getAuth();

	let query = $state(page.url.searchParams.get('q') ?? '');
	let loading = $state(false);
	let results = $state<Record<string, BaseItemDto[]>>({});

	const categories: { key: string; label: string; kind: BaseItemKind }[] = [
		{ key: 'movies', label: 'Movies', kind: BaseItemKind.Movie },
		{ key: 'series', label: 'TV Shows', kind: BaseItemKind.Series },
		{ key: 'episodes', label: 'Episodes', kind: BaseItemKind.Episode },
		{ key: 'audio', label: 'Music', kind: BaseItemKind.Audio },
		{ key: 'musicVideos', label: 'Music Videos', kind: BaseItemKind.MusicVideo },
		{ key: 'boxSets', label: 'Collections', kind: BaseItemKind.BoxSet }
	];

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function onInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		query = val;

		if (debounceTimer) clearTimeout(debounceTimer);

		const trimmed = val.trim();
		if (!trimmed) {
			results = {};
			updateUrl('');
			return;
		}

		debounceTimer = setTimeout(() => {
			updateUrl(trimmed);
			doSearch(trimmed);
		}, 300);
	}

	function updateUrl(q: string) {
		const searchPath = resolve('/search');
		const url = q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath;
		window.history.replaceState({}, '', url);
	}

	async function doSearch(searchTerm: string) {
		if (!auth.user?.Id) return;
		loading = true;
		try {
			const categoryPromises = categories.map(async (cat) => {
				const data = await searchItems(auth.user!.Id!, searchTerm, {
					includeItemTypes: [cat.kind],
					limit: 20
				});
				return { key: cat.key, items: data.Items ?? [] };
			});

			const settled = await Promise.allSettled(categoryPromises);
			const newResults: Record<string, BaseItemDto[]> = {};

			for (const result of settled) {
				if (result.status === 'fulfilled' && result.value.items.length > 0) {
					newResults[result.value.key] = result.value.items;
				}
			}

			results = newResults;
		} catch {
			results = {};
		} finally {
			loading = false;
		}
	}

	const hasResults = $derived(Object.keys(results).length > 0);

	$effect(() => {
		const q = untrack(() => page.url.searchParams.get('q'));
		if (q && q !== query) {
			query = q;
			doSearch(q);
		}
	});
</script>

<svelte:head>
	<title>Search - Jellyfin</title>
</svelte:head>

<div class="space-y-6 px-4 pt-4 lg:px-6">
	<div class="mx-auto max-w-2xl">
		<div class="relative">
			<svg
				class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
			<input
				type="text"
				value={query}
				oninput={onInput}
				placeholder="Search movies, shows, music..."
				class="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pr-4 pl-12 text-zinc-100 placeholder-zinc-500 transition-colors outline-none focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)]"
			/>
		</div>
	</div>

	{#if loading}
		<Spinner size="lg" />
	{:else if !query.trim()}
		<div class="flex flex-col items-center justify-center py-24">
			<svg class="h-16 w-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
			<h2 class="mt-4 text-lg font-medium text-zinc-400">Search your library</h2>
			<p class="mt-1 text-sm text-zinc-500">Find movies, TV shows, music, and more.</p>
		</div>
	{:else if !hasResults}
		<div class="flex flex-col items-center justify-center py-24">
			<svg class="h-16 w-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1"
					d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 002.25 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
				/>
			</svg>
			<h2 class="mt-4 text-lg font-medium text-zinc-400">No results found</h2>
			<p class="mt-1 text-sm text-zinc-500">Try a different search term.</p>
		</div>
	{:else}
		{#each categories as cat (cat.key)}
			{#if results[cat.key] && results[cat.key].length > 0}
				<section>
					<h2 class="mb-4 text-xl font-semibold text-white">{cat.label}</h2>
					<MediaGrid
						items={results[cat.key]}
						layout="row"
						aspectRatio={cat.key === 'movies' || cat.key === 'boxSets' || cat.key === 'musicVideos'
							? 'portrait'
							: cat.key === 'episodes' || cat.key === 'audio'
								? 'square'
								: 'portrait'}
						prefix="search-{cat.key}"
					/>
				</section>
			{/if}
		{/each}
	{/if}
</div>
