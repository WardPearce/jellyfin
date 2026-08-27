<script lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
	import { resolve } from '$app/paths';
	import { getItemImageUrl } from '$lib/jellyfin/client';
	import Image from '$lib/components/ui/Image.svelte';

	let {
		items,
		emptyMessage = 'No episodes found'
	}: {
		items: BaseItemDto[];
		emptyMessage?: string;
	} = $props();

	function formatRuntime(ticks?: number | null): string {
		if (!ticks) return '';
		const minutes = Math.round(ticks / 10_000_000 / 60);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function formatEpisodeNumber(episode: BaseItemDto): string {
		const s = String(episode.ParentIndexNumber ?? '?').padStart(2, '0');
		const e = String(episode.IndexNumber ?? '?').padStart(2, '0');
		return `S${s}E${e}`;
	}
</script>

{#if items.length === 0}
	<p class="text-sm text-zinc-500">{emptyMessage}</p>
{:else}
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each items as episode (episode.Id ?? episode.Name)}
			<a
				href={episode.Id ? resolve(`/watch/${episode.Id}`) : undefined}
				class="group flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
			>
				<div
					class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-black shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
				>
					<Image
						src={episode.Id ? getItemImageUrl(episode.Id, 'Primary', { maxWidth: 300 }) : undefined}
						alt={episode.Name ?? ''}
						aspectRatio="1/1"
					/>
				</div>
				<div class="min-w-0 flex-1 py-0.5">
					<span class="text-[11px] font-semibold tracking-wider text-[var(--accent-400)] uppercase">
						{formatEpisodeNumber(episode)}
					</span>
					<p class="mt-0.5 truncate text-sm font-medium text-zinc-100 group-hover:text-white">
						{episode.Name}
					</p>
					{#if episode.Overview}
						<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
							{episode.Overview}
						</p>
					{/if}
					{#if episode.RunTimeTicks}
						<span class="mt-1 inline-block text-[11px] text-zinc-500">
							{formatRuntime(episode.RunTimeTicks)}
						</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
