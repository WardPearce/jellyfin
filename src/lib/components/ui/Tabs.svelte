<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tabs as TabsPrimitive } from 'bits-ui';

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

<TabsPrimitive.Root class={className} {...restProps}>
	{@render children?.()}
</TabsPrimitive.Root>
