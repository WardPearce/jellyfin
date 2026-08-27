<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	let {
		content,
		children,
		...restProps
	}: {
		content?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<TooltipPrimitive.Root {...restProps}>
	<TooltipPrimitive.Trigger>
		{@render children?.()}
	</TooltipPrimitive.Trigger>
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			sideOffset={4}
			class="z-50 overflow-hidden rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 shadow-md"
		>
			{content}
			<TooltipPrimitive.Arrow class="bg-zinc-800" />
		</TooltipPrimitive.Content>
	</TooltipPrimitive.Portal>
</TooltipPrimitive.Root>
