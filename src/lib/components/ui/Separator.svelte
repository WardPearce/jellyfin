<script lang="ts">
	import { Separator as SeparatorPrimitive } from 'bits-ui';

	let {
		orientation = 'horizontal',
		class: className = '',
		...restProps
	}: {
		orientation?: 'horizontal' | 'vertical';
		class?: string;
		[key: string]: unknown;
	} = $props();

	const classes = $derived(
		orientation === 'horizontal'
			? `h-px w-full bg-zinc-800 ${className}`
			: `w-px h-full bg-zinc-800 ${className}`
	);
</script>

<SeparatorPrimitive.Root class={classes} {orientation} {...restProps} />
