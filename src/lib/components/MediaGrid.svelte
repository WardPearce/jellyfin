<script lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import MediaCard from './MediaCard.svelte';

	let {
		items,
		loading = false,
		prefix = 'item',
		layout = 'grid',
		aspectRatio = 'auto',
		linkTarget = 'item'
	}: {
		items: BaseItemDto[];
		loading?: boolean;
		prefix?: string;
		layout?: 'grid' | 'row';
		aspectRatio?: 'square' | 'portrait' | 'auto';
		linkTarget?: 'item' | 'watch';
	} = $props();

	const hrefPrefix = $derived(linkTarget === 'watch' ? '/watch/' : '/item/');

	const rowWidth = $derived(
		aspectRatio === 'square' ? 'w-64' : aspectRatio === 'portrait' ? 'w-40' : 'w-64'
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

	$effect(() => {
		const el = scrollEl;
		const count = items.length;
		if (!el || !count) return;
		requestAnimationFrame(updateScrollState);
	});
</script>

{#if loading}
	{#if layout === 'row'}
		<div class="flex gap-2 overflow-hidden pb-2">
			{#each Array(6) as _, i (i)}
				<div class="flex-shrink-0 {rowWidth} animate-pulse">
					<div
						class="rounded-md bg-zinc-800 {aspectRatio === 'portrait'
							? 'aspect-[2/3]'
							: 'aspect-square'}"
					></div>
					<div class="mt-1.5 h-3 w-3/4 rounded bg-zinc-800"></div>
					<div class="mt-1 h-2 w-1/2 rounded bg-zinc-800"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each Array(6) as _, i (i)}
				<div class="animate-pulse">
					<div class="aspect-video rounded-md bg-zinc-800"></div>
					<div class="mt-1.5 h-3 w-3/4 rounded bg-zinc-800"></div>
					<div class="mt-1 h-2 w-1/2 rounded bg-zinc-800"></div>
				</div>
			{/each}
		</div>
	{/if}
{:else if items.length === 0}
	<div class="py-12 text-center text-zinc-500">
		<svg
			class="mx-auto h-12 w-12 text-zinc-600"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
			/>
		</svg>
		<p class="mt-2 text-sm">No items found</p>
	</div>
{:else if layout === 'row'}
	<div class="group/row relative">
		{#if canScrollLeft}
			<button
				onclick={() => scroll('left')}
				class="absolute top-0 bottom-0 left-0 z-10 flex w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
				aria-label="Scroll left"
			>
				<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
		{/if}

		<div bind:this={scrollEl} class="flex gap-2 overflow-hidden pb-2">
			{#each items as item (item.Id ?? `${prefix}-${item.Name}`)}
				<div class="flex-shrink-0 {rowWidth}">
					<MediaCard {item} href={item.Id ? `${hrefPrefix}${item.Id}` : undefined} {aspectRatio} />
				</div>
			{/each}
		</div>

		{#if canScrollRight}
			<button
				onclick={() => scroll('right')}
				class="absolute top-0 right-0 bottom-0 z-10 flex w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
				aria-label="Scroll right"
			>
				<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
		{#each items as item (item.Id ?? `${prefix}-${item.Name}`)}
			<MediaCard {item} href={item.Id ? `${hrefPrefix}${item.Id}` : undefined} {aspectRatio} />
		{/each}
	</div>
{/if}
