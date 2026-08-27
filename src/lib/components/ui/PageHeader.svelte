<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow = '',
		title,
		subtitle = '',
		className = '',
		eyebrowClass = '',
		titleClass = '',
		actions
	}: {
		eyebrow?: string;
		title: string;
		subtitle?: string;
		className?: string;
		eyebrowClass?: string;
		titleClass?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class={className}>
	{#if eyebrow}
		<p
			class="text-xs font-semibold tracking-[0.18em] text-[var(--accent-400)] uppercase {eyebrowClass}"
		>
			{eyebrow}
		</p>
	{/if}
	<div class="mt-1 flex flex-wrap items-end gap-4">
		<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl {titleClass}">{title}</h1>
		{#if actions}
			<div class="ml-auto pb-1">
				{@render actions()}
			</div>
		{/if}
	</div>
	{#if subtitle}
		<p class="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
	{/if}
</div>
