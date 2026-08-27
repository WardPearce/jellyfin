<script lang="ts">
	import { getUserImageUrl } from '$lib/jellyfin/client';
	import { DropdownMenu } from 'bits-ui';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		user,
		onMenuToggle
	}: {
		user: {
			Name?: string | null;
			Id?: string;
			PrimaryImageTag?: string | null;
		};
		onMenuToggle?: () => void;
	} = $props();

	const avatarUrl = $derived(user.Id ? getUserImageUrl(user, { maxWidth: 80 }) : undefined);
</script>

<header class="glass flex h-16 items-center justify-between border-b px-4 lg:px-6">
	<div class="flex items-center gap-3">
		<Button
			variant="ghost"
			size="icon"
			class="lg:hidden"
			onclick={onMenuToggle}
			aria-label="Toggle menu"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
				/>
			</svg>
		</Button>
		<h1 class="text-lg font-semibold text-white">Jellyfin</h1>
	</div>

	<div class="flex items-center gap-3">
		<Button variant="ghost" size="icon" aria-label="Search">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<div class="flex items-center gap-2">
					<Avatar
						src={avatarUrl}
						alt={user.Name ?? 'User'}
						class="h-8 w-8"
						fallback={(user.Name ?? 'U')[0].toUpperCase()}
					/>
					<span class="hidden text-sm font-medium text-zinc-200 md:block">
						{user.Name}
					</span>
				</div>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				sideOffset={8}
				align="end"
				class="z-50 min-w-[180px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 shadow-lg"
			>
				<DropdownMenu.Item
					class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none hover:bg-zinc-800 hover:text-white"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					Profile
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none hover:bg-zinc-800 hover:text-white"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Settings
				</DropdownMenu.Item>
				<DropdownMenu.Separator class="my-1 h-px bg-zinc-800" />
				<DropdownMenu.Item
					class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 outline-none hover:bg-red-900/20 hover:text-red-300"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
						/>
					</svg>
					Sign Out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
