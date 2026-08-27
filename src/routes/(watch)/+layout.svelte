<script lang="ts">
	import { getAuth } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let { children } = $props();

	const auth = getAuth();

	onMount(() => {
		if (!auth.isAuthenticated && page.url.pathname !== '/login') {
			goto(resolve('/login'));
		}
	});
</script>

{#if auth.isAuthenticated}
	<div class="min-h-screen bg-zinc-950 text-white">
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-zinc-950">
		<Spinner size="lg" />
	</div>
{/if}
