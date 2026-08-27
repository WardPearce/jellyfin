<script lang="ts">
	let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();
</script>

<div
	class="flex items-center justify-center"
	class:p-4={size === 'sm'}
	class:p-8={size === 'md'}
	class:p-16={size === 'lg'}
>
	<div
		class="animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-500)]"
		class:h-6={size === 'sm'}
		class:w-6={size === 'sm'}
		class:h-10={size === 'md'}
		class:w-10={size === 'md'}
		class:h-16={size === 'lg'}
		class:w-16={size === 'lg'}
	></div>
</div>
