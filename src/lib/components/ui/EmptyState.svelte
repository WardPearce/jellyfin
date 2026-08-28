<script lang="ts">
	import { Folder, Search, SquarePlay } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		description = '',
		icon = 'media',
		action,
		className = ''
	}: {
		title: string;
		description?: string;
		icon?: 'media' | 'search' | 'folder';
		action?: Snippet;
		className?: string;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center px-4 py-20 text-center {className}">
	<div
		class="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner"
	>
		{#if icon === 'search'}
			<Search class="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
		{:else if icon === 'folder'}
			<Folder class="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
		{:else}
			<SquarePlay class="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
		{/if}
	</div>
	<h2 class="text-lg font-semibold text-zinc-200">{title}</h2>
	{#if description}
		<p class="mt-1.5 max-w-sm text-sm text-zinc-500">{description}</p>
	{/if}
	{#if action}
		<div class="mt-6">
			{@render action()}
		</div>
	{/if}
</div>
