<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button as ButtonPrimitive } from 'bits-ui';

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		children,
		...restProps
	}: {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const variants: Record<string, string> = {
		default: 'bg-[var(--accent-600)] text-white hover:bg-[var(--accent-700)]',
		destructive: 'bg-red-600 text-white hover:bg-red-700',
		ghost: 'hover:bg-zinc-800 hover:text-white text-zinc-400',
		link: 'text-zinc-400 underline-offset-4 hover:underline hover:text-white',
		outline: 'border border-zinc-600 hover:border-zinc-500 hover:text-white text-zinc-300'
	};

	const sizes: Record<string, string> = {
		default: 'px-4 py-2.5 text-sm',
		sm: 'px-3 py-1.5 text-xs',
		lg: 'px-6 py-3 text-base',
		icon: 'h-10 w-10'
	};

	const classes = $derived(
		`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`
	);
</script>

<ButtonPrimitive.Root class={classes} {...restProps}>
	{@render children?.()}
</ButtonPrimitive.Root>
