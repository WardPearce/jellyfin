import { setContext, getContext } from 'svelte';
import { getAuthState } from './auth.svelte';
import { getMediaState } from './media.svelte';
import { getPlayerState } from './player.svelte';
import { getSettingsState } from './settings.svelte';

const AUTH_KEY = Symbol('auth');
const MEDIA_KEY = Symbol('media');
const PLAYER_KEY = Symbol('player');
const SETTINGS_KEY = Symbol('settings');

export function provideAuth() {
	const state = getAuthState();
	setContext(AUTH_KEY, state);
	return state;
}

export function provideMedia() {
	const state = getMediaState();
	setContext(MEDIA_KEY, state);
	return state;
}

export function providePlayer() {
	const state = getPlayerState();
	setContext(PLAYER_KEY, state);
	return state;
}

export function provideSettings() {
	const state = getSettingsState();
	setContext(SETTINGS_KEY, state);
	return state;
}

export function getAuth() {
	return getContext<ReturnType<typeof getAuthState>>(AUTH_KEY);
}

export function getMedia() {
	return getContext<ReturnType<typeof getMediaState>>(MEDIA_KEY);
}

export function getPlayer() {
	return getContext<ReturnType<typeof getPlayerState>>(PLAYER_KEY);
}

export function getSettings() {
	return getContext<ReturnType<typeof getSettingsState>>(SETTINGS_KEY);
}
