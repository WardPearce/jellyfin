<script lang="ts">
	import { getAuth, getMedia } from '$lib/state/index.svelte';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';
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
					</div>

					{#if !isEditing}
						<span
							class="max-w-[9rem] truncate text-sm font-medium text-zinc-300 transition-colors group-hover:text-white sm:max-w-[10rem]"
						>
							{account.user.Name ?? 'Unknown'}
						</span>
					{/if}

					{#if !isEditing && !isConfirming}
						<div
							class="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
						>
							<button
								type="button"
								onclick={(e) => handleEdit(e, account.id)}
								class="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
								title="Edit profile"
							>
								<Pencil class="h-3.5 w-3.5" />
								Edit
							</button>
							<button
								type="button"
								onclick={(e) => handleDelete(e, account.id)}
								class="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600/80"
								title="Delete profile"
							>
								<Trash2 class="h-3.5 w-3.5" />
								Delete
							</button>
						</div>
					{:else if isConfirming}
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={(e) => handleDelete(e, account.id)}
								class="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
							>
								Confirm
							</button>
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									confirmDeleteId = null;
								}}
								class="rounded-lg bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
							>
								Cancel
							</button>
						</div>
					{/if}

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
					<Plus
						class="h-12 w-12 text-zinc-400 transition-all duration-300 group-hover:scale-110 group-hover:text-white sm:h-16 sm:w-16"
						strokeWidth={1.5}
					/>
				</div>
				<span class="text-sm font-medium text-zinc-500 transition-colors group-hover:text-white">
					Add Account
				</span>
			</a>
		</div>
	{/if}
</div>
