<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import BackgroundFX from '$lib/components/ui/BackgroundFX.svelte';
	import { ArrowLeft, Eye, EyeOff, LoaderCircle, Play, Zap } from '@lucide/svelte';

	const auth = getAuth();
	const media = getMedia();

	let serverUrl = $state('');
	let username = $state('');
	let password = $state('');
	let seerrUrl = $state('');
	let seerrApiKey = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let showPassword = $state(false);
	let quickConnectMode = $state(false);
	let quickConnectCode = $state('');
	let quickConnectStatus = $state('');

	const addMode = $derived(page.url.searchParams.get('add') === 'true');

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!serverUrl || !username) {
			errorMsg = 'Server URL and username are required';
			return;
		}

		loading = true;
		errorMsg = '';

		const success = await auth.login(serverUrl, username, password, seerrUrl, seerrApiKey);
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

	async function handleQuickConnect(e: Event) {
		e.preventDefault();
		if (!serverUrl) {
			errorMsg = 'Server URL is required';
			return;
		}

		errorMsg = '';
		quickConnectStatus = 'Contacting server...';

		const initiated = await auth.initiateQuickConnect(serverUrl);
		if (!initiated.success) {
			errorMsg = auth.error ?? 'Quick Connect failed';
			quickConnectStatus = '';
			return;
		}

		quickConnectCode = initiated.code;
		quickConnectStatus = `Waiting for approval... Enter ${initiated.code} on your Jellyfin device.`;
		loading = true;

		const result = await auth.completeQuickConnect(
			serverUrl,
			initiated.secret,
			seerrUrl,
			seerrApiKey
		);
		loading = false;

		if (result.success) {
			if (auth.user?.Id) {
				await media.loadLibraries(auth.user.Id);
			}
			goto(addMode ? resolve('/accounts') : resolve('/'));
		} else {
			errorMsg = auth.error ?? 'Quick Connect failed';
		}
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
						<Play class="h-9 w-9 text-white" fill="currentColor" />
					</div>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-white">
					{addMode ? 'Add Account' : 'Welcome to Jellyfin'}
				</h1>
				<p class="mt-1.5 text-sm text-zinc-400">
					{addMode ? 'Sign in to a new server or account' : 'Sign in to stream your media'}
				</p>
			</div>

			<form onsubmit={quickConnectMode ? handleQuickConnect : handleLogin} class="space-y-5">
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

				{#if quickConnectMode}
					<div
						class="rounded-2xl border border-[var(--accent-500)]/40 bg-[var(--accent-600)]/10 p-5 text-center"
					>
						<p class="text-sm text-zinc-300">
							Open your Jellyfin app and enter the code below to sign in.
						</p>
						{#if loading}
							{#if quickConnectCode}
								<div class="mt-4">
									<div
										class="mx-auto w-fit rounded-xl bg-zinc-900/80 px-6 py-3 font-mono text-3xl font-bold tracking-[0.3em] text-white"
									>
										{quickConnectCode}
									</div>
									<p class="mt-3 text-xs text-zinc-400">{quickConnectStatus}</p>
								</div>
							{:else}
								<div class="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-300">
									<LoaderCircle class="h-4 w-4 animate-spin" />
									{quickConnectStatus}
								</div>
							{/if}
						{:else}
							<Button type="submit" disabled={!serverUrl} size="lg" class="mt-4 w-full">
								<span class="inline-flex items-center gap-2">
									<Zap class="h-5 w-5" />
									Start Quick Connect
								</span>
							</Button>
						{/if}
					</div>
				{:else}
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
									<EyeOff class="h-5 w-5" />
								{:else}
									<Eye class="h-5 w-5" />
								{/if}
							</button>
						{/if}
					</div>

					<div class="space-y-1.5">
						<TextInput
							id="seerrUrl"
							label="Seerr URL (optional)"
							type="url"
							bind:value={seerrUrl}
							placeholder="http://localhost:5055"
							autoComplete="url"
						/>
						<p class="text-xs text-zinc-500">
							Enables requesting movies and shows from search. Uses your Jellyfin login above.
						</p>
					</div>

					<div class="space-y-1.5">
						<TextInput
							id="seerrApiKey"
							label="Seerr API Key (optional)"
							type="text"
							bind:value={seerrApiKey}
							placeholder="Seerr Settings → Main → API Key"
							autoComplete="off"
						/>
						<p class="text-xs text-zinc-500">Required for Seerr support</p>
					</div>

					<Button
						type="submit"
						disabled={loading || !serverUrl || !username}
						size="lg"
						class="w-full"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<LoaderCircle class="h-5 w-5 animate-spin" />
								Signing in...
							</span>
						{:else}
							{addMode ? 'Add Account' : 'Sign In'}
						{/if}
					</Button>
				{/if}

				<button
					type="button"
					onclick={() => {
						quickConnectMode = !quickConnectMode;
						errorMsg = '';
						quickConnectCode = '';
						quickConnectStatus = '';
					}}
					class="mx-auto flex items-center gap-1.5 text-xs font-medium text-[var(--accent-400)] transition-colors hover:text-[var(--accent-300)]"
				>
					<Zap class="h-3.5 w-3.5" />
					{quickConnectMode ? 'Use username & password instead' : 'Use Quick Connect instead'}
				</button>
			</form>

			<div class="mt-6 text-center">
				{#if addMode}
					<a
						href={resolve('/accounts')}
						class="text-xs text-zinc-400 transition-colors hover:text-white"
					>
						<span class="inline-flex items-center gap-1.5">
							<ArrowLeft class="h-3.5 w-3.5" />
							Back to Accounts
						</span>
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>
