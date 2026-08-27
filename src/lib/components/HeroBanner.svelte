<script lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import { getBackdropUrls, getItemImageUrl } from '$lib/jellyfin/client';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		items,
		intervalMs = 7000
	}: {
		items: BaseItemDto[];
		intervalMs?: number;
	} = $props();

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
		startAutoplay();
	});

	onDestroy(() => {
		stopAutoplay();
	});

	const _ = $derived(slideableItems.length);
	$effect(() => {
		_;
		if (slideableItems.length > 0) {
			currentIndex = 0;
			startAutoplay();
		}
	});
</script>

{#if slideableItems.length > 0}
	<div
		class="group relative -mx-4 -mt-4 overflow-hidden lg:-mx-6 lg:-mt-6"
		role="region"
		aria-label="Featured media"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="relative h-80 sm:h-96 md:h-[32rem] lg:h-[36rem]">
			{#each slideableItems as item, i (item.Id)}
				{#if i === currentIndex}
					<div class="absolute inset-0 transition-opacity duration-700 ease-in-out">
						<img
							src={backdropUrl}
							alt={item.Name ?? ''}
							class="h-full w-full object-cover object-top"
						/>
					</div>
				{/if}
			{/each}

			<div
				class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent"
			></div>
		</div>

		<div class="absolute inset-0 flex items-end">
			<div class="w-full px-6 pt-20 pb-12 sm:px-10 lg:px-16">
				{#if currentItem}
					<div class="max-w-3xl space-y-4">
						{#if logoUrl}
							<img
								src={logoUrl}
								alt={currentItem.Name ?? ''}
								class="h-14 w-auto object-contain sm:h-16 md:h-20 lg:h-24"
							/>
						{:else}
							<h2 class="text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl">
								{getDisplayTitle(currentItem)}
							</h2>
						{/if}

						<div class="flex flex-wrap items-center gap-2.5 text-base text-zinc-300 sm:text-lg">
							{#if getSubtitle(currentItem)}
								<span>{getSubtitle(currentItem)}</span>
								<span class="text-zinc-600">|</span>
							{/if}
							{#if currentItem.RunTimeTicks}
								<span>{formatRuntime(currentItem.RunTimeTicks)}</span>
								<span class="text-zinc-600">|</span>
							{/if}
							{#if currentItem.OfficialRating}
								<span class="rounded border border-zinc-600 px-2 py-0.5 text-sm text-zinc-300">
									{currentItem.OfficialRating}
								</span>
							{/if}
							{#if currentItem.CommunityRating}
								<span class="flex items-center gap-1 text-lg text-yellow-400">
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										/>
									</svg>
									{currentItem.CommunityRating.toFixed(1)}
								</span>
							{/if}
						</div>

						{#if currentItem.Genres?.length}
							<div class="flex flex-wrap gap-2">
								{#each currentItem.Genres.slice(0, 5) as genre (genre)}
									<span class="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-200">
										{genre}
									</span>
								{/each}
							</div>
						{/if}

						{#if currentItem.Overview}
							<p
								class="hidden max-w-2xl text-base leading-relaxed text-zinc-400 sm:line-clamp-3 md:block"
							>
								{currentItem.Overview}
							</p>
						{/if}

						<div class="flex gap-3 pt-2">
							<a
								href={resolve('/watch/[id]', { id: currentItem.Id ?? '' })}
								class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
										clip-rule="evenodd"
									/>
								</svg>
								Play
							</a>
							<a
								href={resolve('/item/[id]', { id: currentItem.Id ?? '' })}
								class="inline-flex items-center gap-2 rounded-lg border border-zinc-600 px-6 py-3 text-base font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
							>
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
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
				class="absolute top-1/2 left-2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60 sm:left-4"
				aria-label="Previous"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={next}
				class="absolute top-1/2 right-2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60 sm:right-4"
				aria-label="Next"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</Button>

			<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
				{#each slideableItems as _, i (i)}
					<button
						onclick={() => goTo(i)}
						class="h-1.5 rounded-full transition-all duration-300 {i === currentIndex
							? 'w-6 bg-[var(--accent-500)]'
							: 'w-1.5 bg-white/40 hover:bg-white/60'}"
						aria-label="Go to slide {i + 1}"
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
