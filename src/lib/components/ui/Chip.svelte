<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		variant = 'default'
	}: {
		children?: Snippet;
		class?: string;
		variant?: 'default' | 'accent' | 'outline';
	} = $props();
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors {variant ===
	'accent'
		? 'border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/15 text-[var(--accent-400)]'
		: variant === 'outline'
			? 'border border-zinc-600 text-zinc-300 backdrop-blur-sm'
			: 'bg-white/10 text-zinc-200'} {className}"
>
	{@render children?.()}
</span>
