<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		children,
		...restProps
	}: {
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<DropdownMenuPrimitive.Root {...restProps}>
	{@render children?.()}
</DropdownMenuPrimitive.Root>
