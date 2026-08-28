<script lang="ts">
	import { Menu, Search, Settings, User, LogOut } from '@lucide/svelte';
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
			<Menu class="h-5 w-5" />
		</Button>
		<h1 class="text-lg font-semibold text-white">Jellyfin</h1>
	</div>

	<div class="flex items-center gap-3">
		<Button variant="ghost" size="icon" aria-label="Search">
			<Search class="h-5 w-5" />
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
					<User class="h-4 w-4" />
					Profile
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none hover:bg-zinc-800 hover:text-white"
				>
					<Settings class="h-4 w-4" />
					Settings
				</DropdownMenu.Item>
				<DropdownMenu.Separator class="my-1 h-px bg-zinc-800" />
				<DropdownMenu.Item
					class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 outline-none hover:bg-red-900/20 hover:text-red-300"
				>
					<LogOut class="h-4 w-4" />
					Sign Out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
