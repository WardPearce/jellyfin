<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getUserImageUrl } from '$lib/jellyfin/client';
	import BackgroundFX from '$lib/components/ui/BackgroundFX.svelte';
	import type { Account } from '$lib/state/auth.svelte';

	const auth = getAuth();
	const media = getMedia();

	let confirmDeleteId = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let editName = $state('');

	function getAvatarUrl(account: Account): string | undefined {
		if (account.user.Id && account.user.PrimaryImageTag) {
			return `${account.serverUrl}/Users/${account.user.Id}/Images/Primary?tag=${account.user.PrimaryImageTag}&quality=90&width=200`;
		}
		if (account.id === auth.activeAccountId) {
			return getUserImageUrl(account.user);
		}
		return undefined;
	}

	async function handleSelect(id: string) {
		if (editingId) return;
		if (id === auth.activeAccountId) {
			goto(resolve('/'));
			return;
		}
		auth.switchAccount(id);
		const active = auth.user;
		if (active?.Id) {
			await media.loadLibraries(active.Id);
		}
		goto(resolve('/'));
	}

	function handleEdit(e: Event, id: string) {
		e.stopPropagation();
		const acct = auth.getAccount(id);
		if (!acct) return;
		editingId = id;
		editName = acct.user.Name ?? '';
		confirmDeleteId = null;
	}

	function handleSaveName(e: Event) {
		e.preventDefault();
		if (!editingId || !editName.trim()) return;
		auth.updateAccountName(editingId, editName.trim());
		editingId = null;
		editName = '';
	}

	function handleCancelEdit(e: Event) {
		e.stopPropagation();
		editingId = null;
		editName = '';
	}

	function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirmDeleteId === id) {
			auth.deleteAccount(id);
			confirmDeleteId = null;
		} else {
			confirmDeleteId = id;
		}
	}
</script>

<svelte:head>
	<title>Who's Watching? - Jellyfin</title>
</svelte:head>

<BackgroundFX variant="intense" />

<div class="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
	<h1 class="page-enter mb-12 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
		Who's Watching?
	</h1>

	{#if auth.accounts.length === 0}
		<div class="page-enter text-center">
			<p class="mb-6 text-zinc-400">No accounts saved.</p>
			<a
				href={resolve('/login')}
				class="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-600)] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/30 transition-all hover:bg-[var(--accent-700)] hover:shadow-[var(--accent-600)]/25 hover:shadow-lg"
			>
				Sign In
			</a>
		</div>
	{:else}
		<div class="flex flex-wrap items-start justify-center gap-8 sm:gap-10">
			{#each auth.accounts as account, i (account.id)}
				{@const avatarUrl = getAvatarUrl(account)}
				{@const isConfirming = confirmDeleteId === account.id}
				{@const isEditing = editingId === account.id}
				<div
					onclick={() => handleSelect(account.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') handleSelect(account.id);
					}}
					class="page-enter group flex cursor-pointer flex-col items-center gap-3 outline-none"
					style="animation-delay: {i * 60}ms"
					role="button"
					tabindex="0"
				>
					<div class="relative">
						<div
							class="h-28 w-28 overflow-hidden rounded-full border-2 shadow-lg shadow-black/40 transition-all duration-300 sm:h-36 sm:w-36 {isConfirming
								? 'border-red-500 ring-2 ring-red-500/40'
								: isEditing
									? 'border-[var(--accent-500)] ring-2 ring-[var(--accent-ring)]'
									: 'border-white/10 group-hover:border-white/60 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover:ring-2 group-hover:ring-[var(--accent-ring)] group-focus-visible:border-white/60'}"
						>
							{#if avatarUrl}
								<img
									src={avatarUrl}
									alt={account.user.Name ?? ''}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] text-3xl font-bold text-white sm:text-4xl"
								>
									{(isEditing ? editName : account.user.Name)?.[0]?.toUpperCase() ?? '?'}
								</div>
							{/if}
						</div>

						{#if !isEditing}
							<div
								class="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							>
								{#if isConfirming}
									<button
										type="button"
										onclick={(e) => handleDelete(e, account.id)}
										class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
										title="Confirm delete"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4.5 12.75l6 6 9-13.5"
											/>
										</svg>
									</button>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											confirmDeleteId = null;
										}}
										class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-white transition-colors hover:bg-zinc-500"
										title="Cancel"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								{:else}
									<button
										type="button"
										onclick={(e) => handleEdit(e, account.id)}
										class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
										title="Edit profile"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
											/>
										</svg>
									</button>
									<button
										type="button"
										onclick={(e) => handleDelete(e, account.id)}
										class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-red-600/80"
										title="Delete profile"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
											/>
										</svg>
									</button>
								{/if}
							</div>
						{/if}
					</div>

					{#if isEditing}
						<form onsubmit={handleSaveName} class="flex flex-col items-center gap-2">
							<input
								type="text"
								bind:value={editName}
								class="w-40 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center text-sm text-white focus:border-[var(--accent-500)] focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none sm:w-48"
							/>
							<div class="flex gap-2">
								<button
									type="submit"
									class="rounded-lg bg-[var(--accent-600)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-700)]"
								>
									Save
								</button>
								<button
									type="button"
									onclick={handleCancelEdit}
									class="rounded-lg bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
								>
									Cancel
								</button>
							</div>
						</form>
					{:else}
						<span
							class="max-w-[9rem] truncate text-sm font-medium text-zinc-300 transition-colors group-hover:text-white sm:max-w-[10rem]"
						>
							{account.user.Name ?? 'Unknown'}
						</span>
					{/if}
				</div>
			{/each}

			<a
				href={resolve('/login?add=true')}
				class="group flex flex-col items-center gap-3 outline-none"
			>
				<div
					class="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/[0.03] transition-all duration-300 group-hover:border-white/50 group-hover:bg-white/[0.08] sm:h-36 sm:w-36"
				>
					<svg
						class="h-12 w-12 text-zinc-400 transition-all duration-300 group-hover:scale-110 group-hover:text-white sm:h-16 sm:w-16"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-zinc-500 transition-colors group-hover:text-white">
					Add Account
				</span>
			</a>
		</div>
	{/if}
</div>
