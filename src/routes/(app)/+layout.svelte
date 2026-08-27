<script lang="ts">
	import IslandNav from '$lib/components/IslandNav.svelte';
	import { getAuth } from '$lib/state/index.svelte';

	let { children } = $props();
	const auth = getAuth();
</script>

{#if auth.isAuthenticated}
	<IslandNav />
{/if}
<main class="h-screen overflow-y-auto bg-zinc-950">
	{@render children()}
</main>
