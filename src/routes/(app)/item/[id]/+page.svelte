<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { getItem, getSeasons, getEpisodes } from '$lib/jellyfin/api';
	import { getItemImageUrl, getBackdropUrls } from '$lib/jellyfin/client';
	import Image from '$lib/components/ui/Image.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
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
						seasons = await getSeasons(fetchedItem.Id, auth.user?.Id);
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

	function formatEpisodeNumber(episode: BaseItemDto): string {
		const s = String(episode.ParentIndexNumber ?? '?').padStart(2, '0');
		const e = String(episode.IndexNumber ?? '?').padStart(2, '0');
		return `S${s}E${e}`;
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
			<div class="pointer-events-none absolute inset-0">
				<img src={backdropUrl} alt="" class="h-full w-full object-cover object-top" />
				<div
					class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20"
				></div>
				<div
					class="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent"
				></div>
			</div>
		{/if}

		<div class="relative z-10 space-y-10 px-4 pt-24 lg:px-6">
			{#if isEpisode}
				<div>
					<a
						href={item.SeriesId ? resolve('/item/[id]', { id: item.SeriesId }) : undefined}
						class="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						{item.SeriesName ?? 'Back to series'}
					</a>
				</div>
			{/if}
			<div class="flex flex-col gap-8 lg:flex-row">
				<div class="flex-shrink-0">
					<div
						class="w-48 overflow-hidden rounded-xl shadow-2xl transition-transform duration-200 hover:scale-[1.03] sm:w-56 lg:w-64"
					>
						<Image
							src={getItemImageUrl(item.Id!, 'Primary', { maxWidth: 300 })}
							alt={item.Name ?? ''}
							class="bg-zinc-800"
							aspectRatio="2/3"
						/>
					</div>
				</div>

				<div class="flex-1 space-y-5 pt-2">
					<div class="space-y-3">
						<h1 class="text-4xl font-bold text-white lg:text-5xl">{item.Name}</h1>

						{#if item.Taglines?.length}
							<p class="text-lg text-zinc-300 italic">{item.Taglines[0]}</p>
						{/if}

						<div class="flex flex-wrap items-center gap-2.5 text-base text-zinc-300">
							{#if item.ProductionYear}
								<span>{item.ProductionYear}</span>
								<span class="text-zinc-600">|</span>
							{/if}
							{#if item.RunTimeTicks}
								<span>{formatRuntime(item.RunTimeTicks)}</span>
								<span class="text-zinc-600">|</span>
							{/if}
							{#if item.OfficialRating}
								<span class="rounded border border-zinc-600 px-2 py-0.5 text-sm text-zinc-300">
									{item.OfficialRating}
								</span>
							{/if}
							{#if item.CommunityRating}
								<span class="flex items-center gap-1 text-lg text-yellow-400">
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										/>
									</svg>
									{item.CommunityRating.toFixed(1)}
								</span>
								<span class="text-zinc-600">|</span>
							{/if}
							{#if item.CriticRating}
								<span class="flex items-center gap-1">
									{#if item.CriticRating >= 60}
										<svg class="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
											/>
										</svg>
									{:else}
										<svg class="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
											/>
										</svg>
									{/if}
									<span class="text-sm text-zinc-300">{formatCriticRating(item.CriticRating)}</span>
								</span>
							{/if}
						</div>
					</div>

					{#if item.Genres?.length}
						<div class="flex flex-wrap gap-2">
							{#each item.Genres as genre (genre)}
								<span class="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-200">
									{genre}
								</span>
							{/each}
						</div>
					{/if}

					{#if hasCrew}
						<div class="space-y-1 text-sm">
							{#if directors.length > 0}
								<div>
									<span class="text-zinc-400">
										{directors.length === 1 ? 'Director' : 'Directors'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(directors)}</span>
								</div>
							{/if}
							{#if writers.length > 0}
								<div>
									<span class="text-zinc-400">
										{writers.length === 1 ? 'Writer' : 'Writers'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(writers)}</span>
								</div>
							{/if}
							{#if producers.length > 0}
								<div>
									<span class="text-zinc-400">
										{producers.length === 1 ? 'Producer' : 'Producers'}:
									</span>
									<span class="text-zinc-200">{crewJobLabel(producers)}</span>
								</div>
							{/if}
							{#if item.Studios?.length}
								<div>
									<span class="text-zinc-400">Studios:</span>
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
								<p class="text-xs text-zinc-400">
									Original title: <span class="text-zinc-200">{item.OriginalTitle}</span>
								</p>
							{/if}
							{#if item.ProductionLocations?.length}
								<p class="text-xs text-zinc-400">
									Countries: <span class="text-zinc-200">{item.ProductionLocations.join(', ')}</span
									>
								</p>
							{/if}
						</div>
					{/if}

					<div class="flex gap-3 pt-2">
						<Button href={resolve('/watch/[id]', { id: item.Id ?? '' })} size="lg">
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
							<Button
								variant="outline"
								href={resolve('/watch/[id]', { id: item.Id ?? '' })}
								size="lg"
							>
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

			{#if isSeries && loadingSeasons}
				<div class="space-y-4">
					<h2 class="text-2xl font-bold text-white">Seasons</h2>
					<Spinner />
				</div>
			{:else if isSeries && seasons.length > 0}
				<div class="space-y-4">
					<h2 class="text-2xl font-bold text-white">Seasons</h2>
					<div class="flex flex-wrap gap-4">
						{#each seasons as season (season.Id ?? season.Name)}
							<a
								href={season.Id ? resolve('/item/[id]', { id: season.Id }) : undefined}
								class="group w-[18rem] flex-shrink-0"
							>
								<div
									class="h-[28rem] w-[18rem] overflow-hidden rounded-xl bg-black shadow-lg transition-transform duration-200 group-hover:scale-[1.03]"
								>
									<Image
										src={season.Id
											? getItemImageUrl(season.Id, 'Primary', { maxWidth: 600 })
											: undefined}
										alt={season.Name ?? ''}
									/>
								</div>
								<p class="mt-2 text-base font-medium text-zinc-300 group-hover:text-white">
									{season.Name}
								</p>
								{#if season.ChildCount}
									<p class="text-sm text-zinc-500">
										{season.ChildCount}
										{season.ChildCount === 1 ? 'episode' : 'episodes'}
									</p>
								{/if}
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if isSeason && loadingEpisodes}
				<div class="space-y-4">
					<h2 class="text-2xl font-bold text-white">Episodes</h2>
					<Spinner />
				</div>
			{:else if isSeason && episodes.length > 0}
				<div class="space-y-4">
					<h2 class="text-2xl font-bold text-white">Episodes</h2>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{#each episodes as episode (episode.Id ?? episode.Name)}
							<a
								href={episode.Id ? resolve('/watch/[id]', { id: episode.Id }) : undefined}
								class="group flex gap-3 rounded-xl border border-zinc-700/40 bg-zinc-800/40 p-3 transition-colors hover:bg-zinc-700/30"
							>
								<div
									class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
								>
									<Image
										src={episode.Id
											? getItemImageUrl(episode.Id, 'Primary', { maxWidth: 300 })
											: undefined}
										alt={episode.Name ?? ''}
										aspectRatio="1/1"
									/>
								</div>
								<div class="min-w-0 flex-1 py-0.5">
									<span class="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
										{formatEpisodeNumber(episode)}
									</span>
									<p
										class="mt-0.5 truncate text-sm font-medium text-zinc-200 group-hover:text-white"
									>
										{episode.Name}
									</p>
									{#if episode.Overview}
										<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
											{episode.Overview}
										</p>
									{/if}
									{#if episode.RunTimeTicks}
										<span class="mt-1 inline-block text-[11px] text-zinc-500">
											{formatRuntime(episode.RunTimeTicks)}
										</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if cast.length > 0}
				<div class="space-y-4">
					<h2 class="text-xl font-semibold text-white">Cast</h2>
					<div class="flex gap-4 overflow-x-auto pb-4">
						{#each cast as person (person.Id ?? person.Name)}
							<a
								href={person.Id ? resolve('/item/[id]', { id: person.Id }) : undefined}
								class="group flex w-28 flex-shrink-0 flex-col items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-zinc-800/40"
							>
								<div class="transition-transform duration-200 group-hover:scale-105">
									<Avatar src={personImageUrl(person)} alt={person.Name ?? ''} class="h-20 w-20" />
								</div>
								<div class="w-full text-center">
									<p class="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
										{person.Name}
									</p>
									{#if person.Role}
										<p class="truncate text-xs text-zinc-400">{person.Role}</p>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
