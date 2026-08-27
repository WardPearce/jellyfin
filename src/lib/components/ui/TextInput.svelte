<script lang="ts">
	import Label from '$lib/components/ui/Label.svelte';

	let {
		id,
		value = $bindable(),
		label,
		type = 'text',
		placeholder = '',
		required = false,
		autoComplete
	}: {
		id: string;
		value: string;
		label: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		autoComplete?: 'on' | 'off' | 'username' | 'current-password' | 'url' | 'email';
	} = $props();
</script>

<div class="space-y-1.5">
	<Label for={id} class="mb-0.5 block">{label}</Label>
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		autocomplete={autoComplete}
		class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-all duration-200 placeholder:text-zinc-500 hover:border-white/20 focus:border-[var(--accent-500)] focus:bg-white/[0.07] focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none"
	/>
</div>
