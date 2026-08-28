<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Check, ChevronDown } from '@lucide/svelte';

	let {
		items,
		value,
		placeholder = 'Select an option',
		onChange = () => {}
	}: {
		items: { value: string; label: string }[];
		value: string;
		placeholder?: string;
		onChange?: (value: string) => void;
	} = $props();
</script>

<SelectPrimitive.Root type="single" {items} bind:value onValueChange={(v) => onChange(v ?? value)}>
	<SelectPrimitive.Trigger
		class="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors outline-none hover:border-white/25 focus:border-[var(--accent-500)]/50 focus:ring-2 focus:ring-[var(--accent-500)]/30 data-[placeholder]:text-zinc-500"
	>
		<SelectPrimitive.Value {placeholder} />
		<ChevronDown class="h-4 w-4 shrink-0 text-zinc-400" />
	</SelectPrimitive.Trigger>

	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			class="z-50 max-h-72 min-w-[var(--bits-select-content-trigger-width)] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl shadow-black/60"
			sideOffset={6}
		>
			<SelectPrimitive.Viewport class="p-0.5">
				{#each items as item (item.value)}
					<SelectPrimitive.Item {...{ value: item.value }} label={item.label}>
						{#snippet child({ props, selected })}
							<div
								{...props}
								class="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-300 transition-colors outline-none select-none data-[highlighted]:bg-white/10 data-[highlighted]:text-white {selected
									? 'text-white'
									: ''}"
							>
								<span>{item.label}</span>
								{#if selected}
									<Check class="h-4 w-4 text-[var(--accent-400)]" />
								{/if}
							</div>
						{/snippet}
					</SelectPrimitive.Item>
				{/each}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
</SelectPrimitive.Root>
