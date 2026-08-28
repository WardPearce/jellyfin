<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { searchItems, BaseItemKind } from '$lib/jellyfin';
	import {
		seerrSearch,
		SeerrError,
		getResultState,
		isMovieOrTvResult,
		isTvResult
	} from '$lib/seerr';
	import type { SeerrSearchResult } from '$lib/seerr';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Search } from '@lucide/svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

	const auth = getAuth();

	let inputEl = $state<HTMLInputElement>();
	let query = $state(page.url.searchParams.get('q') ?? '');
	let loading = $state(false);
	let results = $state<Record<string, BaseItemDto[]>>({});
	let seerrResults = $state<SeerrSearchResult[]>([]);
	let seerrLoading = $state(false);
	let seerrError = $state('');

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
			seerrResults = [];
			seerrLoading = false;
			seerrError = '';
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
		seerrResults = [];
		seerrError = '';
		let newResults: Record<string, BaseItemDto[]> = {};
		try {
			const categoryPromises = categories.map(async (cat) => {
				const data = await searchItems(auth.user!.Id!, searchTerm, {
					includeItemTypes: [cat.kind],
					limit: 20
				});
				return { key: cat.key, items: data.Items ?? [] };
			});

			const settled = await Promise.allSettled(categoryPromises);

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

		if (auth.isSeerrConnected) {
			void doSeerrSearch(searchTerm);
		}
	}

	function seerrAvailabilityRank(result: SeerrSearchResult): number {
		switch (getResultState(result)) {
			case 'available':
				return 0;
			case 'requested':
				return 1;
			default:
				return 2;
		}
	}

	async function doSeerrSearch(searchTerm: string) {
		const base = auth.seerrUrl;
		if (!base) return;
		seerrLoading = true;
		seerrError = '';
		seerrResults = [];
		try {
			const data = await seerrSearch(base, searchTerm, 'en', auth.seerrApiKey);
			const seen = new SvelteSet<number>();
			const items = (data.results ?? [])
				.filter(isMovieOrTvResult)
				.filter((result) => {
					if (result.id === undefined) return false;
					if (seen.has(result.id)) return false;
					seen.add(result.id);
					return true;
				})
				.sort((a, b) => seerrAvailabilityRank(a) - seerrAvailabilityRank(b))
				.slice(0, 12);
			seerrResults = items;
		} catch (e: unknown) {
			seerrError = e instanceof SeerrError ? e.message : 'Unable to reach Seerr';
		} finally {
			seerrLoading = false;
		}
	}

	const hasResults = $derived(Object.keys(results).length > 0);

	const seerrMovies = $derived(
		seerrResults.filter((result) => !isTvResult(result) && getResultState(result) !== 'available')
	);
	const seerrTv = $derived(
		seerrResults.filter((result) => isTvResult(result) && getResultState(result) !== 'available')
	);

	const hasSeerrResults = $derived(seerrMovies.length > 0 || seerrTv.length > 0);

	function seerrForCategory(catKey: string): SeerrSearchResult[] {
		if (catKey === 'movies') return seerrMovies;
		if (catKey === 'series') return seerrTv;
		return [];
	}

	const totalResults = $derived(
		Object.values(results).reduce((sum, items) => sum + items.length, 0) +
			seerrMovies.length +
			seerrTv.length
	);

	$effect(() => {
		const q = page.url.searchParams.get('q');
		query = q ?? '';
		if (q) {
			void doSearch(q);
		}
	});
</script>

<svelte:head>
	<title>Search - Jellyfin</title>
</svelte:head>

<div class="space-y-8 px-4 pt-24 lg:px-6">
	<div class="mx-auto max-w-2xl">
		<div class="group relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-100"
			/>
			<input
				bind:this={inputEl}
				type="text"
				value={query}
				oninput={onInput}
				placeholder="Search movies, shows, music..."
				class="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pr-24 pl-12 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 placeholder:text-zinc-500 focus:border-[var(--accent-500)] focus:bg-white/[0.07] focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none"
			/>
			<kbd
				class="absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-medium text-zinc-400 sm:inline-block"
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
	{:else}
		{#if hasResults || hasSeerrResults || seerrError}
			{#if hasResults || hasSeerrResults}
				<div class="mx-auto max-w-2xl">
					<p class="text-sm text-zinc-400">
						<span class="font-semibold text-white">{totalResults}</span>
						{totalResults === 1 ? 'result' : 'results'} for “{query.trim()}”
					</p>
				</div>
			{/if}

			{#if seerrError}
				<div class="mx-auto max-w-2xl">
					<div
						class="rounded-xl border border-amber-800/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-300"
					>
						<p class="mb-1 font-medium">Seerr is having trouble</p>
						<p>{seerrError}</p>
						{#if auth.seerrUrl}
							<p class="mt-1.5">
								<button
									type="button"
									onclick={() => window.open(auth.seerrUrl!, '_blank', 'noopener')}
									class="underline underline-offset-4 hover:text-amber-100"
								>
									Sign in to Seerr
								</button>
								to enable requesting.
							</p>
						{/if}
					</div>
				</div>
			{/if}

			{#each categories as cat (cat.key)}
				{@const seerrItems = seerrForCategory(cat.key)}
				{#if (results[cat.key]?.length ?? 0) > 0 || seerrItems.length > 0}
					<section class="space-y-4">
						<SectionHeader title={cat.label}></SectionHeader>

						<MediaGrid
							items={results[cat.key] ?? []}
							{seerrItems}
							layout="list"
							aspectRatio={cat.key === 'movies' ||
							cat.key === 'boxSets' ||
							cat.key === 'musicVideos'
								? 'portrait'
								: cat.key === 'episodes' || cat.key === 'audio'
									? 'square'
									: 'portrait'}
							prefix="search-{cat.key}"
						/>
					</section>
				{/if}
			{/each}
		{:else}
			{#if seerrLoading}
				<Spinner size="lg" />
			{:else}
				<EmptyState
					icon="search"
					title="No results found"
					description={auth.isSeerrConnected
						? `Nothing matched “${query.trim()}” in your library or on Seerr. Try a different search term.`
						: `Nothing matched “${query.trim()}”. Try a different search term.`}
				/>
			{/if}
		{/if}
	{/if}
</div>
