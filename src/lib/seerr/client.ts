import type {
	MediaInfo,
	MediaRequest as SeerrMediaRequest,
	MovieDetails,
	MovieResult,
	PersonResult,
	SeerrDetails,
	SeerrSearchResult,
	SeerrUser,
	TvDetails,
	TvResult
} from './types';

const API_ROUTE = '/api/v1';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Seerr validates query params strictly against RFC 3986 and rejects reserved
// characters. `encodeURIComponent` leaves `!'()*` unescaped and `URLSearchParams`
// serializes spaces as `+`, both of which fail that validation, so encode
// everything outside the unreserved set explicitly.
function encodeParam(value: string): string {
	return encodeURIComponent(value).replace(/[!'()*]/g, (char) => {
		const hex = char.charCodeAt(0).toString(16).toUpperCase();
		return `%${hex.length === 1 ? `0${hex}` : hex}`;
	});
}

export interface SeerrSearchResponse {
	page?: number;
	totalPages?: number;
	totalResults?: number;
	results?: (MovieResult | TvResult | PersonResult)[];
}

export interface SeerrRequestPayload {
	mediaType: 'movie' | 'tv';
	mediaId: number;
	seasons?: number[] | 'all';
}

export class SeerrError extends Error {
	readonly status: number;
	readonly url?: string;

	constructor(message: string, status: number, url?: string) {
		super(message);
		this.name = 'SeerrError';
		this.status = status;
		this.url = url;
	}
}

function buildApiUrl(baseUrl: string, path: string): string {
	const normalized = baseUrl
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/api\/v1$/, '');
	return `${normalized}${API_ROUTE}${path}`;
}

async function request<T>(
	baseUrl: string,
	path: string,
	init: RequestInit = {},
	apiKey?: string
): Promise<T> {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'application/json');
	if (apiKey) headers.set('X-Api-Key', apiKey);

	let res: Response;
	try {
		res = await fetch(buildApiUrl(baseUrl, path), {
			...init,
			credentials: 'include',
			headers
		});
	} catch {
		throw new SeerrError('Unable to reach the Seerr server', 0, path);
	}

	if (!res.ok) {
		let message = `Seerr request failed (${res.status})`;
		try {
			const body = (await res.json()) as { message?: string; error?: string };
			message = body.message ?? body.error ?? message;
		} catch {
			// Non-JSON error body; keep the default message.
		}
		throw new SeerrError(message, res.status, path);
	}

	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

export async function jellyfinLogin(
	baseUrl: string,
	username: string,
	password: string
): Promise<SeerrUser> {
	return request<SeerrUser>(baseUrl, '/auth/jellyfin', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export async function logout(baseUrl: string, apiKey?: string): Promise<{ status?: string }> {
	return request(baseUrl, '/auth/logout', { method: 'POST' }, apiKey);
}

export async function getMe(baseUrl: string, apiKey?: string): Promise<SeerrUser> {
	return request<SeerrUser>(baseUrl, '/auth/me', {}, apiKey);
}

export async function search(
	baseUrl: string,
	query: string,
	language = 'en',
	apiKey?: string
): Promise<SeerrSearchResponse> {
	const params = `query=${encodeParam(query)}&language=${encodeParam(language)}`;
	return request<SeerrSearchResponse>(baseUrl, `/search?${params}`, {}, apiKey);
}

export async function getMovieDetails(
	baseUrl: string,
	movieId: number,
	apiKey?: string,
	language = 'en'
): Promise<MovieDetails> {
	const params = `language=${encodeParam(language)}`;
	return request<MovieDetails>(baseUrl, `/movie/${movieId}?${params}`, {}, apiKey);
}

export async function getTvDetails(
	baseUrl: string,
	tvId: number,
	apiKey?: string,
	language = 'en'
): Promise<TvDetails> {
	const params = `language=${encodeParam(language)}`;
	return request<TvDetails>(baseUrl, `/tv/${tvId}?${params}`, {}, apiKey);
}

export async function createRequest(
	baseUrl: string,
	payload: SeerrRequestPayload,
	apiKey?: string
): Promise<SeerrMediaRequest> {
	return request<SeerrMediaRequest>(
		baseUrl,
		'/request',
		{
			method: 'POST',
			body: JSON.stringify(payload)
		},
		apiKey
	);
}

export const MediaStatus = {
	UNKNOWN: 1,
	PENDING: 2,
	PROCESSING: 3,
	PARTIALLY_AVAILABLE: 4,
	AVAILABLE: 5,
	DELETED: 6
} as const;

export type ResultState = 'requestable' | 'requested' | 'available';

export function isTvDetails(details: SeerrDetails): details is TvDetails {
	return 'seasons' in details || 'numberOfSeason' in details;
}

export function getMediaInfoState(mediaInfo: MediaInfo | null | undefined): ResultState {
	if (!mediaInfo) return 'requestable';
	if (
		mediaInfo.status === MediaStatus.AVAILABLE ||
		mediaInfo.status === MediaStatus.PARTIALLY_AVAILABLE
	) {
		return 'available';
	}
	if (
		mediaInfo.status === MediaStatus.PENDING ||
		mediaInfo.status === MediaStatus.PROCESSING ||
		(mediaInfo.requests?.length ?? 0) > 0
	) {
		return 'requested';
	}
	return 'requestable';
}

export function getResultState(result: SeerrSearchResult): ResultState {
	return getMediaInfoState(result.mediaInfo);
}

export function isMovieOrTvResult(
	result: MovieResult | TvResult | PersonResult
): result is SeerrSearchResult {
	return result.mediaType === 'movie' || result.mediaType === 'tv';
}

export function isTvResult(result: SeerrSearchResult): result is TvResult {
	return !('title' in result);
}

export function getResultTitle(result: SeerrSearchResult): string {
	if (isTvResult(result)) return result.name ?? 'Untitled';
	return result.title ?? 'Untitled';
}

export function getResultYear(result: SeerrSearchResult): string | undefined {
	const raw = isTvResult(result) ? result.firstAirDate : result.releaseDate;
	return raw?.slice(0, 4);
}

export function getPosterUrl(
	posterPath?: string | null,
	size: 'w185' | 'w300' | 'w500' | 'w780' = 'w300'
): string | undefined {
	if (!posterPath) return undefined;
	return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

export function getBackdropUrl(
	backdropPath?: string | null,
	size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string | undefined {
	if (!backdropPath) return undefined;
	const suffix = size === 'original' ? 'original' : size;
	return `${TMDB_IMAGE_BASE}/${suffix}${backdropPath}`;
}

export function getProfileUrl(profilePath?: string | null): string | undefined {
	if (!profilePath) return undefined;
	return `${TMDB_IMAGE_BASE}/w185${profilePath}`;
}

export function normalizeSeerrUrl(input: string): string {
	return input.trim().replace(/\/+$/, '');
}
