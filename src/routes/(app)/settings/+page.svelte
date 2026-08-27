<script lang="ts">
	import { getSettings } from '$lib/state/index.svelte';
	import { accentColors, type AccentColor } from '$lib/state/settings.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import { resolve } from '$app/paths';

	const settings = getSettings();

	const accentLabels: Record<AccentColor, string> = {
		indigo: 'Indigo',
		purple: 'Purple',
		blue: 'Blue',
		cyan: 'Cyan',
		teal: 'Teal',
		emerald: 'Emerald',
		lime: 'Lime',
		amber: 'Amber',
		rose: 'Rose',
		red: 'Red',
		pink: 'Pink'
	};
</script>

<svelte:head>
	<title>Settings - Jellyfin</title>
</svelte:head>

<div class="space-y-6 px-4 pt-4 lg:px-6">
	<h1 class="text-2xl font-bold text-white">Settings</h1>

	<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="text-lg font-semibold text-white">Appearance</h2>
		<Separator class="my-4" />

		<div class="space-y-6">
			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-300">Accent Color</h3>
				<div class="flex flex-wrap gap-2">
					{#each accentColors as color (color)}
						{@const pal = settings.getPalette(color)}
						<button
							type="button"
							onclick={() => settings.setAccent(color)}
							class="group relative flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all {settings.accent ===
							color
								? 'border-white/40 bg-white/10 text-white'
								: 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}"
						>
							<div
								class="h-4 w-4 rounded-full {settings.accent === color
									? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
									: ''}"
								style="background-color: {pal.swatch}"
							></div>
							{accentLabels[color]}
						</button>
					{/each}
				</div>
				<p class="mt-2 text-xs text-zinc-500">Changes apply instantly across the app.</p>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-zinc-300">Glassmorphism</h3>
					<p class="mt-0.5 text-xs text-zinc-500">
						Frosted glass effect on navigation and headers.
					</p>
				</div>
				<button
					type="button"
					role="switch"
					aria-checked={settings.glass}
					aria-label="Toggle glassmorphism"
					onclick={() => settings.toggleGlass()}
					class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none"
					class:bg-[var(--accent-600)]={settings.glass}
					class:bg-zinc-700={!settings.glass}
				>
					<span
						class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
						class:translate-x-5={settings.glass}
						class:translate-x-0={!settings.glass}
					></span>
				</button>
			</div>
		</div>
	</div>

	<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="text-lg font-semibold text-white">Account</h2>
		<Separator class="my-4" />
		<div class="space-y-4">
			<p class="text-sm text-zinc-400">Manage your accounts, switch users, or add new servers.</p>
			<Button variant="outline" href={resolve('/accounts')}>Manage Accounts</Button>
		</div>
	</div>

	<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="text-lg font-semibold text-white">About</h2>
		<Separator class="my-4" />
		<div class="space-y-2 text-sm text-zinc-400">
			<p>Jellyfin Svelte Client v0.1.0</p>
			<p>Built with SvelteKit, TailwindCSS, and Vidstack</p>
		</div>
	</div>
</div>
