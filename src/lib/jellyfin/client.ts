import { Jellyfin } from '@jellyfin/sdk';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api.js';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api.js';
import type { Api } from '@jellyfin/sdk';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ImageRequestParameters } from '@jellyfin/sdk/lib/models/api/image-request-parameters';

let api: Api | null = null;
let jellyfin: Jellyfin | null = null;
let accessToken: string | null = null;

function getJellyfinInstance(): Jellyfin {
	if (!jellyfin) {
		jellyfin = new Jellyfin({
			clientInfo: { name: 'Jellyfin-Svelte', version: '0.1.0' },
			deviceInfo: {
				id: crypto.randomUUID(),
				name: `${navigator?.platform ?? 'Web'} - Jellyfin Svelte`
			}
		});
	}
	return jellyfin;
}

export function getApi(serverUrl?: string, token?: string): Api {
	const jf = getJellyfinInstance();
	if (serverUrl) {
		api = jf.createApi(serverUrl, token);
		accessToken = token ?? null;
	}
	if (!api) {
		throw new Error('Jellyfin API not initialized. Provide a server URL.');
	}
	return api;
}

export function getAccessToken(): string | null {
	return accessToken;
}

export function getApiInstance(): Api | null {
	return api;
}

export function clearApi(): void {
	api = null;
}

export async function authenticateUser(
	serverUrl: string,
	username: string,
	password: string
): Promise<AuthenticationResult> {
	const jf = getJellyfinInstance();
	const tempApi = jf.createApi(serverUrl);
	const userApi = getUserApi(tempApi);
	const result = await userApi.authenticateUserByName({
		authenticateUserByName: { Username: username, Pw: password }
	});

	if (result.data.AccessToken && serverUrl) {
		api = jf.createApi(serverUrl, result.data.AccessToken);
	}

	return result.data;
}

export function getItemImageUrl(
	itemId: string,
	imageType: string = 'Primary',
	params?: ImageRequestParameters
): string | undefined {
	if (!api) return undefined;
	const imageApi = getImageApi(api);
	return imageApi.getItemImageUrlById(itemId, imageType as ImageType, params);
}

export function getBackdropUrls(item: BaseItemDto, params?: ImageRequestParameters): string[] {
	if (!api || !item.Id || !item.BackdropImageTags?.length) return [];
	const imageApi = getImageApi(api);
	return imageApi.getItemBackdropImageUrls(item, params);
}

export function getLibraryImageUrl(
	itemId: string,
	imageType: string,
	params?: ImageRequestParameters
): string | undefined {
	if (!api || !itemId) return undefined;
	const imageApi = getImageApi(api);
	return imageApi.getItemImageUrlById(itemId, imageType as ImageType, params);
}

export function getUserImageUrl(
	user: { Id?: string | null; PrimaryImageTag?: string | null },
	params?: ImageRequestParameters
): string | undefined {
	if (!api || !user.Id) return undefined;
	const imageApi = getImageApi(api);
	return imageApi.getUserImageUrl(user as never, params);
}
