<script lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import { ChevronLeft, ChevronRight, Info, Play, Star } from '@lucide/svelte';
	import { getBackdropUrls, getItemImageUrl } from '$lib/jellyfin/client';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		items,
		intervalMs = 9000
	}: {
		items: BaseItemDto[];
		intervalMs?: number;
	} = $props();

	let prefersReducedMotion = $state<boolean>(false);

	const slideableItems = $derived(
		items.filter((item) => item.Id && item.BackdropImageTags && item.BackdropImageTags.length > 0)
	);

	let currentIndex = $state(0);
	let isTransitioning = $state(false);
	let paused = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const currentItem = $derived(slideableItems[currentIndex] ?? null);

	const backdropUrl = $derived.by(() => {
		if (!currentItem) return '';
		const urls = getBackdropUrls(currentItem, { maxWidth: 1920, quality: 90 });
		return urls[0] ?? '';
	});

	const logoUrl = $derived.by(() => {
		if (!currentItem?.Id) return undefined;
		return getItemImageUrl(currentItem.Id, 'Logo', { maxWidth: 400 });
	});

	function formatRuntime(ticks?: number | null): string {
		if (!ticks) return '';
		const minutes = Math.round(ticks / 10_000_000 / 60);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) return `${hours}h ${mins}m`;
		return `${mins}m`;
	}

	function getDisplayTitle(item: BaseItemDto): string {
		if (item.Type === 'Episode' && item.SeriesName) return item.SeriesName;
		return item.Name ?? '';
	}

	function getSubtitle(item: BaseItemDto): string {
		if (item.Type === 'Episode') {
			return `S${item.ParentIndexNumber ?? '?'}E${item.IndexNumber ?? '?'} \u2022 ${item.Name ?? ''}`;
		}
		return item.ProductionYear ? String(item.ProductionYear) : '';
	}

	function goTo(index: number) {
		if (isTransitioning || index === currentIndex) return;
		isTransitioning = true;
		currentIndex = index;
		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function next() {
		if (slideableItems.length <= 1) return;
		goTo((currentIndex + 1) % slideableItems.length);
	}

	function prev() {
		if (slideableItems.length <= 1) return;
		goTo((currentIndex - 1 + slideableItems.length) % slideableItems.length);
	}

	function startAutoplay() {
		stopAutoplay();
		if (slideableItems.length > 1 && !paused) {
			intervalId = setInterval(next, intervalMs);
		}
	}

	function stopAutoplay() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function handleMouseEnter() {
		paused = true;
		stopAutoplay();
	}

	function handleMouseLeave() {
		paused = false;
		startAutoplay();
	}

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		startAutoplay();
	});

	onDestroy(() => {
		stopAutoplay();
	});

	$effect(() => {
		if (slideableItems.length > 0) {
			currentIndex = 0;
			if (!prefersReducedMotion) startAutoplay();
		}
	});
</script>

{#if slideableItems.length > 0}
	<div
		class="group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50"
		role="region"
		aria-label="Featured media"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="relative h-72 sm:h-80 md:h-96 lg:h-[30rem]">
			{#each slideableItems as item, i (item.Id)}
				{#if i === currentIndex}
					<div class="absolute inset-0 transition-opacity duration-700 ease-in-out">
						<img
							src={backdropUrl}
							alt={item.Name ?? ''}
							fetchpriority="high"
							loading="eager"
							class="h-full w-full animate-ken-burns object-cover object-top"
						/>
					</div>
				{/if}
			{/each}

			<div
				class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/30 to-transparent"
			></div>
		</div>

		<div class="absolute inset-0 flex items-end">
			<div class="w-full p-6 sm:p-8 lg:p-10">
				{#if currentItem}
					<div class="max-w-2xl space-y-4">
						{#if logoUrl}
							<img
								src={logoUrl}
								alt={currentItem.Name ?? ''}
								class="h-12 w-auto object-contain drop-shadow sm:h-14 md:h-16"
							/>
						{:else}
							<h2
								class="text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl md:text-5xl"
							>
								{getDisplayTitle(currentItem)}
							</h2>
						{/if}

						<div class="flex flex-wrap items-center gap-2.5 text-sm text-zinc-200 sm:text-base">
							{#if getSubtitle(currentItem)}
								<span>{getSubtitle(currentItem)}</span>
								<span class="text-zinc-500">|</span>
							{/if}
							{#if currentItem.RunTimeTicks}
								<span>{formatRuntime(currentItem.RunTimeTicks)}</span>
								<span class="text-zinc-500">|</span>
							{/if}
							{#if currentItem.OfficialRating}
								<span
									class="rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-xs text-zinc-200"
								>
									{currentItem.OfficialRating}
								</span>
							{/if}
							{#if currentItem.CommunityRating}
								<span class="flex items-center gap-1 text-yellow-400">
									<Star class="h-4 w-4" fill="currentColor" />
									{currentItem.CommunityRating.toFixed(1)}
								</span>
							{/if}
						</div>

						{#if currentItem.Genres?.length}
							<div class="flex flex-wrap gap-2">
								{#each currentItem.Genres.slice(0, 4) as genre (genre)}
									<span
										class="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-200 backdrop-blur-sm"
									>
										{genre}
									</span>
								{/each}
							</div>
						{/if}

						{#if currentItem.Overview}
							<p
								class="hidden max-w-xl text-sm leading-relaxed text-zinc-300 sm:line-clamp-2 md:block"
							>
								{currentItem.Overview}
							</p>
						{/if}

						<div class="flex gap-3 pt-2">
							<a
								href={resolve(`/watch/${currentItem.Id ?? ''}`)}
								class="glass inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/40 transition-all hover:scale-[1.03] hover:bg-white/10 active:scale-95"
							>
								<Play class="h-4 w-4" fill="currentColor" />
								Play
							</a>
							<a
								href={resolve(`/item/${currentItem.Id ?? ''}`)}
								class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/15 hover:text-white active:scale-95"
							>
								<Info class="h-4 w-4" />
								Info
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if slideableItems.length > 1}
			<Button
				variant="ghost"
				size="icon"
				onclick={prev}
				class="absolute top-1/2 left-2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-black/60 sm:left-4"
				aria-label="Previous"
			>
				<ChevronLeft class="h-5 w-5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={next}
				class="absolute top-1/2 right-2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-black/60 sm:right-4"
				aria-label="Next"
			>
				<ChevronRight class="h-5 w-5" />
			</Button>

			<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
				{#each slideableItems as _, i (i)}
					<button
						onclick={() => goTo(i)}
						class="h-1.5 rounded-full transition-all duration-300 {i === currentIndex
							? 'w-6 bg-white'
							: 'w-1.5 bg-white/40 hover:bg-white/60'}"
						aria-label="Go to slide {i + 1}"
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
