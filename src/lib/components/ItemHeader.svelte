<script lang="ts">
	import { Circle, Heart, Play, Star } from '@lucide/svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import { getItemImageUrl } from '$lib/jellyfin/client';
	import { resolve } from '$app/paths';
	import Image from '$lib/components/ui/Image.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';

	let {
		item,
		backdropUrl = ''
	}: {
		item: BaseItemDto;
		backdropUrl?: string;
	} = $props();

	const posterUrl = $derived(
		item.Id ? getItemImageUrl(item.Id, 'Primary', { maxWidth: 400 }) : undefined
	);

	const typeLabel = $derived(
		item.Type === 'Series'
			? 'Series'
			: item.Type === 'Season'
				? 'Season'
				: item.Type === 'Episode'
					? 'Episode'
					: 'Movie'
	);

	const showTrailer = $derived(
		item.Type !== 'Series' &&
			((item.LocalTrailerCount ?? 0) > 0 || (item.RemoteTrailers?.length ?? 0) > 0)
	);

	function formatRuntime(ticks?: number | null): string {
		if (!ticks) return '';
		const minutes = Math.round(ticks / 10_000_000 / 60);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) return `${hours}h ${mins}m`;
		return `${mins}m`;
	}

	function formatCriticRating(rating?: number | null): string {
		if (!rating) return '';
		return `${Math.round(rating)}%`;
	}
</script>

<div class="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50">
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
				alt={item.Name ?? ''}
				aspectRatio="2/3"
				class="rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
				fallbackClass="bg-gradient-to-br from-zinc-800 to-zinc-900"
			/>
		</div>

		<div class="flex flex-1 flex-col lg:pt-0">
			<div class="space-y-5">
				<div class="space-y-2.5">
					<p class="text-xs font-semibold tracking-[0.18em] text-[var(--accent-400)] uppercase">
						{typeLabel}
					</p>
					<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
						{item.Name}
					</h1>

					{#if item.Taglines?.length}
						<p class="text-base text-zinc-300 italic">“{item.Taglines[0]}”</p>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-2.5 text-sm text-zinc-300 sm:text-base">
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
							<Star class="h-5 w-5" fill="currentColor" />
							{item.CommunityRating.toFixed(1)}
						</span>
					{/if}
					{#if item.CriticRating}
						<Chip
							variant="accent"
							class={item.CriticRating >= 60
								? '!border-emerald-500/30 !bg-emerald-500/15 !text-emerald-400'
								: ''}
						>
							<Circle class="h-3.5 w-3.5" fill="currentColor" />
							{formatCriticRating(item.CriticRating)}
						</Chip>
					{/if}
				</div>

				{#if item.Genres?.length}
					<div class="flex flex-wrap gap-2">
						{#each item.Genres as genre (genre)}
							<Chip>{genre}</Chip>
						{/each}
					</div>
				{/if}

				{#if item.Overview}
					<div class="max-w-3xl space-y-2">
						<p class="text-sm leading-relaxed text-zinc-300">{item.Overview}</p>
						{#if item.OriginalTitle && item.OriginalTitle !== item.Name}
							<p class="text-xs text-zinc-500">
								Original title: <span class="text-zinc-200">{item.OriginalTitle}</span>
							</p>
						{/if}
						{#if item.ProductionLocations?.length}
							<p class="text-xs text-zinc-500">
								Countries: <span class="text-zinc-200">{item.ProductionLocations.join(', ')}</span>
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="mt-8 flex flex-wrap items-center gap-3 lg:mt-auto">
				<Button href={resolve(`/watch/${item.Id ?? ''}`)} size="lg">
					<Play class="h-5 w-5" fill="currentColor" />
					Play
				</Button>
				{#if showTrailer}
					<Button variant="outline" href={resolve(`/watch/${item.Id ?? ''}`)} size="lg">
						<Heart class="h-5 w-5" />
						Trailer
					</Button>
				{/if}
			</div>
		</div>
	</div>
</div>
