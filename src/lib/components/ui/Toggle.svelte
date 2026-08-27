<script lang="ts">
	let {
		checked,
		label,
		onChange = () => {}
	}: {
		checked: boolean;
		label: string;
		onChange?: (next: boolean) => void;
	} = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	onclick={() => onChange(!checked)}
	class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none {checked
		? 'bg-[var(--accent-600)]'
		: 'bg-zinc-700'}"
>
	<span
		class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out {checked
			? 'translate-x-6'
			: 'translate-x-1'}"
	></span>
</button>
