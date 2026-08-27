<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import BackgroundFX from '$lib/components/ui/BackgroundFX.svelte';

	const auth = getAuth();
	const media = getMedia();

	let serverUrl = $state('');
	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let showPassword = $state(false);

	const addMode = $derived(page.url.searchParams.get('add') === 'true');

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!serverUrl || !username) {
			errorMsg = 'Server URL and username are required';
			return;
		}

		loading = true;
		errorMsg = '';

		const success = await auth.login(serverUrl, username, password);
		if (success) {
			if (auth.user?.Id) {
				await media.loadLibraries(auth.user.Id);
			}
			goto(addMode ? resolve('/accounts') : resolve('/'));
		} else {
			errorMsg = auth.error ?? 'Login failed';
		}
		loading = false;
	}
</script>

<svelte:head>
	<title>{addMode ? 'Add Account' : 'Sign In'} - Jellyfin</title>
</svelte:head>

<BackgroundFX variant="intense" />

<div class="relative flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl shadow-black/50 backdrop-blur-xl"
	>
		<div
			class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent"
		></div>

		<div class="relative p-8 sm:p-10">
			<div class="mb-8 text-center">
				<div class="relative mx-auto mb-5 w-fit">
					<span
						class="absolute -inset-2 -z-10 animate-pulse rounded-full bg-[var(--accent-600)]/30 blur-2xl"
					></span>
					<div
						class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] shadow-lg shadow-black/40"
					>
						<svg class="h-9 w-9 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7-11-7z" fill-rule="evenodd" clip-rule="evenodd" />
						</svg>
					</div>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-white">
					{addMode ? 'Add Account' : 'Welcome to Jellyfin'}
				</h1>
				<p class="mt-1.5 text-sm text-zinc-400">
					{addMode ? 'Sign in to a new server or account' : 'Sign in to stream your media'}
				</p>
			</div>

			<form onsubmit={handleLogin} class="space-y-5">
				{#if errorMsg}
					<div
						class="animate-fade-in rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400"
					>
						{errorMsg}
					</div>
				{/if}

				<TextInput
					id="serverUrl"
					label="Server URL"
					type="url"
					bind:value={serverUrl}
					placeholder="http://localhost:8096"
					required
					autoComplete="url"
				/>

				<TextInput
					id="username"
					label="Username"
					type="text"
					bind:value={username}
					placeholder="Username"
					required
					autoComplete="username"
				/>

				<div class="relative">
					<TextInput
						id="password"
						label="Password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder="Password"
						autoComplete="current-password"
					/>
					{#if password}
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute right-3 bottom-2.5 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:text-zinc-200 focus-visible:outline-none"
						>
							{#if showPassword}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
									/>
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							{/if}
						</button>
					{/if}
				</div>

				<Button
					type="submit"
					disabled={loading || !serverUrl || !username}
					size="lg"
					class="w-full"
				>
					{#if loading}
						<span class="inline-flex items-center gap-2">
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								></path>
							</svg>
							Signing in...
						</span>
					{:else}
						{addMode ? 'Add Account' : 'Sign In'}
					{/if}
				</Button>
			</form>

			<div class="mt-6 text-center">
				{#if addMode}
					<a
						href={resolve('/accounts')}
						class="text-xs text-zinc-400 transition-colors hover:text-white"
					>
						<span class="inline-flex items-center gap-1.5">
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
								/>
							</svg>
							Back to Accounts
						</span>
					</a>
				{:else}
					<p class="inline-flex items-center gap-1.5 text-xs text-zinc-500">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
						Connected to Jellyfin server
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
