<script lang="ts">
	import { getMedia } from '$lib/state/index.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Clapperboard, House, Music2, Search, Settings, Tv, Users } from '@lucide/svelte';
	import type { Component } from 'svelte';

	const media = getMedia();

	function cls(active: boolean): string {
		return `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:outline-none ${
			active
				? 'bg-[var(--accent-600)] text-white shadow-lg shadow-black/40'
				: 'text-zinc-400 hover:bg-white/10 hover:text-white active:scale-95'
		}`;
	}

	const collectionIcons: Record<string, Component> = {
		movies: Clapperboard,
		tvshows: Tv,
		music: Music2
	};

	function getIcon(type?: string | null): Component {
		return collectionIcons[type ?? ''] ?? Clapperboard;
	}
</script>

<nav
	class="glass fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border px-2 py-1.5 shadow-xl shadow-black/30"
	aria-label="Primary"
>
	<div class="flex items-center gap-0.5">
		<a
			href={resolve('/')}
			class={cls(page.url.pathname === '/')}
			aria-current={page.url.pathname === '/' ? 'page' : undefined}
		>
			<House class="h-4 w-4" />
			<span class="hidden sm:inline">Home</span>
		</a>

		{#each media.libraries as lib (lib.Id)}
			{@const Icon = getIcon(lib.CollectionType)}
			<a
				href={resolve(`/library/${lib.Id}`)}
				class={cls(page.url.pathname === `/library/${lib.Id}`)}
				aria-current={page.url.pathname === `/library/${lib.Id}` ? 'page' : undefined}
			>
				<Icon class="h-4 w-4" />
				<span class="hidden sm:inline">{lib.Name}</span>
			</a>
		{/each}

		<a
			href={resolve('/search')}
			class={cls(page.url.pathname === '/search')}
			aria-current={page.url.pathname === '/search' ? 'page' : undefined}
		>
			<Search class="h-4 w-4" />
			<span class="hidden sm:inline">Search</span>
		</a>

		<div class="mx-1 h-5 w-px bg-white/10" aria-hidden="true"></div>

		<a
			href={resolve('/settings')}
			class={cls(page.url.pathname === '/settings')}
			aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
		>
			<Settings class="h-4 w-4" />
			<span class="hidden sm:inline">Settings</span>
		</a>

		<a
			href={resolve('/accounts')}
			class={cls(page.url.pathname === '/accounts')}
			aria-current={page.url.pathname === '/accounts' ? 'page' : undefined}
		>
			<Users class="h-4 w-4" />
			<span class="hidden sm:inline">Accounts</span>
		</a>
	</div>
</nav>
