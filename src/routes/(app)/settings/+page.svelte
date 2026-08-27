<script lang="ts">
	import { getSettings } from '$lib/state/index.svelte';
	import { accentColors, type AccentColor } from '$lib/state/settings.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
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

<div class="mx-auto max-w-3xl space-y-6 px-4 pt-24 pb-10 lg:px-6">
	<div>
		<p class="text-xs font-semibold tracking-[0.18em] text-[var(--accent-400)] uppercase">
			Preferences
		</p>
		<h1 class="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">Settings</h1>
		<p class="mt-2 text-sm text-zinc-400">Make Jellyfin feel like home. Changes apply instantly.</p>
	</div>

	<div class="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Appearance</h2>
				<p class="text-xs text-zinc-500">Themes, colors, and effects</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />

		<div class="space-y-8 px-6 pb-6">
			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Accent Color</h3>
				<div class="flex flex-wrap gap-2">
					{#each accentColors as color (color)}
						{@const pal = settings.getPalette(color)}
						<button
							type="button"
							onclick={() => settings.setAccent(color)}
							class="group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 {settings.accent ===
							color
								? 'border-[var(--accent-500)]/50 bg-[var(--accent-500)]/15 text-white shadow-lg shadow-black/20'
								: 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-zinc-200'}"
						>
							<div
								class="h-4 w-4 rounded-full transition-transform duration-200 group-hover:scale-110 {settings.accent ===
								color
									? 'ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-900'
									: ''}"
								style="background-color: {pal.swatch}"
							></div>
							{accentLabels[color]}
							{#if settings.accent === color}
								<svg
									class="h-3.5 w-3.5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4.5 12.75l6 6 9-13.5"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				</div>
				<p class="mt-2.5 text-xs text-zinc-500">Changes apply instantly across the app.</p>
			</div>

			<div class="flex items-center justify-between gap-4">
				<div>
					<h3 class="text-sm font-medium text-zinc-200">Glassmorphism</h3>
					<p class="mt-0.5 text-xs text-zinc-500">
						Frosted glass effect on navigation and surfaces.
					</p>
				</div>
				<Toggle
					checked={settings.glass}
					label="Toggle glassmorphism"
					onChange={() => settings.toggleGlass()}
				/>
			</div>
		</div>
	</div>

	<div class="surface rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Account</h2>
				<p class="text-xs text-zinc-500">Switch users, servers, and profiles</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />
		<div class="px-6 pb-6">
			<p class="mb-4 text-sm text-zinc-400">
				Manage your accounts, switch users, or add new servers.
			</p>
			<Button variant="outline" href={resolve('/accounts')}>Manage Accounts</Button>
		</div>
	</div>

	<div class="surface rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 6h.008v.008H6V6z"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">About</h2>
				<p class="text-xs text-zinc-500">Version and credits</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />
		<div class="space-y-2 px-6 pb-6 text-sm text-zinc-400">
			<p>Jellyfin Svelte Client v0.1.0</p>
			<p>Built with SvelteKit, TailwindCSS, and Vidstack</p>
		</div>
	</div>
</div>
