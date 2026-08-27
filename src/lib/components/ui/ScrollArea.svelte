<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';

	let {
		children,
		class: className = '',
		...restProps
	}: {
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<ScrollAreaPrimitive.Root class="relative overflow-hidden {className}" {...restProps}>
	<ScrollAreaPrimitive.Viewport class="h-full w-full rounded-[inherit]">
		{@render children?.()}
	</ScrollAreaPrimitive.Viewport>
	<ScrollAreaPrimitive.Scrollbar
		orientation="vertical"
		class="flex touch-none transition-colors select-none"
	>
		<ScrollAreaPrimitive.Thumb class="relative flex-1 rounded-full bg-zinc-700" />
	</ScrollAreaPrimitive.Scrollbar>
</ScrollAreaPrimitive.Root>
