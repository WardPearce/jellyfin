<script lang="ts">
	import { getSettings } from '$lib/state/index.svelte';
	import { Check, Home, LayoutGrid, Play, Sun, Tag, User } from '@lucide/svelte';
	import {
		accentColors,
		type AccentColor,
		type BrowseLayout,
		type GridDensity,
		type PlaybackQuality,
		type SubtitleMode
	} from '$lib/state/settings.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { resolve } from '$app/paths';
	import ISO6391 from 'iso-639-1';

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

	const qualityOptions: { value: PlaybackQuality; label: string }[] = [
		{ value: 'auto', label: 'Auto' },
		{ value: '4320', label: '8K' },
		{ value: '2160', label: '4K' },
		{ value: '1440', label: '1440p' },
		{ value: '1080', label: '1080p' },
		{ value: '720', label: '720p' },
		{ value: '480', label: '480p' },
		{ value: '360', label: '360p' }
	];

	const subtitleModeOptions: { value: SubtitleMode; label: string; hint: string }[] = [
		{ value: 'none', label: 'Off', hint: 'Never show subtitles' },
		{ value: 'foreign', label: 'Smart', hint: 'Only for foreign audio' },
		{ value: 'always', label: 'Always on', hint: 'Show subtitles by default' }
	];

	const languageOptions: { value: string; label: string }[] = [
		{ value: 'default', label: 'Default' },
		...ISO6391.getAllCodes()
			.map((code) => ({ value: code, label: ISO6391.getName(code) }))
			.sort((a, b) => a.label.localeCompare(b.label))
	];

	const densityOptions: { value: GridDensity; label: string; hint: string }[] = [
		{ value: 'compact', label: 'Compact', hint: 'More items on screen' },
		{ value: 'cozy', label: 'Cozy', hint: 'Balanced spacing' },
		{ value: 'comfortable', label: 'Comfortable', hint: 'Fewer, larger cards' }
	];

	const layoutOptions: { value: BrowseLayout; label: string; hint: string }[] = [
		{ value: 'grid', label: 'Cards', hint: 'Fixed grid of cards' },
		{ value: 'list', label: 'List', hint: 'Compact vertical list' }
	];
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
	</div>

	<div class="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<Sun class="h-5 w-5" />
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
								<Check class="h-3.5 w-3.5 text-white" />
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

	<div class="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<Play class="h-5 w-5" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Playback</h2>
				<p class="text-xs text-zinc-500">Quality, subtitles, and audio defaults</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />

		<div class="space-y-8 px-6 pb-6">
			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Preferred Quality</h3>
				<div class="flex flex-wrap gap-2">
					{#each qualityOptions as option (option.value)}
						<button
							type="button"
							onclick={() => settings.setPlayback({ quality: option.value })}
							class="rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 {settings
								.playback.quality === option.value
								? 'border-[var(--accent-500)]/50 bg-[var(--accent-500)]/15 text-white shadow-lg shadow-black/20'
								: 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-zinc-200'}"
						>
							{option.label}
						</button>
					{/each}
				</div>
				<p class="mt-2.5 text-xs text-zinc-500">
					Limit the max resolution streamed to save bandwidth on slow connections.
				</p>
			</div>

			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Default Subtitles</h3>
				<div class="grid gap-2 sm:grid-cols-3">
					{#each subtitleModeOptions as option (option.value)}
						<button
							type="button"
							onclick={() => settings.setPlayback({ subtitleMode: option.value })}
							class="rounded-xl border p-3 text-left transition-all duration-200 {settings.playback
								.subtitleMode === option.value
								? 'border-[var(--accent-500)]/50 bg-[var(--accent-500)]/15 shadow-lg shadow-black/20'
								: 'border-white/10 bg-white/5 hover:border-white/25'}"
						>
							<span
								class="block text-sm font-medium {settings.playback.subtitleMode === option.value
									? 'text-white'
									: 'text-zinc-300'}"
							>
								{option.label}
							</span>
							<span class="mt-0.5 block text-xs text-zinc-500">{option.hint}</span>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Preferred Languages</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<span class="mb-1.5 block text-xs text-zinc-500">Audio</span>
						<Select
							items={languageOptions}
							value={settings.playback.audioLanguage}
							onChange={(v) => settings.setPlayback({ audioLanguage: v })}
						/>
					</div>
					<div>
						<span class="mb-1.5 block text-xs text-zinc-500">Subtitles</span>
						<Select
							items={languageOptions}
							value={settings.playback.subtitleLanguage}
							onChange={(v) => settings.setPlayback({ subtitleLanguage: v })}
						/>
					</div>
				</div>
				<p class="mt-2 text-xs text-zinc-500">
					Choose preferred audio and subtitle languages. The player prefers tracks matching your
					selection.
				</p>
			</div>

			<div class="flex items-center justify-between gap-4">
				<div>
					<h3 class="text-sm font-medium text-zinc-200">Auto-play Next Episode</h3>
					<p class="mt-0.5 text-xs text-zinc-500">
						Automatically start the next episode when one finishes.
					</p>
				</div>
				<Toggle
					checked={settings.playback.autoPlayNext}
					label="Toggle auto-play next episode"
					onChange={(v) => settings.setPlayback({ autoPlayNext: v })}
				/>
			</div>

			<div class="flex items-center justify-between gap-4">
				<div>
					<h3 class="text-sm font-medium text-zinc-200">Resume Playback</h3>
					<p class="mt-0.5 text-xs text-zinc-500">
						Remember where you left off and resume from that position.
					</p>
				</div>
				<Toggle
					checked={settings.playback.resume}
					label="Toggle resume playback"
					onChange={(v) => settings.setPlayback({ resume: v })}
				/>
			</div>
		</div>
	</div>

	<div class="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<Home class="h-5 w-5" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Home</h2>
				<p class="text-xs text-zinc-500">Resume and upcoming content</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />

		<div class="space-y-8 px-6 pb-6">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h3 class="text-sm font-medium text-zinc-200">Combine Resume & Next Up</h3>
					<p class="mt-0.5 text-xs text-zinc-500">
						Show Continue Watching and Next Up in a single row on the home page.
					</p>
				</div>
				<Toggle
					checked={settings.home.combineResumeNext}
					label="Toggle combine resume & next up"
					onChange={(v) => settings.setHome({ combineResumeNext: v })}
				/>
			</div>
		</div>
	</div>

	<div class="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<LayoutGrid class="h-5 w-5" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-white">Browsing</h2>
				<p class="text-xs text-zinc-500">Grid density and layout</p>
			</div>
		</div>
		<Separator class="my-5 bg-white/10" />

		<div class="space-y-8 px-6 pb-6">
			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Grid Density</h3>
				<div class="grid gap-2 sm:grid-cols-3">
					{#each densityOptions as option (option.value)}
						<button
							type="button"
							onclick={() => settings.setPoster({ density: option.value })}
							class="rounded-xl border p-3 text-left transition-all duration-200 {settings.poster
								.density === option.value
								? 'border-[var(--accent-500)]/50 bg-[var(--accent-500)]/15 shadow-lg shadow-black/20'
								: 'border-white/10 bg-white/5 hover:border-white/25'}"
						>
							<span
								class="block text-sm font-medium {settings.poster.density === option.value
									? 'text-white'
									: 'text-zinc-300'}"
							>
								{option.label}
							</span>
							<span class="mt-0.5 block text-xs text-zinc-500">{option.hint}</span>
						</button>
					{/each}
				</div>
				<p class="mt-2.5 text-xs text-zinc-500">
					Controls how many cards appear per row in grid views.
				</p>
			</div>

			<div>
				<h3 class="mb-3 text-sm font-medium text-zinc-200">Default Layout</h3>
				<div class="grid gap-2 sm:grid-cols-3">
					{#each layoutOptions as option (option.value)}
						<button
							type="button"
							onclick={() => settings.setPoster({ layout: option.value })}
							class="rounded-xl border p-3 text-left transition-all duration-200 {settings.poster
								.layout === option.value
								? 'border-[var(--accent-500)]/50 bg-[var(--accent-500)]/15 shadow-lg shadow-black/20'
								: 'border-white/10 bg-white/5 hover:border-white/25'}"
						>
							<span
								class="block text-sm font-medium {settings.poster.layout === option.value
									? 'text-white'
									: 'text-zinc-300'}"
							>
								{option.label}
							</span>
							<span class="mt-0.5 block text-xs text-zinc-500">{option.hint}</span>
						</button>
					{/each}
				</div>
				<p class="mt-2.5 text-xs text-zinc-500">
					Choose between a fixed card grid and a compact vertical list for browsing libraries.
				</p>
			</div>
		</div>
	</div>

	<div class="surface rounded-2xl border shadow-xl shadow-black/30">
		<div class="flex items-center gap-3 px-6 pt-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
			>
				<User class="h-5 w-5" />
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
				<Tag class="h-5 w-5" />
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
