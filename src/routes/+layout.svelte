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
		const bg = settings.background;
		root.style.setProperty('--accent-400', p[400]);
		root.style.setProperty('--accent-500', p[500]);
		root.style.setProperty('--accent-600', p[600]);
		root.style.setProperty('--accent-700', p[700]);
		root.style.setProperty('--accent-ring', p.ring);
		root.style.setProperty('--surface', bg.surface);
		root.style.setProperty('--surface-border', bg.surfaceBorder);
		root.style.setProperty('--glass-bg', bg.glass);
		root.style.setProperty('--glass-border', bg.glassBorder);
		root.style.setProperty('--menu-bg', bg.menu);
		root.style.setProperty('--menu-border', bg.menuBorder);
		root.style.setProperty('--menu-section-bg', bg.menuSection);
		root.style.setProperty('--menu-top-bar-bg', bg.menuTopBar);
		root.style.setProperty('--body-glow-a', bg.bodyGlowA);
		root.style.setProperty('--body-glow-b', bg.bodyGlowB);
		root.style.setProperty('--body-glow-c', bg.bodyGlowC);
		root.style.setProperty('--fx-a-intense', bg.fxIntenseA);
		root.style.setProperty('--fx-a-subtle', bg.fxSubtleA);
		root.style.setProperty('--fx-b-intense', bg.fxIntenseB);
		root.style.setProperty('--fx-b-subtle', bg.fxSubtleB);
		root.style.setProperty('--fx-c-intense', bg.fxIntenseC);
		root.style.setProperty('--fx-c-subtle', bg.fxSubtleC);

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
