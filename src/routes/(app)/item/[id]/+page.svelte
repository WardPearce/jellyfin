<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { getItem, getSeasons, getEpisodes } from '$lib/jellyfin/api';
	import { getBackdropUrls } from '$lib/jellyfin/client';
	import ItemHeader from '$lib/components/ItemHeader.svelte';
	import CastList from '$lib/components/CastList.svelte';
	import EpisodeList from '$lib/components/EpisodeList.svelte';
	import MediaCard from '$lib/components/MediaCard.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ArrowLeft } from '@lucide/svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
	import type { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';

	const auth = getAuth();

	let item = $state<BaseItemDto | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let backdropUrl = $state('');

	let seasons = $state<BaseItemDto[]>([]);
	let loadingSeasons = $state(false);
	let episodes = $state<BaseItemDto[]>([]);
	let loadingEpisodes = $state(false);
	let seriesItem = $state<BaseItemDto | null>(null);

	const crewTypes = ['Director', 'Writer', 'Producer'];

	const castPeople = $derived.by(() => {
		const own = item?.People ?? [];
		const series = seriesItem?.People ?? [];
		const seen = new Set(own.map((p) => p.Id).filter(Boolean));
		return [...own, ...series.filter((p) => !(p.Id && seen.has(p.Id)))];
	});

	const cast = $derived(
		castPeople
			.filter(
				(p) =>
					p.Type === ('Actor' as PersonKind) || (p.Role && !crewTypes.includes(p.Type as string))
			)
			.slice(0, 24)
	);

	const directors = $derived(
		(item?.People ?? []).filter((p) => p.Type === ('Director' as PersonKind))
	);
	const writers = $derived((item?.People ?? []).filter((p) => p.Type === ('Writer' as PersonKind)));
	const producers = $derived(
		(item?.People ?? []).filter((p) => p.Type === ('Producer' as PersonKind))
	);

	const hasCrew = $derived(directors.length > 0 || writers.length > 0 || producers.length > 0);
	const isSeries = $derived(item?.Type === 'Series');
	const isSeason = $derived(item?.Type === 'Season');
	const isEpisode = $derived(!!item?.SeriesId);

	const singleSeason = $derived(isSeries && seasons.length === 1 ? seasons[0] : null);
	const showingEpisodes = $derived(isSeason || singleSeason !== null);

	const showSeasonsGrid = $derived(isSeries && !singleSeason && seasons.length > 0);

	function crewJobLabel(people: BaseItemPerson[]): string {
		return people.map((p) => p.Name ?? 'Unknown').join(', ');
	}

	$effect(() => {
		const itemId = page.params.id;
		if (!itemId) return;

		loading = true;
		error = null;
		item = null;
		seriesItem = null;
		backdropUrl = '';
		seasons = [];
		episodes = [];

		(async () => {
			try {
				const fetchedItem = await getItem(itemId, auth.user?.Id);
				item = fetchedItem;

				const backdrops = getBackdropUrls(fetchedItem ?? {}, { maxWidth: 1920, quality: 90 });
				if (backdrops.length > 0) {
					backdropUrl = backdrops[0];
				}

				if (fetchedItem?.Type === 'Series' && fetchedItem.Id) {
					loadingSeasons = true;
					try {
						const fetchedSeasons = await getSeasons(fetchedItem.Id, auth.user?.Id);
						seasons = fetchedSeasons;

						const onlySeason = fetchedSeasons.length === 1 ? fetchedSeasons[0] : null;
						if (onlySeason) {
							loadingEpisodes = true;
							try {
								episodes = await getEpisodes(
									fetchedItem.Id,
									auth.user?.Id,
									onlySeason.Id,
									onlySeason.IndexNumber ?? undefined
								);
							} finally {
								loadingEpisodes = false;
							}
						}
					} finally {
						loadingSeasons = false;
					}
				}

				if (fetchedItem?.Type === 'Season' && fetchedItem.SeriesId && fetchedItem.Id) {
					loadingEpisodes = true;
					try {
						episodes = await getEpisodes(
							fetchedItem.SeriesId,
							auth.user?.Id,
							fetchedItem.Id,
							fetchedItem.IndexNumber ?? undefined
						);
					} finally {
						loadingEpisodes = false;
					}
				}

				if (fetchedItem?.Type === 'Episode' && fetchedItem.SeriesId) {
					try {
						seriesItem = await getItem(fetchedItem.SeriesId, auth.user?.Id);
					} catch {
						// Episode itself carries People as a fallback, so a missing
						// series lookup should not fail the whole page.
					}
				}
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load item';
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>{item?.Name ?? 'Item'} - Jellyfin</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<Spinner size="lg" />
	</div>
{:else if error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center text-red-400">{error}</div>
	</div>
{:else if item}
	<div class="relative min-h-screen">
		<div class="mx-auto max-w-6xl space-y-12 px-4 pt-24 pb-16 lg:px-6">
			{#if isEpisode}
				<div>
					<a
						href={item.SeriesId ? resolve(`/item/${item.SeriesId}`) : undefined}
						class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur-md transition-all hover:border-white/20 hover:text-white"
					>
						<ArrowLeft class="h-4 w-4" />
						{item.SeriesName ?? 'Back to series'}
					</a>
				</div>
			{/if}

			<ItemHeader {item} {backdropUrl} />

			{#if hasCrew || item.Studios?.length}
				<section class="space-y-4">
					<SectionHeader title="Details" />
					<div
						class="grid gap-x-8 gap-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4"
					>
						{#if directors.length > 0}
							<div class="min-w-0">
								<p class="text-xs text-zinc-500">
									{directors.length === 1 ? 'Director' : 'Directors'}
								</p>
								<p class="truncate text-sm text-zinc-200">{crewJobLabel(directors)}</p>
							</div>
						{/if}
						{#if writers.length > 0}
							<div class="min-w-0">
								<p class="text-xs text-zinc-500">
									{writers.length === 1 ? 'Writer' : 'Writers'}
								</p>
								<p class="truncate text-sm text-zinc-200">{crewJobLabel(writers)}</p>
							</div>
						{/if}
						{#if producers.length > 0}
							<div class="min-w-0">
								<p class="text-xs text-zinc-500">
									{producers.length === 1 ? 'Producer' : 'Producers'}
								</p>
								<p class="truncate text-sm text-zinc-200">{crewJobLabel(producers)}</p>
							</div>
						{/if}
						{#if item.Studios?.length}
							<div class="min-w-0">
								<p class="text-xs text-zinc-500">Studios</p>
								<p class="truncate text-sm text-zinc-200">
									{item.Studios.map((s) => s.Name).join(', ')}
								</p>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			{#if isSeries && !singleSeason && loadingSeasons}
				<section class="space-y-4">
					<SectionHeader title="Seasons" />
					<Spinner />
				</section>
			{:else if showSeasonsGrid}
				<section class="space-y-5">
					<SectionHeader title="Seasons" />
					<div
						class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
					>
						{#each seasons as season (season.Id ?? season.Name)}
							<MediaCard
								item={season}
								href={season.Id ? resolve(`/item/${season.Id}`) : undefined}
								aspectRatio="portrait"
							/>
						{/each}
					</div>
				</section>
			{/if}

			{#if showingEpisodes && loadingEpisodes}
				<section class="space-y-4">
					<SectionHeader title="Episodes" />
					<Spinner />
				</section>
			{:else if showingEpisodes && episodes.length > 0}
				<section class="space-y-5">
					<SectionHeader title="Episodes">
						{#snippet action()}
							<span class="text-xs text-zinc-500">{episodes.length} total</span>
						{/snippet}
					</SectionHeader>
					<EpisodeList items={episodes} />
				</section>
			{/if}

			{#if cast.length > 0}
				<section class="space-y-5">
					<SectionHeader title="Cast" />
					<CastList people={cast} />
				</section>
			{/if}
		</div>
	</div>
{/if}
