<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';

	let {
		src,
		alt = '',
		class: className = 'h-10 w-10',
		...restProps
	}: {
		src?: string | null;
		alt?: string;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const initial = $derived(alt ? (alt[0]?.toUpperCase() ?? '?') : '?');
</script>

<AvatarPrimitive.Root
	class="relative flex shrink-0 overflow-hidden rounded-full {className}"
	{...restProps}
>
	<AvatarPrimitive.Image {src} {alt} class="aspect-square h-full w-full object-cover" />
	<AvatarPrimitive.Fallback
		class="flex h-full w-full items-center justify-center rounded-full bg-purple-700 text-sm font-semibold text-white"
	>
		{initial}
	</AvatarPrimitive.Fallback>
</AvatarPrimitive.Root>
