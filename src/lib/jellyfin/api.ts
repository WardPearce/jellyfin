import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api.js';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api.js';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api.js';
import { getMediaSegmentsApi } from '@jellyfin/sdk/lib/utils/api/media-segments-api.js';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api.js';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api.js';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api.js';
import { getApi, getAccessToken } from './client';
import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto-query-result';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by.js';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order.js';
import type { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { PlaybackInfoDto } from '@jellyfin/sdk/lib/generated-client/models/playback-info-dto';
import type { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ThumbnailImageInit } from 'vidstack';

const WEB_DEVICE_PROFILE: DeviceProfile = {
	Name: 'Jellyfin Web',
	MaxStreamingBitrate: 120_000_000,
	MaxStaticBitrate: 120_000_000,
	MusicStreamingTranscodingBitrate: 384_000,
	DirectPlayProfiles: [
		{
			Type: 'Video',
			Container: 'webm|mkv|mp4|mov|m4v',
			VideoCodec: 'h264|hevc|vp9|av1',
			AudioCodec: 'aac|mp3|opus|flac|ac3|eac3'
		},
		{
			Type: 'Audio',
			Container: 'mp3|flac|aac|m4a|wav|ogg|oga|webma|wma|alac',
			AudioCodec: 'mp3|aac|flac|alac|opus|wma|wav'
		},
		{ Type: 'Photo' }
	],
	TranscodingProfiles: [
		{
			Type: 'Video',
			Context: 'Streaming',
			Protocol: 'hls',
			Container: 'ts',
			VideoCodec: 'h264',
			AudioCodec: 'aac',
			MaxAudioChannels: '2',
			MinSegments: 1,
			SegmentLength: 0,
			BreakOnNonKeyFrames: false
		}
	],
	SubtitleProfiles: [
		{ Format: 'srt', Method: 'External' },
		{ Format: 'vtt', Method: 'External' },
		{ Format: 'ass', Method: 'External' },
		{ Format: 'ssa', Method: 'External' },
		{ Format: 'sub', Method: 'External' },
		{ Format: 'smi', Method: 'External' },
		{ Format: 'sami', Method: 'External' },
		{ Format: 'ttml', Method: 'External' },
		{ Format: 'txt', Method: 'External' }
	]
};

function buildWebPlaybackInfo(
	_itemId: string,
	options: { maxBitrate?: number; directPlay?: boolean; startPositionTicks?: number } = {}
): PlaybackInfoDto {
	return {
		DeviceProfile: {
			...WEB_DEVICE_PROFILE,
			MaxStreamingBitrate: options.maxBitrate ?? WEB_DEVICE_PROFILE.MaxStreamingBitrate
		},
		EnableDirectPlay: options.directPlay ?? true,
		EnableDirectStream: options.directPlay ?? true,
		EnableTranscoding: true,
		StartTimeTicks: options.startPositionTicks
	};
}

const BROWSER_COMPATIBLE_CONTAINERS = new Set(['mp4', 'webm', 'm4v', 'mov', 'ogv', 'ogg']);

export async function getLibraries(userId: string): Promise<BaseItemDtoQueryResult> {
	const api = getApi();
	const userViewsApi = getUserViewsApi(api);
	const result = await userViewsApi.getUserViews({ userId });
	return result.data;
}

export async function getItems(
	userId: string,
	options: {
		parentId?: string;
		includeItemTypes?: BaseItemKind[];
		recursive?: boolean;
		sortBy?: ItemSortBy[];
		sortOrder?: SortOrder[];
		limit?: number;
		startIndex?: number;
		fields?: ItemFields[];
		enableImageTypes?: ImageType[];
		imageTypeLimit?: number;
		isPlayed?: boolean;
		ids?: string[];
	} = {}
): Promise<BaseItemDtoQueryResult> {
	const api = getApi();
	const itemsApi = getItemsApi(api);
	const result = await itemsApi.getItems({
		userId,
		parentId: options.parentId,
		includeItemTypes: options.includeItemTypes,
		recursive: options.recursive ?? true,
		sortBy: options.sortBy,
		sortOrder: options.sortOrder,
		limit: options.limit,
		startIndex: options.startIndex,
		fields: options.fields,
		enableImageTypes: options.enableImageTypes,
		imageTypeLimit: options.imageTypeLimit ?? 1,
		isPlayed: options.isPlayed,
		ids: options.ids
	});
	return result.data;
}

export async function getItem(itemId: string, userId?: string) {
	const api = getApi();
	const itemsApi = getItemsApi(api);
	const result = await itemsApi.getItems({
		ids: [itemId],
		userId,
		fields: [
			'Overview',
			'Taglines',
			'OriginalTitle',
			'ProductionLocations',
			'Genres',
			'Studios',
			'People',
			'MediaSources',
			'MediaStreams',
			'ProviderIds',
			'Trickplay'
		] as ItemFields[],
		enableImageTypes: ['Primary', 'Backdrop', 'Logo', 'Thumb'] as ImageType[],
		imageTypeLimit: 1
	});
	return result.data.Items?.[0] ?? null;
}

export async function getContinueWatching(userId: string, limit: number = 12) {
	const api = getApi();
	const itemsApi = getItemsApi(api);
	const result = await itemsApi.getResumeItems({
		userId,
		limit,
		fields: ['MediaSources', 'Genres', 'MediaStreams'] as ItemFields[],
		enableImageTypes: ['Primary', 'Backdrop', 'Thumb'] as ImageType[],
		imageTypeLimit: 1
	});
	return result.data;
}

export async function getNextUp(userId: string, limit: number = 12) {
	const api = getApi();
	const tvShowsApi = getTvShowsApi(api);
	const result = await tvShowsApi.getNextUp({
		userId,
		limit,
		fields: ['MediaSources', 'Genres', 'MediaStreams'] as ItemFields[],
		enableImageTypes: ['Primary', 'Backdrop', 'Thumb'] as ImageType[],
		imageTypeLimit: 1
	});
	return result.data;
}

export async function getPlaybackInfo(
	itemId: string,
	options: { maxBitrate?: number; directPlay?: boolean; startPositionTicks?: number } = {}
) {
	const api = getApi();
	const mediaInfoApi = getMediaInfoApi(api);
	const result = await mediaInfoApi.getPostedPlaybackInfo({
		itemId,
		playbackInfoDto: buildWebPlaybackInfo(itemId, options)
	});
	return result.data;
}

export async function getMediaSegments(itemId: string) {
	const api = getApi();
	const mediaSegmentsApi = getMediaSegmentsApi(api);
	const result = await mediaSegmentsApi.getItemSegments({ itemId });
	return result.data.Items ?? [];
}

export async function reportPlaybackStart(itemId: string, playSessionId?: string) {
	const api = getApi();
	const playstateApi = getPlaystateApi(api);
	await playstateApi.reportPlaybackStart({
		playbackStartInfo: {
			ItemId: itemId,
			IsPaused: false,
			IsMuted: false,
			PlaySessionId: playSessionId
		}
	});
}

export async function reportPlaybackProgress(
	itemId: string,
	positionTicks: number,
	options: { playSessionId?: string; isPaused?: boolean } = {}
) {
	const api = getApi();
	const playstateApi = getPlaystateApi(api);
	await playstateApi.reportPlaybackProgress({
		playbackProgressInfo: {
			ItemId: itemId,
			PositionTicks: positionTicks,
			IsPaused: options.isPaused ?? false,
			PlaySessionId: options.playSessionId
		}
	});
}

export async function reportPlaybackStopped(
	itemId: string,
	positionTicks: number,
	playSessionId?: string
) {
	const api = getApi();
	const playstateApi = getPlaystateApi(api);
	await playstateApi.reportPlaybackStopped({
		playbackStopInfo: {
			ItemId: itemId,
			PositionTicks: positionTicks,
			PlaySessionId: playSessionId
		}
	});
}

export async function getCurrentUser() {
	const api = getApi();
	const userApi = getUserApi(api);
	const result = await userApi.getCurrentUser();
	return result.data;
}

export async function getSeasons(seriesId: string, userId?: string) {
	const api = getApi();
	const tvShowsApi = getTvShowsApi(api);
	const result = await tvShowsApi.getSeasons({
		seriesId,
		userId,
		fields: ['ItemCounts', 'PrimaryImageAspectRatio'] as ItemFields[],
		enableImageTypes: ['Primary', 'Backdrop'] as ImageType[],
		imageTypeLimit: 1,
		isMissing: false
	});
	return result.data.Items ?? [];
}

export async function getEpisodes(
	seriesId: string,
	userId?: string,
	seasonId?: string,
	seasonNumber?: number
) {
	const api = getApi();
	const tvShowsApi = getTvShowsApi(api);
	const result = await tvShowsApi.getEpisodes({
		seriesId,
		userId,
		seasonId,
		season: seasonNumber,
		fields: ['Overview', 'MediaSources', 'MediaStreams'] as ItemFields[],
		enableImageTypes: ['Primary', 'Backdrop', 'Thumb'] as ImageType[],
		imageTypeLimit: 1,
		isMissing: false
	});
	return result.data.Items ?? [];
}

export function getStreamUrl(
	itemId: string,
	mediaSourceId: string,
	tag?: string,
	container?: string | null
): string {
	const api = getApi();
	const baseUrl = api.basePath;
	const params = new URLSearchParams({
		Static: 'true',
		mediaSourceId
	});
	if (tag) params.set('Tag', tag);
	const token = getAccessToken();
	if (token) params.set('api_key', token);
	const ext = container ? `.${container}` : '';
	return `${baseUrl}/Videos/${itemId}/stream${ext}?${params.toString()}`;
}

export function getHlsStreamUrl(itemId: string, mediaSourceId: string): string {
	const api = getApi();
	const baseUrl = api.basePath;
	const params = new URLSearchParams({ mediaSourceId, AudioCodec: 'aac' });
	const token = getAccessToken();
	if (token) params.set('api_key', token);
	return `${baseUrl}/Videos/${itemId}/master.m3u8?${params.toString()}`;
}

export function getTranscodeUrl(relativeUrl: string): string {
	const api = getApi();
	if (/^https?:\/\//.test(relativeUrl)) return relativeUrl;
	return `${api.basePath}${relativeUrl}`;
}

export function getBestStreamUrl(itemId: string, mediaSource: MediaSourceInfo): string {
	const container = mediaSource.Container?.toLowerCase();
	if (
		mediaSource.SupportsDirectStream &&
		container &&
		BROWSER_COMPATIBLE_CONTAINERS.has(container)
	) {
		return getStreamUrl(
			itemId,
			mediaSource.Id ?? '',
			mediaSource.ETag ?? undefined,
			mediaSource.Container
		);
	}
	if (mediaSource.SupportsTranscoding && mediaSource.TranscodingUrl) {
		return getTranscodeUrl(mediaSource.TranscodingUrl);
	}
	return getHlsStreamUrl(itemId, mediaSource.Id ?? '');
}

export async function searchItems(
	userId: string,
	searchTerm: string,
	options: {
		includeItemTypes?: BaseItemKind[];
		limit?: number;
		startIndex?: number;
		fields?: ItemFields[];
		enableImageTypes?: ImageType[];
		imageTypeLimit?: number;
	} = {}
): Promise<BaseItemDtoQueryResult> {
	const api = getApi();
	const itemsApi = getItemsApi(api);
	const result = await itemsApi.getItems({
		userId,
		searchTerm,
		recursive: true,
		includeItemTypes: options.includeItemTypes,
		limit: options.limit ?? 50,
		startIndex: options.startIndex,
		fields: options.fields,
		enableImageTypes: options.enableImageTypes,
		imageTypeLimit: options.imageTypeLimit ?? 1
	});
	return result.data;
}

export function getTrickplayStoryboard(
	item: BaseItemDto,
	mediaSourceId: string
): ThumbnailImageInit[] | null {
	const trickplay = item.Trickplay;
	if (!trickplay) return null;

	const sourceMap = mediaSourceId
		? (trickplay[mediaSourceId] ?? Object.values(trickplay)[0])
		: Object.values(trickplay)[0];
	if (!sourceMap) return null;

	const widths = Object.keys(sourceMap)
		.map(Number)
		.filter((w) => !Number.isNaN(w) && w > 0)
		.sort((a, b) => a - b);
	if (!widths.length) return null;

	const width = widths.find((w) => w >= 320) ?? widths[widths.length - 1];
	const info = sourceMap[String(width)];
	if (!info || !info.TileWidth || !info.TileHeight || !info.Interval || !info.ThumbnailCount) {
		return null;
	}

	const tileW = info.TileWidth;
	const tileH = info.TileHeight;
	const interval = info.Interval / 1000;
	const thumbW = info.Width ?? 0;
	const thumbH = info.Height ?? 0;
	const totalTiles = info.ThumbnailCount;

	const tilesPerSheet = tileW * tileH;
	const sheetCount = Math.ceil(totalTiles / tilesPerSheet);
	const baseUrl = getApi().basePath;
	const token = getAccessToken();

	const images: ThumbnailImageInit[] = [];
	let tileIndex = 0;

	for (let sheet = 0; sheet < sheetCount; sheet++) {
		const tilesInSheet = Math.min(tilesPerSheet, totalTiles - tileIndex);

		const params = new URLSearchParams();
		if (mediaSourceId) params.set('MediaSourceId', mediaSourceId);
		if (token) params.set('api_key', token);
		const query = params.toString();
		const tileUrl = `${baseUrl}/Videos/${item.Id}/Trickplay/${width}/${sheet}.jpg${query ? `?${query}` : ''}`;

		for (let pos = 0; pos < tilesInSheet; pos++) {
			const col = pos % tileW;
			const row = Math.floor(pos / tileW);
			images.push({
				url: tileUrl,
				startTime: tileIndex * interval,
				width: thumbW,
				height: thumbH,
				coords: {
					x: col * thumbW,
					y: row * thumbH
				}
			});
			tileIndex++;
		}
	}

	return images;
}

export function getSubtitleTracks(
	mediaStreams: Array<{
		Type?: string;
		DeliveryMethod?: string;
		DeliveryUrl?: string | null;
		Language?: string | null;
		DisplayTitle?: string | null;
		Index?: number;
		Codec?: string | null;
		IsDefault?: boolean;
		IsForced?: boolean;
		IsExternal?: boolean;
	}>
): Array<{
	src: string;
	label: string;
	language: string;
	kind: 'subtitles' | 'captions';
	type: 'vtt' | 'srt' | 'ass' | 'ssa';
	default: boolean;
}> {
	const api = getApi();
	const tracks: Array<{
		src: string;
		label: string;
		language: string;
		kind: 'subtitles' | 'captions';
		type: 'vtt' | 'srt' | 'ass' | 'ssa';
		default: boolean;
	}> = [];

	for (const stream of mediaStreams) {
		if (stream.Type !== 'Subtitle') continue;
		if (stream.DeliveryMethod !== 'External') continue;
		if (!stream.DeliveryUrl) continue;

		const url = /^https?:\/\//.test(stream.DeliveryUrl)
			? stream.DeliveryUrl
			: `${api.basePath}${stream.DeliveryUrl}`;

		const codec = stream.Codec?.toLowerCase() ?? '';
		const type =
			codec === 'vtt' ? 'vtt' : codec === 'ass' ? 'ass' : codec === 'ssa' ? 'ssa' : 'srt';
		const isDefault = (stream.IsDefault ?? false) && !tracks.some((t) => t.default);

		tracks.push({
			src: url,
			label: stream.DisplayTitle ?? stream.Language ?? `Track ${stream.Index ?? tracks.length}`,
			language: stream.Language ?? 'und',
			kind: 'subtitles',
			type,
			default: isDefault
		});
	}

	return tracks;
}

export { BaseItemKind, ItemSortBy, SortOrder };
