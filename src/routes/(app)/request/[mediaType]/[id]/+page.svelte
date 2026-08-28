<script lang="ts">
	import { CircleCheck, Clock, LoaderCircle, Star } from '@lucide/svelte';
	import { getAuth } from '$lib/state/index.svelte';
	import {
		createRequest,
		getBackdropUrl,
		getMediaInfoState,
		getMovieDetails,
		getPosterUrl,
		getProfileUrl,
		getTvDetails,
		SeerrError,
		isTvDetails
	} from '$lib/seerr';
	import type { SeerrDetails } from '$lib/seerr';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Image from '$lib/components/ui/Image.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	const auth = getAuth();

	const mediaType = $derived(page.params.mediaType);
	const mediaId = $derived(Number(page.params.id));
	const isMovie = $derived(mediaType === 'movie');
	const isTv = $derived(mediaType === 'tv');

	let details = $state<SeerrDetails | null>(null);
	let loading = $state(true);
	let error = $state('');
	let submitting = $state(false);
	let formError = $state('');
	let justRequested = $state(false);

	const selectedSeasons = new SvelteSet<number>();

	const title = $derived(
		details
			? isTvDetails(details)
				? (details.name ?? 'Untitled')
				: (details.title ?? 'Untitled')
			: ''
	);
	const year = $derived(
		details
			? isTvDetails(details)
				? details.firstAirDate?.slice(0, 4)
				: details.releaseDate?.slice(0, 4)
			: undefined
	);
	const overview = $derived(details?.overview ?? '');
	const genres = $derived(
		(details?.genres ?? []).map((g) => g.name).filter((n): n is string => !!n)
	);
	const backdropUrl = $derived(details ? getBackdropUrl(details.backdropPath, 'w1280') : '');
	const posterUrl = $derived(details ? getPosterUrl(details.posterPath, 'w500') : '');
	const rating = $derived(details?.voteAverage ?? 0);
	const runtime = $derived(
		details && mediaType === 'movie' && !isTvDetails(details)
			? (details.runtime ?? undefined)
			: undefined
	);
	const status = $derived(details ? getMediaInfoState(details.mediaInfo) : 'requestable');
	const isInLibrary = $derived(status === 'available');
	const isRequested = $derived(status === 'requested' || justRequested);
	const canRequest = $derived(!!auth.seerrUrl && !isInLibrary && (isTv || !isRequested));

	const cast = $derived(details?.credits?.cast ?? []);
	const tvSeasons = $derived(
		details && isTvDetails(details)
			? (details.seasons ?? [])
					.filter((s) => s.seasonNumber !== undefined && s.seasonNumber > 0)
					.sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0))
			: []
	);
	const selectedCount = $derived(
		tvSeasons.filter((s) => selectedSeasons.has(s.seasonNumber!)).length
	);

	function formatRuntime(minutes?: number): string {
		if (!minutes) return '';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) return `${hours}h ${mins}m`;
		return `${mins}m`;
	}

	function toggleSeason(seasonNumber: number) {
		if (selectedSeasons.has(seasonNumber)) selectedSeasons.delete(seasonNumber);
		else selectedSeasons.add(seasonNumber);
	}

	function clearSelections() {
		selectedSeasons.clear();
	}

	async function submitRequest(seasons: number[] | 'all' | undefined) {
		if (!auth.seerrUrl || !mediaId) return;
		submitting = true;
		formError = '';
		try {
			await createRequest(
				auth.seerrUrl,
				{
					mediaType: isMovie ? 'movie' : 'tv',
					mediaId,
					seasons: isMovie ? undefined : seasons
				},
				auth.seerrApiKey
			);
			justRequested = true;
			clearSelections();
		} catch (e: unknown) {
			formError = e instanceof SeerrError ? e.message : 'Failed to create request';
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		const type = page.params.mediaType;
		const id = Number(page.params.id);
		if ((type !== 'movie' && type !== 'tv') || !Number.isFinite(id)) {
			error = 'Invalid request link';
			loading = false;
			return;
		}
		if (!auth.seerrUrl) {
			error = 'Seerr is not connected';
			loading = false;
			return;
		}

		loading = true;
		error = '';
		formError = '';
		details = null;
		justRequested = false;
		clearSelections();

		(async () => {
			try {
				const data =
					type === 'tv'
						? await getTvDetails(auth.seerrUrl!, id, auth.seerrApiKey)
						: await getMovieDetails(auth.seerrUrl!, id, auth.seerrApiKey);
				details = data;
			} catch (e: unknown) {
				error = e instanceof SeerrError ? e.message : 'Failed to load details';
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>{title || 'Request'} - Jellyfin</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<Spinner size="lg" />
	</div>
{:else if error && !details}
	<div class="flex min-h-screen items-center justify-center">
		<div class="max-w-md space-y-4 text-center">
			<p class="text-red-400">{error}</p>
			<a
				href={resolve('/search')}
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
				Back to search
			</a>
		</div>
	</div>
{:else if details}
	<div class="relative min-h-screen">
		<div class="mx-auto max-w-6xl space-y-12 px-4 pt-24 pb-16 lg:px-6">
			<div>
				<a
					href={resolve('/search')}
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
					Back to search
				</a>
			</div>

			<div
				class="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50"
			>
				{#if backdropUrl}
					<div class="relative h-[24rem] overflow-hidden sm:h-[26rem] lg:h-[30rem]">
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

				<div
					class="relative flex flex-col gap-8 p-5 sm:p-8 lg:flex-row lg:items-end lg:p-10 {backdropUrl
						? 'pt-6 lg:pt-0'
						: ''}"
				>
					<div class="mx-auto w-44 flex-shrink-0 sm:w-56 lg:mx-0 lg:w-64">
						<Image
							src={posterUrl}
							alt={title}
							aspectRatio="2/3"
							class="rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
							fallbackClass="bg-gradient-to-br from-zinc-800 to-zinc-900"
						/>
					</div>

					<div class="flex flex-1 flex-col">
						<div class="space-y-5">
							<div class="space-y-2.5">
								<p
									class="text-xs font-semibold tracking-[0.18em] text-[var(--accent-400)] uppercase"
								>
									{isTv ? 'TV Show' : 'Movie'}
								</p>
								<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
									{title}
								</h1>
							</div>

							<div class="flex flex-wrap items-center gap-2.5 text-sm text-zinc-300 sm:text-base">
								{#if year}
									<span>{year}</span>
								{/if}
								{#if isMovie && runtime}
									<span>{formatRuntime(runtime)}</span>
								{/if}
								{#if rating}
									<span class="flex items-center gap-1 text-lg font-medium text-amber-400">
										<Star class="h-5 w-5" fill="currentColor" />
										{rating.toFixed(1)}
									</span>
								{/if}
								{#if isInLibrary}
									<span
										class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400"
									>
										<CircleCheck class="h-3.5 w-3.5" />
										In your library
									</span>
								{:else if isRequested}
									<span
										class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400"
									>
										<Clock class="h-3.5 w-3.5" fill="currentColor" />
										Requested
									</span>
								{/if}
							</div>

							{#if genres.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each genres as genre (genre)}
										<Chip>{genre}</Chip>
									{/each}
								</div>
							{/if}

							{#if overview}
								<p class="max-w-3xl text-sm leading-relaxed text-zinc-300">{overview}</p>
							{/if}
						</div>

						<div class="mt-8 flex flex-wrap items-center gap-3">
							{#if isInLibrary}
								<p class="text-sm text-zinc-400">This title is already in your library.</p>
							{:else if isMovie && isRequested}
								<p class="text-sm text-zinc-400">
									A request for this title is already in progress.
								</p>
							{:else if isTv && isRequested}
								<p class="text-sm text-zinc-400">
									Some seasons may already be requested — select additional seasons below to request
									them.
								</p>
							{:else if isMovie}
								<Button size="lg" onclick={() => submitRequest(undefined)} disabled={submitting}>
									{#if submitting}
										<LoaderCircle class="h-5 w-5 animate-spin" />
										Requesting...
									{:else}
										Request Movie
									{/if}
								</Button>
								{#if formError}
									<p class="text-sm text-red-400">{formError}</p>
								{/if}
							{:else if isTv}
								<p class="text-sm text-zinc-400">
									Select the seasons you want below to request them.
								</p>
							{:else}
								<p class="text-sm text-zinc-400">Connect Seerr to request titles.</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			{#if isTv && tvSeasons.length > 0}
				<section class="space-y-5">
					<SectionHeader title="Seasons">
						{#snippet action()}
							{#if selectedCount > 0}
								<button
									type="button"
									onclick={clearSelections}
									class="text-xs text-zinc-400 transition-colors hover:text-white"
								>
									Clear selection ({selectedCount})
								</button>
							{/if}
						{/snippet}
					</SectionHeader>

					<div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
						<div class="flex flex-wrap gap-3">
							{#each tvSeasons as season (season.seasonNumber)}
								{@const num = season.seasonNumber!}
								{@const selected = selectedSeasons.has(num)}
								<button
									type="button"
									onclick={() => toggleSeason(num)}
									disabled={!canRequest}
									class="inline-flex flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 {selected
										? 'border-[var(--accent-500)] bg-[var(--accent-500)]/20 text-white'
										: 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/10'}"
								>
									<span class="text-sm font-medium">Season {num}</span>
									{#if season.episodeCount}
										<span class="text-xs text-zinc-500">{season.episodeCount} episodes</span>
									{/if}
								</button>
							{/each}
						</div>

						{#if canRequest}
							<div class="mt-5 flex flex-wrap items-center gap-3">
								<Button
									onclick={() => submitRequest([...selectedSeasons])}
									disabled={submitting || selectedCount === 0}
								>
									{#if submitting}
										<LoaderCircle class="h-4 w-4 animate-spin" />
										Requesting...
									{:else if selectedCount > 0}
										Request {selectedCount === 1 ? 'Selected Season' : `${selectedCount} Seasons`}
									{:else}
										Request Selected Seasons
									{/if}
								</Button>
								<Button
									variant="outline"
									onclick={() => submitRequest('all')}
									disabled={submitting}
								>
									{#if submitting}
										<LoaderCircle class="h-4 w-4 animate-spin" />
										Requesting...
									{:else}
										Request All Seasons
									{/if}
								</Button>
								{#if formError}
									<p class="text-sm text-red-400">{formError}</p>
								{/if}
							</div>
						{/if}
					</div>
				</section>
			{/if}

			{#if cast.length > 0}
				<section class="space-y-5">
					<SectionHeader title="Cast" />
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{#each cast as person (person.id ?? person.name)}
							<div
								class="group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border border-transparent p-3 text-center transition-all duration-200 hover:border-white/10 hover:bg-white/5"
							>
								<div class="transition-transform duration-200 group-hover:scale-105">
									<Image
										src={getProfileUrl(person.profilePath)}
										alt={person.name ?? ''}
										aspectRatio="1"
										class="h-20 w-20 rounded-full"
										fallbackClass="rounded-full bg-zinc-800"
									/>
								</div>
								<div class="w-full min-w-0">
									<p class="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
										{person.name}
									</p>
									{#if person.character}
										<p class="truncate text-xs text-zinc-500">{person.character}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
{/if}
