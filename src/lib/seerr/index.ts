export {
	SeerrError,
	jellyfinLogin,
	logout as seerrLogout,
	getMe as seerrGetMe,
	search as seerrSearch,
	getMovieDetails,
	getTvDetails,
	createRequest,
	MediaStatus,
	getMediaInfoState,
	getResultState,
	isMovieOrTvResult,
	isTvResult,
	isTvDetails,
	getResultTitle,
	getResultYear,
	getPosterUrl,
	getBackdropUrl,
	getProfileUrl,
	normalizeSeerrUrl
} from './client';

export type { SeerrSearchResponse, SeerrRequestPayload, ResultState } from './client';

export type {
	SeerrUser,
	MovieResult as SeerrMovieResult,
	TvResult as SeerrTvResult,
	PersonResult as SeerrPersonResult,
	MediaInfo as SeerrMediaInfo,
	MediaRequest as SeerrMediaRequest,
	MovieDetails as SeerrMovieDetails,
	TvDetails as SeerrTvDetails,
	Season as SeerrSeason,
	Cast as SeerrCast,
	Crew as SeerrCrew,
	SeerrSearchResult,
	SeerrDetails
} from './types';
