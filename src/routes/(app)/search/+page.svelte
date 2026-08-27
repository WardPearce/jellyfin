<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { searchItems, BaseItemKind } from '$lib/jellyfin';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

	const auth = getAuth();

	let inputEl = $state<HTMLInputElement>();
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

	function isTyping(el: EventTarget | null) {
		const tag = (el as HTMLElement | null)?.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA';
	}

	onMount(() => {
		const onKeydown = (e: KeyboardEvent) => {
			if (e.key === '/' && !isTyping(e.target)) {
				e.preventDefault();
				inputEl?.focus();
			}
			if (e.key === 'Escape' && inputEl && document.activeElement === inputEl) {
				inputEl.blur();
			}
		};
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

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

	const totalResults = $derived(
		Object.values(results).reduce((sum, items) => sum + items.length, 0)
	);

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

<div class="space-y-8 px-4 pt-24 lg:px-6">
	<div class="mx-auto max-w-2xl">
		<div class="group relative">
			<svg
				class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[var(--accent-400)]"
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
				bind:this={inputEl}
				type="text"
				value={query}
				oninput={onInput}
				placeholder="Search movies, shows, music..."
				class="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pr-24 pl-12 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 placeholder:text-zinc-500 focus:border-[var(--accent-500)] focus:bg-white/[0.07] focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none"
			/>
			<kbd
				class="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-medium text-zinc-400 sm:inline-block"
			>
				/
			</kbd>
		</div>
	</div>

	{#if loading}
		<Spinner size="lg" />
	{:else if !query.trim()}
		<EmptyState
			icon="search"
			title="Search your library"
			description="Find movies, TV shows, music, and more. Press / to jump here."
		/>
	{:else if !hasResults}
		<EmptyState
			icon="search"
			title="No results found"
			description="Nothing matched “{query.trim()}”. Try a different search term."
		/>
	{:else}
		<div class="mx-auto max-w-2xl">
			<p class="text-sm text-zinc-400">
				<span class="font-semibold text-white">{totalResults}</span>
				{totalResults === 1 ? 'result' : 'results'} for “{query.trim()}”
			</p>
		</div>

		{#each categories as cat (cat.key)}
			{#if results[cat.key] && results[cat.key].length > 0}
				<section class="space-y-4">
					<SectionHeader title={cat.label}>
					</SectionHeader>
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
