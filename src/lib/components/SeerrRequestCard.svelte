<script lang="ts">
	import { CircleCheck, CirclePlus, Clock, Play } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Image from '$lib/components/ui/Image.svelte';
	import {
		getPosterUrl,
		getResultState,
		getResultTitle,
		getResultYear,
		isTvResult
	} from '$lib/seerr';
	import type { SeerrSearchResult } from '$lib/seerr';

	let {
		result,
		aspectRatio = 'portrait',
		layout = 'grid'
	}: {
		result: SeerrSearchResult;
		aspectRatio?: 'square' | 'portrait' | 'auto';
		layout?: 'grid' | 'list' | 'row';
	} = $props();

	const mediaType = $derived(isTvResult(result) ? 'tv' : 'movie');
	const title = $derived(getResultTitle(result));
	const year = $derived(getResultYear(result));
	const posterUrl = $derived(getPosterUrl(result.posterPath, 'w300'));
	const resultState = $derived(getResultState(result));

	const requestPath = $derived(
		result.id !== undefined ? resolve(`/request/${mediaType}/${result.id}`) : undefined
	);

	const available = $derived(resultState === 'available');
	const requested = $derived(resultState === 'requested');

	const imageAspectRatio = $derived(
		aspectRatio === 'portrait' ? '2/3' : aspectRatio === 'square' ? '16/9' : '2/3'
	);

	const isCompact = $derived(aspectRatio === 'square');
</script>

{#if layout === 'list'}
	<a
		href={requestPath}
		class="group relative flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2 pr-4 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
	>
		<div class="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
			<Image src={posterUrl} alt={title} class="absolute inset-0" aspectRatio={imageAspectRatio} />
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span
					class="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white"
				>
					{title}
				</span>
				<span
					class="flex-shrink-0 rounded-lg bg-[var(--accent-600)]/20 px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent-400)]"
				>
					{mediaType === 'tv' ? 'TV' : 'Movie'}
				</span>
			</div>
			<p class="mt-0.5 truncate text-xs text-zinc-400">{year}</p>
		</div>

		<span
			class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-600)] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			aria-hidden="true"
		>
			<Play class="h-4 w-4 translate-x-0.5" fill="currentColor" />
		</span>
	</a>
{:else}
	<div class="group relative {isCompact ? '' : 'flex flex-col gap-1.5'}">
		<a
			href={requestPath}
			class="relative block overflow-hidden {isCompact
				? 'rounded-2xl'
				: 'rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-lg shadow-black/30'}"
		>
			<Image
				src={posterUrl}
				alt={title}
				aspectRatio={imageAspectRatio}
				class={isCompact ? '' : 'bg-transparent'}
				fallbackClass="bg-gradient-to-br from-zinc-800 to-zinc-900"
			/>

			<span
				class="absolute top-2 left-2 rounded-full border border-white/15 bg-zinc-950/70 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white/90 backdrop-blur-md"
			>
				{mediaType === 'tv' ? 'TV' : 'Movie'}
			</span>

			{#if available}
				<div
					class="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-1.5 bg-black/70 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm"
				>
					<CircleCheck class="h-3.5 w-3.5" />
					In library
				</div>
			{:else if requested}
				<div
					class="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-1.5 bg-black/70 py-1.5 text-xs font-medium text-amber-400 backdrop-blur-sm"
				>
					<Clock class="h-3.5 w-3.5" fill="currentColor" />
					Requested
				</div>
			{:else}
				<div
					class="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-1.5 bg-black/70 py-1.5 text-xs font-medium text-[var(--accent-400)] backdrop-blur-sm"
				>
					<CirclePlus class="h-3.5 w-3.5" />
					Not requested
				</div>
			{/if}
		</a>

		{#if !isCompact}
			<div class="flex flex-col px-0.5">
				<a
					href={requestPath}
					class="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-white"
				>
					{title}
				</a>
				{#if year}
					<span class="truncate text-xs text-zinc-400">{year}</span>
				{/if}
			</div>
		{/if}
	</div>
{/if}
