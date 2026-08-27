<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Label from '$lib/components/ui/Label.svelte';

	const auth = getAuth();
	const media = getMedia();

	let serverUrl = $state('');
	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

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

<div class="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-600)]"
			>
				<svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-white">
				{addMode ? 'Add Account' : 'Welcome to Jellyfin'}
			</h1>
			<p class="mt-1 text-sm text-zinc-400">
				{addMode ? 'Sign in to a new server or account' : 'Sign in to your server'}
			</p>
		</div>

		<form
			onsubmit={handleLogin}
			class="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
		>
			{#if errorMsg}
				<div
					class="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400"
				>
					{errorMsg}
				</div>
			{/if}

			<div>
				<Label for="serverUrl" class="mb-1 block">Server URL</Label>
				<input
					id="serverUrl"
					type="url"
					bind:value={serverUrl}
					placeholder="http://localhost:8096"
					required
					class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
				/>
			</div>

			<div>
				<Label for="username" class="mb-1 block">Username</Label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="Username"
					required
					class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
				/>
			</div>

			<div>
				<Label for="password" class="mb-1 block">Password</Label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Password"
					class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
				/>
			</div>

			<Button type="submit" disabled={loading || !serverUrl || !username} class="w-full">
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

		{#if addMode}
			<p class="mt-4 text-center text-xs text-zinc-500">
				<a href={resolve('/accounts')} class="text-[var(--accent-400)] hover:underline">
					Back to Accounts
				</a>
			</p>
		{:else}
			<p class="mt-4 text-center text-xs text-zinc-500">Connected to Jellyfin server</p>
		{/if}
	</div>
</div>
