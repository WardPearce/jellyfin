import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

let currentItem = $state<BaseItemDto | null>(null);
let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);

export function getPlayerState() {
	return {
		get currentItem() {
			return currentItem;
		},
		get isPlaying() {
			return isPlaying;
		},
		get currentTime() {
			return currentTime;
		},
		get duration() {
			return duration;
		},

		setItem(item: BaseItemDto | null) {
			currentItem = item;
		},

		setPlaying(playing: boolean) {
			isPlaying = playing;
		},

		setTime(time: number) {
			currentTime = time;
		},

		setDuration(dur: number) {
			duration = dur;
		}
	};
}
