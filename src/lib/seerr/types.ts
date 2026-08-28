import type { components } from './generated-api';

export type SeerrUser = components['schemas']['User'];
export type MovieResult = components['schemas']['MovieResult'];
export type TvResult = components['schemas']['TvResult'];
export type PersonResult = components['schemas']['PersonResult'];
export type MediaInfo = components['schemas']['MediaInfo'];
export type MediaRequest = components['schemas']['MediaRequest'];
export type MovieDetails = components['schemas']['MovieDetails'];
export type TvDetails = components['schemas']['TvDetails'];
export type Season = components['schemas']['Season'];
export type Cast = components['schemas']['Cast'];
export type Crew = components['schemas']['Crew'];

export type SeerrSearchResult = MovieResult | TvResult;
export type SeerrDetails = MovieDetails | TvDetails;
