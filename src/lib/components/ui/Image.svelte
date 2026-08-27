<script lang="ts">
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
			<svg class="h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
				/>
			</svg>
		</div>
	{/if}
</div>
