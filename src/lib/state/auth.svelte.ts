import { writable } from '@macfja/svelte-persistent-store';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { clearApi, getApi, authenticateUser } from '$lib/jellyfin/client';
import { getCurrentUser } from '$lib/jellyfin/api';
import { jellyfinLogin, normalizeSeerrUrl, seerrGetMe, seerrLogout } from '$lib/seerr';

export interface Account {
	id: string;
	serverUrl: string;
	accessToken: string;
	user: UserDto;
	seerrUrl?: string;
	seerrApiKey?: string;
}

// Persistent stores
const accountsStore = writable<Account[]>('jellyfin_accounts', []);
const activeAccountIdStore = writable<string | null>('jellyfin_active_account_id', null);

// Reactive state
let accounts = $state<Account[]>([]);
let activeAccountId = $state<string | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Active account derived fields — updated via syncActiveAccount()
let serverUrl = $state('');
let accessToken = $state('');
let user = $state<UserDto | null>(null);
let seerrUrl = $state('');
let seerrApiKey = $state('');
let seerrError = $state<string | null>(null);
const isAuthenticated = $derived(!!accessToken && !!user);
const isSeerrConnected = $derived(!!seerrUrl);

// Sync stores to runes
accountsStore.subscribe((v) => {
	accounts = v;
	syncActiveAccount();
});
activeAccountIdStore.subscribe((v) => {
	activeAccountId = v;
	syncActiveAccount();
});

function syncActiveAccount() {
	const acct = activeAccountId ? accounts.find((a) => a.id === activeAccountId) : undefined;
	serverUrl = acct?.serverUrl ?? '';
	accessToken = acct?.accessToken ?? '';
	user = acct?.user ?? null;
	seerrUrl = acct?.seerrUrl ?? '';
	seerrApiKey = acct?.seerrApiKey ?? '';
}

function persistAccounts() {
	accountsStore.set([...accounts]);
}

export function getAuthState() {
	// Initial sync
	syncActiveAccount();

	return {
		get serverUrl() {
			return serverUrl;
		},
		get accessToken() {
			return accessToken;
		},
		get user() {
			return user;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		get isSeerrConnected() {
			return isSeerrConnected;
		},
		get seerrUrl() {
			return seerrUrl;
		},
		get seerrApiKey() {
			return seerrApiKey;
		},
		get seerrError() {
			return seerrError;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get accounts() {
			return accounts;
		},
		get activeAccountId() {
			return activeAccountId;
		},

		getAccount(id: string): Account | undefined {
			return accounts.find((a) => a.id === id);
		},

		async login(
			url: string,
			username: string,
			password: string,
			seerrUrlInput?: string,
			seerrApiKeyInput?: string
		) {
			isLoading = true;
			error = null;
			seerrError = null;
			try {
				const result = await authenticateUser(url, username, password);
				if (result.AccessToken && result.User) {
					const existing = accounts.find(
						(a) => a.serverUrl === url && a.user.Id === result.User?.Id
					);
					if (existing) {
						existing.accessToken = result.AccessToken;
						existing.user = result.User;
					} else {
						accounts.push({
							id: crypto.randomUUID(),
							serverUrl: url,
							accessToken: result.AccessToken,
							user: result.User
						});
					}

					const newId = existing?.id ?? accounts[accounts.length - 1].id;
					activeAccountIdStore.set(newId);
					persistAccounts();
					getApi(url, result.AccessToken);

					if (seerrUrlInput?.trim()) {
						const seerr = normalizeSeerrUrl(seerrUrlInput);
						await this.connectSeerr(seerr, username, password, newId, seerrApiKeyInput);
					}

					return true;
				}
				error = 'Authentication failed';
				return false;
			} catch (e: unknown) {
				const err = e as { response?: { data?: { message?: string } }; message?: string };
				error = err?.response?.data?.message ?? err?.message ?? 'Login failed';
				return false;
			} finally {
				isLoading = false;
			}
		},

		async connectSeerr(
			baseUrl: string,
			username: string,
			password: string,
			accountId?: string,
			apiKeyInput?: string
		) {
			const acct = accountId
				? accounts.find((a) => a.id === accountId)
				: activeAccountId
					? accounts.find((a) => a.id === activeAccountId)
					: undefined;
			if (!acct) return;

			const apiKey = apiKeyInput?.trim() || undefined;

			try {
				if (apiKey) {
					await seerrGetMe(baseUrl, apiKey);
					acct.seerrApiKey = apiKey;
					acct.seerrUrl = baseUrl;
				} else {
					await jellyfinLogin(baseUrl, username, password);
					delete acct.seerrApiKey;
					acct.seerrUrl = baseUrl;
				}
				seerrError = null;
			} catch (e: unknown) {
				if (apiKey && acct.seerrApiKey !== apiKey) delete acct.seerrApiKey;
				acct.seerrUrl = baseUrl;
				const err = e as { status?: number; message?: string };
				seerrError =
					err.status === 401
						? apiKey
							? 'Seerr API key is invalid. Check the key in Seerr settings.'
							: 'Seerr sign-in failed. Check the Seerr URL and try again.'
						: (err.message ?? 'Unable to connect to Seerr');
			}
			persistAccounts();
			syncActiveAccount();
		},

		logout() {
			if (seerrUrl) {
				seerrLogout(seerrUrl, seerrApiKey).catch(() => {});
			}
			activeAccountIdStore.set(null);
			serverUrl = '';
			accessToken = '';
			user = null;
			seerrUrl = '';
			seerrApiKey = '';
			seerrError = null;
			error = null;
			clearApi();
		},

		switchAccount(id: string) {
			const acct = accounts.find((a) => a.id === id);
			if (!acct) return;
			activeAccountIdStore.set(id);
			getApi(acct.serverUrl, acct.accessToken);
		},

		deleteAccount(id: string) {
			accounts = accounts.filter((a) => a.id !== id);
			persistAccounts();

			if (activeAccountId === id) {
				if (accounts.length > 0) {
					this.switchAccount(accounts[0].id);
				} else {
					this.logout();
				}
			}
		},

		async restore() {
			// Migrate legacy single-account storage
			const legacyUrl = localStorage.getItem('jellyfin_server_url');
			const legacyToken = localStorage.getItem('jellyfin_access_token');
			const legacyUser = localStorage.getItem('jellyfin_user');
			if (legacyUrl && legacyToken && legacyUser && accounts.length === 0) {
				try {
					const parsed = JSON.parse(legacyUser) as UserDto;
					const account: Account = {
						id: crypto.randomUUID(),
						serverUrl: legacyUrl,
						accessToken: legacyToken,
						user: parsed
					};
					accounts.push(account);
					activeAccountIdStore.set(account.id);
					persistAccounts();
					localStorage.removeItem('jellyfin_server_url');
					localStorage.removeItem('jellyfin_access_token');
					localStorage.removeItem('jellyfin_user');
				} catch {
					localStorage.removeItem('jellyfin_server_url');
					localStorage.removeItem('jellyfin_access_token');
					localStorage.removeItem('jellyfin_user');
				}
			}

			const active = activeAccountId ? accounts.find((a) => a.id === activeAccountId) : accounts[0];

			if (active) {
				if (!activeAccountId) {
					activeAccountIdStore.set(active.id);
				}
				try {
					getApi(active.serverUrl, active.accessToken);
					if (!active.user) {
						const currentUserResult = await getCurrentUser();
						active.user = currentUserResult;
						persistAccounts();
					}
				} catch {
					this.deleteAccount(active.id);
				}
			}
		},

		updateAccountName(id: string, name: string) {
			const acct = accounts.find((a) => a.id === id);
			if (!acct) return;
			acct.user = { ...acct.user, Name: name };
			persistAccounts();
			syncActiveAccount();
		},

		updateCurrentUser() {
			const active = activeAccountId ? accounts.find((a) => a.id === activeAccountId) : undefined;
			if (active && user) {
				active.user = user;
				persistAccounts();
			}
		}
	};
}

export type AuthState = ReturnType<typeof getAuthState>;
