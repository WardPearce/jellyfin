<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Label as LabelPrimitive } from 'bits-ui';

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

<LabelPrimitive.Root class="text-sm font-medium text-zinc-300 {className}" {...restProps}>
	{@render children?.()}
</LabelPrimitive.Root>
