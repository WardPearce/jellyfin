<script lang="ts">
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
			? ''
			: 'rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-lg shadow-black/30'}"
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
				<svg class="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M6 4.5v11l9-5.5-9-5.5z" />
				</svg>
			</span>
		</div>

		{#if showProgress}
			<div class="absolute right-0 bottom-0 left-0">
				<Progress value={libItem.playedPercentage} class="h-1.5 rounded-none" />
			</div>
		{/if}

		{#if libItem.officialRating}
			<span
				class="absolute top-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
			>
				{libItem.officialRating}
			</span>
		{/if}

		{#if libItem.communityRating}
			<span
				class="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-amber-400 backdrop-blur-sm"
			>
				<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
					/>
				</svg>
				{libItem.communityRating.toFixed(1)}
			</span>
		{/if}

		{#if libItem.type === 'Series'}
			<div
				class="absolute right-1.5 bottom-1.5 rounded-md bg-[var(--accent-600)] px-1.5 py-0.5 text-xs font-medium text-white shadow-lg shadow-black/30"
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
