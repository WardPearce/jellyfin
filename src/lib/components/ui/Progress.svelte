<script lang="ts">
	import { Progress as ProgressPrimitive } from 'bits-ui';

	let {
		value = 0,
		class: className = '',
		...restProps
	}: {
		value?: number | null;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<ProgressPrimitive.Root
	class="relative h-1 w-full overflow-hidden rounded-full bg-zinc-700 {className}"
	{value}
	{...restProps}
>
	{#snippet child({ props })}
		<div {...props}>
			<div class="h-full bg-[var(--accent-500)] transition-all" style="width: {value ?? 0}%"></div>
		</div>
	{/snippet}
</ProgressPrimitive.Root>
