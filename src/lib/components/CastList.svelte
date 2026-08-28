<script lang="ts">
	import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
	import { resolve } from '$app/paths';
	import { getItemImageUrl } from '$lib/jellyfin/client';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	let {
		people
	}: {
		people: BaseItemPerson[];
	} = $props();

	function personImageUrl(person: BaseItemPerson): string | undefined {
		if (!person.Id) return undefined;
		return getItemImageUrl(person.Id, 'Primary', { maxWidth: 120 });
	}
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
	{#each people as person (person.Id ?? person.Name)}
		<a
			href={person.Id ? resolve(`/item/${person.Id}`) : undefined}
			class="group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
		>
			<div class="transition-transform duration-200 group-hover:scale-105">
				<Avatar src={personImageUrl(person)} alt={person.Name ?? ''} class="h-20 w-20" />
			</div>
			<div class="w-full min-w-0 text-center">
				<p class="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
					{person.Name}
				</p>
				{#if person.Role}
					<p class="truncate text-xs text-zinc-500">{person.Role}</p>
				{/if}
			</div>
		</a>
	{/each}
</div>
