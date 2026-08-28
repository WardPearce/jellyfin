<script lang="ts">
	import { Play, Star } from '@lucide/svelte';
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import Image from '$lib/components/ui/Image.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { itemToLibraryItem } from '$lib/state/media.svelte';

	let {
		item,
		href,
		aspectRatio = 'auto'
	}: {
		item: BaseItemDto;
		href?: string;
		aspectRatio?: 'square' | 'portrait' | 'auto';
	} = $props();

	const libItem = $derived(itemToLibraryItem(item));

	const imageAspectRatio = $derived(() => {
		if (aspectRatio === 'portrait') return '2/3';
		if (libItem.primaryImageAspectRatio) {
			const ratio = Math.min(Math.max(libItem.primaryImageAspectRatio, 0.5), 1.78);
			return `${ratio}`;
		}
		if (aspectRatio === 'square') return '16/9';
		return '16/9';
	});

	const showProgress = $derived(
		libItem.playedPercentage !== undefined && libItem.playedPercentage > 0
	);

	const isCompact = $derived(aspectRatio === 'square');

	const displayTitle = $derived(() => {
		if (libItem.type === 'Episode' && libItem.seriesName) {
			return libItem.seriesName;
		}
		return libItem.name;
	});

	const subtitle = $derived(() => {
		if (libItem.type === 'Episode') {
			return `S${libItem.indexNumber ?? '?'} - ${libItem.name}`;
		}
		if (libItem.productionYear) {
			return String(libItem.productionYear);
		}
		return '';
	});
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	{href}
	class="group relative {isCompact ? '' : 'flex flex-col gap-1.5'}"
>
	<div
		class="relative overflow-hidden transition-all duration-300 {isCompact
			? 'rounded-2xl'
			: 'rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-lg shadow-black/30'}"
	>
		<Image
			src={libItem.primaryImageUrl}
			alt={libItem.name}
			aspectRatio={imageAspectRatio()}
			class={isCompact ? '' : 'bg-transparent'}
			fallbackClass="bg-gradient-to-br from-zinc-800 to-zinc-900"
		/>

		<div
			class="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
		>
			<span
				class="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-[var(--accent-600)] text-white shadow-xl shadow-black/50 transition-transform duration-300 group-hover:scale-100"
			>
				<Play class="h-6 w-6 translate-x-0.5" fill="currentColor" />
			</span>
		</div>

		{#if showProgress}
			<div class="absolute right-0 bottom-0 left-0">
				<Progress value={libItem.playedPercentage} class="h-1.5 rounded-none" />
			</div>
		{/if}

		{#if libItem.officialRating}
			<span
				class="absolute top-2 right-2 rounded-full border border-white/15 bg-zinc-950/70 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white/90 backdrop-blur-md"
			>
				{libItem.officialRating}
			</span>
		{/if}

		{#if libItem.communityRating}
			<span
				class="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-white/15 bg-zinc-950/70 px-2 py-0.5 text-[11px] font-medium text-amber-400 backdrop-blur-md"
			>
				<Star class="h-3 w-3" fill="currentColor" />
				{libItem.communityRating.toFixed(1)}
			</span>
		{/if}

		{#if libItem.type === 'Series'}
			<div
				class="absolute right-2 bottom-2 rounded-full bg-[var(--accent-600)] px-2 py-0.5 text-[11px] font-medium text-white shadow-lg shadow-black/30"
			>
				Series
			</div>
		{/if}
	</div>

	{#if !isCompact}
		<div class="flex flex-col px-0.5">
			<span
				class="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white"
			>
				{displayTitle()}
			</span>
			{#if subtitle()}
				<span class="truncate text-xs text-zinc-400">
					{subtitle()}
				</span>
			{/if}
		</div>
	{/if}
</svelte:element>
