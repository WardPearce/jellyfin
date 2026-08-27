<script lang="ts">
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
		<svg class="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			{#if icon === 'search'}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			{:else if icon === 'folder'}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
				/>
			{:else}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
				/>
			{/if}
		</svg>
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
