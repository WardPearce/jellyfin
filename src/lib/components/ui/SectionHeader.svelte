<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		action,
		className = '',
		level = 'default'
	}: {
		title: string;
		action?: Snippet;
		className?: string;
		level?: 'default' | 'muted';
	} = $props();
</script>

{#if level === 'muted'}
	<div class="group flex items-baseline gap-3 {className}">
		<h2 class="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
		{#if action}
			<span class="ml-auto">
				{@render action()}
			</span>
		{/if}
	</div>
{:else}
	<div class="group flex items-center gap-3 {className}">
		<span class="relative flex items-center">
			<span class="h-5 w-1 rounded-full bg-[var(--accent-500)]"></span>
			<span
				class="absolute left-0 h-5 w-1 origin-left rounded-full bg-[var(--accent-400)]/60 transition-transform duration-300 group-hover:scale-x-[4.8]"
			></span>
		</span>
		<h2 class="text-xl font-semibold tracking-tight text-white">{title}</h2>
		{#if action}
			<span class="ml-auto">
				{@render action()}
			</span>
		{/if}
	</div>
{/if}
