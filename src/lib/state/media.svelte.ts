import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import {
	getLibraries,
	getItems,
	getContinueWatching,
	getNextUp,
	BaseItemKind,
	ItemSortBy,
	SortOrder
} from '$lib/jellyfin/api';
import { getItemImageUrl } from '$lib/jellyfin/client';
import type { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

export interface LibraryItem {
	id: string;
	name: string;
	type?: string;
	primaryImageTag?: string;
	primaryImageUrl?: string;
	productionYear?: number;
	communityRating?: number;
	officialRating?: string;
	overview?: string;
	playedPercentage?: number;
	seriesName?: string;
	seasonName?: string;
	indexNumber?: number;
	primaryImageAspectRatio?: number;
}

let libraries = $state<BaseItemDto[]>([]);
let continueWatching = $state<BaseItemDto[]>([]);
let nextUp = $state<BaseItemDto[]>([]);
let recentlyAdded = $state<BaseItemDto[]>([]);
let recentlyAddedMovies = $state<BaseItemDto[]>([]);
let recentlyAddedTv = $state<BaseItemDto[]>([]);
let libraryItems = $state<BaseItemDto[]>([]);
let loading = $state(false);
let loadingMore = $state(false);
let error = $state<string | null>(null);
let libraryStartIndex = $state(0);
let libraryHasMore = $state(true);
let currentParentId = $state<string | null>(null);
const LIBRARY_PAGE_SIZE = 50;

export function getMediaState() {
	return {
		get libraries() {
			return libraries;
		},
		get continueWatching() {
			return continueWatching;
		},
		get nextUp() {
			return nextUp;
		},
		get recentlyAdded() {
			return recentlyAdded;
		},
		get recentlyAddedMovies() {
			return recentlyAddedMovies;
		},
		get recentlyAddedTv() {
			return recentlyAddedTv;
		},
		get libraryItems() {
			return libraryItems;
		},
		get loading() {
			return loading;
		},
		get loadingMore() {
			return loadingMore;
		},
		get hasMore() {
			return libraryHasMore;
		},
		get error() {
			return error;
		},

		async loadLibraries(userId: string) {
			try {
				const result = await getLibraries(userId);
				const viewLibraries = result.Items ?? [];

				if (viewLibraries.length === 0) {
					libraries = [];
					return;
				}

				const viewIds = viewLibraries.map((l) => l.Id!).filter(Boolean);
				const itemsResult = await getItems(userId, {
					ids: viewIds,
					enableImageTypes: ['Banner', 'Primary', 'Thumb'] as ImageType[],
					imageTypeLimit: 1,
					fields: ['DateCreated'] as ItemFields[]
				});

				const itemsById: Record<string, BaseItemDto> = {};
				for (const item of itemsResult.Items ?? []) {
					if (item.Id) itemsById[item.Id] = item;
				}

				libraries = viewLibraries.map((lib) => ({
					...lib,
					ImageTags: itemsById[lib.Id!]?.ImageTags ?? lib.ImageTags
				}));
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load libraries';
			}
		},

		async loadHomePage(userId: string) {
			loading = true;
			error = null;
			try {
				const movieTvLibs = libraries.filter(
					(lib) => lib.CollectionType === 'movies' || lib.CollectionType === 'tvshows'
				);

				const [continueResult, nextUpResult, ...libraryResults] = await Promise.allSettled([
					getContinueWatching(userId, 12),
					getNextUp(userId, 12),
					...movieTvLibs.map((lib) =>
						getItems(userId, {
							parentId: lib.Id!,
							includeItemTypes: [
								lib.CollectionType === 'movies' ? BaseItemKind.Movie : BaseItemKind.Series
							],
							sortBy: [ItemSortBy.DateCreated],
							sortOrder: [SortOrder.Descending],
							limit: 16,
							fields: ['MediaSources', 'Genres', 'MediaStreams'] as ItemFields[],
							enableImageTypes: ['Primary', 'Backdrop', 'Thumb'] as ImageType[],
							imageTypeLimit: 1
						})
					)
				]);

				if (continueResult.status === 'fulfilled') {
					continueWatching = continueResult.value.Items ?? [];
				}
				if (nextUpResult.status === 'fulfilled') {
					nextUp = nextUpResult.value.Items ?? [];
				}

				const movies: BaseItemDto[] = [];
				const tv: BaseItemDto[] = [];
				libraryResults.forEach((r, i) => {
					const items = r.status === 'fulfilled' ? (r.value.Items ?? []) : [];
					const lib = movieTvLibs[i];
					if (lib?.CollectionType === 'movies') {
						movies.push(...items);
					} else {
						tv.push(...items);
					}
				});

				recentlyAddedMovies = movies;
				recentlyAddedTv = tv;
				recentlyAdded = [...movies, ...tv];
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load home page';
			} finally {
				loading = false;
			}
		},

		async loadLibraryItems(userId: string, parentId: string) {
			loading = true;
			error = null;
			currentParentId = parentId;
			libraryStartIndex = 0;
			libraryHasMore = true;
			try {
				const lib = libraries.find((l) => l.Id === parentId);
				const includeTypes =
					lib?.CollectionType === 'movies'
						? [BaseItemKind.Movie]
						: lib?.CollectionType === 'tvshows'
							? [BaseItemKind.Series]
							: undefined;

				const result = await getItems(userId, {
					parentId,
					includeItemTypes: includeTypes,
					recursive: true,
					sortBy: [ItemSortBy.SortName],
					sortOrder: [SortOrder.Ascending],
					fields: ['MediaSources', 'Genres', 'MediaStreams'] as ItemFields[],
					enableImageTypes: ['Primary', 'Backdrop', 'Logo'] as ImageType[],
					imageTypeLimit: 1,
					startIndex: 0,
					limit: LIBRARY_PAGE_SIZE
				});
				libraryItems = result.Items ?? [];
				libraryStartIndex = libraryItems.length;
				libraryHasMore = libraryStartIndex < (result.TotalRecordCount ?? 0);
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load library items';
			} finally {
				loading = false;
			}
		},

		async loadMoreLibraryItems(userId: string) {
			if (loadingMore || !libraryHasMore || !currentParentId) return;
			loadingMore = true;
			error = null;
			try {
				const lib = libraries.find((l) => l.Id === currentParentId);
				const includeTypes =
					lib?.CollectionType === 'movies'
						? [BaseItemKind.Movie]
						: lib?.CollectionType === 'tvshows'
							? [BaseItemKind.Series]
							: undefined;

				const result = await getItems(userId, {
					parentId: currentParentId,
					includeItemTypes: includeTypes,
					recursive: true,
					sortBy: [ItemSortBy.SortName],
					sortOrder: [SortOrder.Ascending],
					fields: ['MediaSources', 'Genres', 'MediaStreams'] as ItemFields[],
					enableImageTypes: ['Primary', 'Backdrop', 'Logo'] as ImageType[],
					imageTypeLimit: 1,
					startIndex: libraryStartIndex,
					limit: LIBRARY_PAGE_SIZE
				});
				const newItems = result.Items ?? [];
				libraryItems = [...libraryItems, ...newItems];
				libraryStartIndex = libraryItems.length;
				libraryHasMore = libraryStartIndex < (result.TotalRecordCount ?? 0);
			} catch (e: unknown) {
				error = (e as Error)?.message ?? 'Failed to load more library items';
			} finally {
				loadingMore = false;
			}
		},

		clearLibraryItems() {
			libraryItems = [];
			libraryStartIndex = 0;
			libraryHasMore = true;
			currentParentId = null;
		}
	};
}

export function itemToLibraryItem(item: BaseItemDto): LibraryItem {
	return {
		id: item.Id ?? '',
		name: item.Name ?? '',
		type: item.Type,
		primaryImageTag: item.ImageTags?.['Primary'],
		primaryImageUrl: item.Id ? getItemImageUrl(item.Id, 'Primary', { maxWidth: 300 }) : undefined,
		productionYear: item.ProductionYear ?? undefined,
		communityRating: item.CommunityRating ?? undefined,
		officialRating: item.OfficialRating ?? undefined,
		overview: item.Overview ?? undefined,
		playedPercentage: item.UserData?.PlayedPercentage ?? undefined,
		seriesName: item.SeriesName ?? undefined,
		seasonName: item.SeasonName ?? undefined,
		indexNumber: item.IndexNumber ?? undefined,
		primaryImageAspectRatio: item.PrimaryImageAspectRatio ?? undefined
	};
}
