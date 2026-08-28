<script lang="ts">
	import { ChevronLeft, ChevronRight, Folder, Play, Star } from '@lucide/svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import type { SeerrSearchResult } from '$lib/seerr';
	import { getSettings } from '$lib/state/index.svelte';
	import { itemToLibraryItem } from '$lib/state/media.svelte';
	import Image from '$lib/components/ui/Image.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import MediaCard from './MediaCard.svelte';
	import SeerrRequestCard from './SeerrRequestCard.svelte';

	let {
		items,
		loading = false,
		prefix = 'item',
		layout = 'grid',
		aspectRatio = 'auto',
		linkTarget = 'item',
		seerrItems = []
	}: {
		items: BaseItemDto[];
		loading?: boolean;
		prefix?: string;
		layout?: 'grid' | 'list' | 'row';
		aspectRatio?: 'square' | 'portrait' | 'auto';
		linkTarget?: 'item' | 'watch';
		seerrItems?: SeerrSearchResult[];
	} = $props();

	const settings = getSettings();

	const hrefPrefix = $derived(linkTarget === 'watch' ? '/watch/' : '/item/');

	const rowWidth = $derived.by(() => {
		if (aspectRatio === 'portrait') return 'w-[10.4rem]';
		return 'w-[16.9rem]';
	});

	const gridClass = $derived.by(() => {
		switch (settings.poster.density) {
			case 'compact':
				return 'grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';
			case 'comfortable':
				return 'grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
			case 'cozy':
			default:
				return 'grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
		}
	});

	const resolvedLayout = $derived(
		layout === 'row' ? 'row' : settings.poster.layout === 'list' ? 'list' : 'grid'
	);

	let scrollEl = $state<HTMLDivElement>();
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function updateScrollState() {
		if (!scrollEl) return;
		canScrollLeft = scrollEl.scrollLeft > 0;
		canScrollRight = scrollEl.scrollLeft + scrollEl.clientWidth < scrollEl.scrollWidth - 1;
	}

	function scroll(dir: 'left' | 'right') {
		if (!scrollEl) return;
		const amount = scrollEl.clientWidth * 0.75;
		scrollEl.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
	}

	$effect(() => {
		if (!scrollEl) return;
		updateScrollState();
		scrollEl.addEventListener('scroll', updateScrollState, { passive: true });
		const ro = new ResizeObserver(updateScrollState);
		ro.observe(scrollEl);
		return () => {
			scrollEl?.removeEventListener('scroll', updateScrollState);
			ro.disconnect();
		};
	});
</script>

{#if loading}
	{#if resolvedLayout === 'row'}
		<div class="flex gap-2 overflow-hidden pb-2">
			{#each Array(6) as _, i (i)}
				<div class="flex-shrink-0 {rowWidth} animate-pulse">
					<div
						class="rounded-2xl bg-zinc-800 {aspectRatio === 'portrait'
							? 'aspect-[2/3]'
							: 'aspect-square'}"
					></div>
					<div class="mt-1.5 h-3 w-3/4 rounded bg-zinc-800"></div>
					<div class="mt-1 h-2 w-1/2 rounded bg-zinc-800"></div>
				</div>
			{/each}
		</div>
	{:else if resolvedLayout === 'list'}
		<div class="space-y-2">
			{#each Array(6) as _, i (i)}
				<div class="flex animate-pulse items-center gap-3 rounded-xl border border-white/5 p-2">
					<div
						class="h-20 w-14 flex-shrink-0 rounded-lg bg-zinc-800 {aspectRatio === 'square'
							? 'aspect-square'
							: ''}"
					></div>
					<div class="flex-1 space-y-2">
						<div class="h-3 w-1/3 rounded bg-zinc-800"></div>
						<div class="h-2 w-1/4 rounded bg-zinc-800"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid {gridClass}">
			{#each Array(6) as _, i (i)}
				<div class="animate-pulse">
					<div class="aspect-video rounded-2xl bg-zinc-800"></div>
					<div class="mt-1.5 h-3 w-3/4 rounded bg-zinc-800"></div>
					<div class="mt-1 h-2 w-1/2 rounded bg-zinc-800"></div>
				</div>
			{/each}
		</div>
	{/if}
{:else if items.length === 0 && seerrItems.length === 0}
	<div class="py-12 text-center text-zinc-500">
		<Folder class="mx-auto h-12 w-12 text-zinc-600" strokeWidth={1.5} />
		<p class="mt-2 text-sm">No items found</p>
	</div>
{:else if resolvedLayout === 'row'}
	<div class="group/row relative">
		{#if canScrollLeft}
			<button
				onclick={() => scroll('left')}
				class="absolute top-0 bottom-0 left-0 z-10 flex w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
				aria-label="Scroll left"
			>
				<ChevronLeft class="h-8 w-8 text-white" />
			</button>
		{/if}

		<div bind:this={scrollEl} class="flex gap-2 overflow-hidden pb-2">
			{#each items as item (item.Id ?? `${prefix}-${item.Name}`)}
				<div class="flex-shrink-0 {rowWidth}">
					<MediaCard {item} href={item.Id ? `${hrefPrefix}${item.Id}` : undefined} {aspectRatio} />
				</div>
			{/each}
			{#each seerrItems as result (`seerr-${result.mediaType}-${result.id}`)}
				<div class="flex-shrink-0 {rowWidth}">
					<SeerrRequestCard {result} {aspectRatio} />
				</div>
			{/each}
		</div>

		{#if canScrollRight}
			<button
				onclick={() => scroll('right')}
				class="absolute top-0 right-0 bottom-0 z-10 flex w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
				aria-label="Scroll right"
			>
				<ChevronRight class="h-8 w-8 text-white" />
			</button>
		{/if}
	</div>
{:else if resolvedLayout === 'list'}
	<div class="space-y-2">
		{#each items as item (item.Id ?? `${prefix}-${item.Name}`)}
			{@const libItem = itemToLibraryItem(item)}
			{@const href = item.Id ? `${hrefPrefix}${item.Id}` : undefined}
			<svelte:element
				this={href ? 'a' : 'div'}
				{href}
				class="group relative flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2 pr-4 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
			>
				<div class="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
					<Image
						src={libItem.primaryImageUrl}
						alt={libItem.name}
						class="absolute inset-0"
						aspectRatio={aspectRatio === 'square' ? '1/1' : '2/3'}
					/>
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<span
							class="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white"
						>
							{libItem.name}
						</span>
						{#if libItem.type === 'Series'}
							<span
								class="flex-shrink-0 rounded-full bg-[var(--accent-600)]/20 px-2 py-0.5 text-[11px] font-medium text-[var(--accent-400)]"
							>
								Series
							</span>
						{/if}
					</div>
					<p class="mt-0.5 truncate text-xs text-zinc-400">
						{#if libItem.type === 'Episode'}
							{libItem.seriesName ? libItem.seriesName + ' • ' : ''}S{libItem.indexNumber ?? '?'} - {libItem.name}
						{:else if libItem.productionYear}
							{libItem.productionYear}
						{:else}
							&nbsp;
						{/if}
					</p>
					{#if libItem.communityRating}
						<span class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-400">
							<Star class="h-3 w-3" fill="currentColor" />
							{libItem.communityRating.toFixed(1)}
						</span>
					{/if}
				</div>

				<span
					class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-600)] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					aria-hidden="true"
				>
					<Play class="h-4 w-4 translate-x-0.5" fill="currentColor" />
				</span>

				{#if libItem.playedPercentage !== undefined && libItem.playedPercentage > 0}
					<Progress value={libItem.playedPercentage} class="absolute inset-x-2 bottom-0 h-1" />
				{/if}
			</svelte:element>
		{/each}
		{#each seerrItems as result (`seerr-${result.mediaType}-${result.id}`)}
			<SeerrRequestCard {result} {aspectRatio} layout="list" />
		{/each}
	</div>
{:else}
	<div class="grid {gridClass}">
		{#each items as item (item.Id ?? `${prefix}-${item.Name}`)}
			<MediaCard {item} href={item.Id ? `${hrefPrefix}${item.Id}` : undefined} {aspectRatio} />
		{/each}
		{#each seerrItems as result (`seerr-${result.mediaType}-${result.id}`)}
			<SeerrRequestCard {result} {aspectRatio} />
		{/each}
	</div>
{/if}
