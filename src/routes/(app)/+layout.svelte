<script lang="ts">
	import IslandNav from '$lib/components/IslandNav.svelte';
	import BackgroundFX from '$lib/components/ui/BackgroundFX.svelte';
	import { getAuth } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();
	const auth = getAuth();

	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
		if (e.key !== '/' || isTyping || e.metaKey || e.ctrlKey) return;
		if (page.url.pathname === '/search') return;
		e.preventDefault();
		goto(resolve('/search'));
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if auth.isAuthenticated}
	<IslandNav />
{/if}
<BackgroundFX variant="subtle" />
<main class="h-screen overflow-y-auto bg-transparent">
	{#key page.url.pathname}
		<div class="page-enter min-h-full">
			{@render children()}
		</div>
	{/key}
</main>
