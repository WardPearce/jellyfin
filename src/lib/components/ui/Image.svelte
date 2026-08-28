<script lang="ts">
	import { SquarePlay } from '@lucide/svelte';

	let {
		src,
		alt = '',
		class: className = '',
		fallbackClass = '',
		aspectRatio = 'auto',
		loading = 'lazy',
		fit = 'cover'
	}: {
		src?: string | null;
		alt?: string;
		class?: string;
		fallbackClass?: string;
		aspectRatio?: string;
		loading?: 'lazy' | 'eager';
		fit?: 'cover' | 'contain';
	} = $props();

	let imgError = $state(false);
	let imgLoaded = $state(false);

	function handleError() {
		imgError = true;
	}

	function handleLoad() {
		imgLoaded = true;
	}

	let showImage = $derived(src && !imgError);
</script>

<div class="relative overflow-hidden {className}" style="aspect-ratio: {aspectRatio}">
	{#if showImage}
		<img
			{src}
			{alt}
			{loading}
			class="h-full w-full transition-opacity duration-300 {fit === 'contain'
				? 'object-contain'
				: 'object-cover'} {imgLoaded ? 'opacity-100' : 'opacity-0'}"
			onerror={handleError}
			onload={handleLoad}
		/>
	{:else}
		<div class="flex h-full w-full items-center justify-center {fallbackClass}">
			<SquarePlay class="h-12 w-12 text-zinc-600" strokeWidth={1.5} />
		</div>
	{/if}
</div>
