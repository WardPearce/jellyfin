<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { getItem, getSeasons, getEpisodes } from '$lib/jellyfin/api';
	import { getItemImageUrl, getBackdropUrls } from '$lib/jellyfin/client';
	import Image from '$lib/components/ui/Image.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import EpisodeList from '$lib/components/EpisodeList.svelte';
	import MediaCard from '$lib/components/MediaCard.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
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

	const cast = $derived(
		(item?.People ?? []).filter((p) => p.Type === ('Actor' as PersonKind)).slice(0, 12)
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

	$effect(() => {
		const itemId = page.params.id;
		if (!itemId) return;

		loading = true;
		error = null;
		item = null;
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
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load item';
			} finally {
				loading = false;
			}
		})();
	});

	function formatRuntime(ticks?: number | null): string {
		if (!ticks) return '';
		const minutes = Math.round(ticks / 10_000_000 / 60);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function formatCriticRating(rating?: number | null): string {
		if (!rating) return '';
		return `${Math.round(rating)}%`;
	}

	function personImageUrl(person: BaseItemPerson): string | undefined {
		if (!person.Id) return undefined;
		return getItemImageUrl(person.Id, 'Primary', { maxWidth: 120 });
	}

	function crewJobLabel(people: BaseItemPerson[]): string {
		return people.map((p) => p.Name ?? 'Unknown').join(', ');
	}
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
		{#if backdropUrl}
			<div class="pointer-events-none absolute inset-x-0 top-0 h-[36rem]">
				<img
					src={backdropUrl}
					alt=""
					class="h-full w-full animate-ken-burns object-cover object-top"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20"
				></div>
				<div
					class="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent"
				></div>
			</div>
		{/if}

		<div class="relative z-10 space-y-12 px-4 pt-24 lg:px-6">
			{#if isEpisode}
				<div>
					<a
						href={item.SeriesId ? resolve(`/item/${item.SeriesId}`) : undefined}
						class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur-md transition-all hover:border-white/20 hover:text-white"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
							/>
						</svg>
						{item.SeriesName ?? 'Back to series'}
					</a>
				</div>
			{/if}

			<div class="flex flex-col gap-8 lg:flex-row">
				<div class="flex-shrink-0">
					<div
						class="w-48 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50 transition-transform duration-300 hover:scale-[1.03] sm:w-56 lg:w-64"
					>
						<Image
							src={getItemImageUrl(item.Id!, 'Primary', { maxWidth: 300 })}
							alt={item.Name ?? ''}
							class="bg-gradient-to-br from-zinc-800 to-zinc-900"
							aspectRatio="2/3"
						/>
					</div>
				</div>

				<div class="flex-1 space-y-5 pt-2">
					<div class="space-y-3">
						<h1 class="text-4xl font-bold tracking-tight text-white lg:text-5xl">{item.Name}</h1>

						{#if item.Taglines?.length}
							<p class="text-lg text-zinc-300 italic">“{item.Taglines[0]}”</p>
						{/if}

						<div class="flex flex-wrap items-center gap-2.5 text-base text-zinc-300">
							{#if item.ProductionYear}
								<span>{item.ProductionYear}</span>
							{/if}
							{#if item.RunTimeTicks}
								<span>{formatRuntime(item.RunTimeTicks)}</span>
							{/if}
							{#if item.OfficialRating}
								<Chip variant="outline">{item.OfficialRating}</Chip>
							{/if}
							{#if item.CommunityRating}
								<span class="flex items-center gap-1 text-lg font-medium text-amber-400">
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										/>
									</svg>
									{item.CommunityRating.toFixed(1)}
								</span>
							{/if}
							{#if item.CriticRating}
								<span
									class="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium {item.CriticRating >=
									60
										? 'bg-red-500/15 text-red-400'
										: 'bg-emerald-500/15 text-emerald-400'}"
								>
									<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
									</svg>
									{formatCriticRating(item.CriticRating)}
								</span>
							{/if}
						</div>
					</div>

					{#if item.Genres?.length}
						<div class="flex flex-wrap gap-2">
							{#each item.Genres as genre (genre)}
								<Chip>{genre}</Chip>
							{/each}
						</div>
					{/if}

					{#if hasCrew}
						<div class="space-y-1.5 text-sm">
							{#if directors.length > 0}
								<div>
									<span class="text-zinc-500">
										{directors.length === 1 ? 'Director' : 'Directors'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(directors)}</span>
								</div>
							{/if}
							{#if writers.length > 0}
								<div>
									<span class="text-zinc-500">
										{writers.length === 1 ? 'Writer' : 'Writers'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(writers)}</span>
								</div>
							{/if}
							{#if producers.length > 0}
								<div>
									<span class="text-zinc-500">
										{producers.length === 1 ? 'Producer' : 'Producers'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(producers)}</span>
								</div>
							{/if}
							{#if item.Studios?.length}
								<div>
									<span class="text-zinc-500">Studios:</span>
									<span class="text-zinc-200">{item.Studios.map((s) => s.Name).join(', ')}</span>
								</div>
							{/if}
						</div>
					{:else if item.Studios?.length}
						<p class="text-sm text-zinc-300">
							{item.Studios.map((s) => s.Name).join(', ')}
						</p>
					{/if}

					{#if item.Overview}
						<div class="max-w-3xl space-y-2">
							<h3 class="text-lg font-semibold text-white">About</h3>
							<p class="text-sm leading-relaxed text-zinc-300">{item.Overview}</p>
							{#if item.OriginalTitle && item.OriginalTitle !== item.Name}
								<p class="text-xs text-zinc-500">
									Original title: <span class="text-zinc-200">{item.OriginalTitle}</span>
								</p>
							{/if}
							{#if item.ProductionLocations?.length}
								<p class="text-xs text-zinc-500">
									Countries: <span class="text-zinc-200">{item.ProductionLocations.join(', ')}</span
									>
								</p>
							{/if}
						</div>
					{/if}

					<div class="flex flex-wrap gap-3 pt-2">
						<Button href={resolve(`/watch/${item.Id ?? ''}`)} size="lg">
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clip-rule="evenodd"
								/>
							</svg>
							Play
						</Button>
						{#if item.Type !== 'Series'}
							<Button variant="outline" href={resolve(`/watch/${item.Id ?? ''}`)} size="lg">
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
								Trailer
							</Button>
						{/if}
					</div>
				</div>
			</div>

			{#if isSeries && !singleSeason && loadingSeasons}
				<section class="space-y-4">
					<SectionHeader title="Seasons" />
					<Spinner />
				</section>
			{:else if isSeries && !singleSeason && seasons.length > 0}
				<section class="space-y-5">
					<SectionHeader title="Seasons" />
					<div
						class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
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
					<div class="flex gap-3 overflow-x-auto pb-4">
						{#each cast as person (person.Id ?? person.Name)}
							<a
								href={person.Id ? resolve(`/item/${person.Id}`) : undefined}
								class="group flex w-32 flex-shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
							>
								<div class="transition-transform duration-200 group-hover:scale-105">
									<Avatar src={personImageUrl(person)} alt={person.Name ?? ''} class="h-20 w-20" />
								</div>
								<div class="w-full text-center">
									<p class="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
										{person.Name}
									</p>
									{#if person.Role}
										<p class="truncate text-xs text-zinc-500">{person.Role}</p>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
{/if}
