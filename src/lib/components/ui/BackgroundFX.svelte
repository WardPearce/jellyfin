<script lang="ts">
	let {
		variant = 'subtle',
		class: className = ''
	}: {
		variant?: 'subtle' | 'intense';
		class?: string;
	} = $props();
</script>

<div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden {className}">
	<div
		class="absolute -top-32 -left-24 h-[28rem] w-[28rem] animate-float-slow rounded-full mix-blend-screen blur-3xl {variant ===
		'intense'
			? 'bg-[radial-gradient(circle_at_center,var(--fx-a-intense),transparent_65%)]'
			: 'bg-[radial-gradient(circle_at_center,var(--fx-a-subtle),transparent_65%)]'}"
	></div>
	<div
		class="absolute top-1/3 -right-32 h-[30rem] w-[30rem] animate-float-slower rounded-full mix-blend-screen blur-3xl {variant ===
		'intense'
			? 'bg-[radial-gradient(circle_at_center,var(--fx-b-intense),transparent_65%)]'
			: 'bg-[radial-gradient(circle_at_center,var(--fx-b-subtle),transparent_65%)]'}"
	></div>
	<div
		class="absolute bottom-[-8rem] left-1/3 h-[26rem] w-[26rem] animate-float-slow rounded-full mix-blend-screen blur-3xl {variant ===
		'intense'
			? 'bg-[radial-gradient(circle_at_center,var(--fx-c-intense),transparent_65%)]'
			: 'bg-[radial-gradient(circle_at_center,var(--fx-c-subtle),transparent_65%)]'}"
		style="animation-delay: -7s"
	></div>
</div>
