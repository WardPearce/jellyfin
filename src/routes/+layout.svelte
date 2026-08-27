<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		provideAuth,
		provideMedia,
		providePlayer,
		provideSettings
	} from '$lib/state/index.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();

	const auth = provideAuth();
	const media = provideMedia();
	providePlayer();
	const settings = provideSettings();

	let initialized = $state(false);

	onMount(async () => {
		await auth.restore();
		if (auth.isAuthenticated && auth.user?.Id) {
			await media.loadLibraries(auth.user.Id);
		}
		initialized = true;
	});

	$effect(() => {
		const root = document.documentElement;
		const p = settings.palette;
		root.style.setProperty('--accent-400', p[400]);
		root.style.setProperty('--accent-500', p[500]);
		root.style.setProperty('--accent-600', p[600]);
		root.style.setProperty('--accent-700', p[700]);
		root.style.setProperty('--accent-ring', p.ring);

		if (settings.glass) {
			root.style.setProperty('--glass-bg-opacity', '0.8');
			root.style.setProperty('--glass-border-opacity', '0.8');
			root.style.setProperty('--glass-blur', 'blur(12px)');
		} else {
			root.style.setProperty('--glass-bg-opacity', '1');
			root.style.setProperty('--glass-border-opacity', '1');
			root.style.setProperty('--glass-blur', 'none');
		}
	});

	$effect(() => {
		if (initialized && !auth.isAuthenticated && page.url.pathname !== '/login') {
			goto(resolve('/login'));
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Jellyfin</title>
</svelte:head>

{#if !initialized}
	<div class="flex h-screen items-center justify-center bg-zinc-950">
		<Spinner size="lg" />
	</div>
{:else}
	{@render children()}
{/if}
