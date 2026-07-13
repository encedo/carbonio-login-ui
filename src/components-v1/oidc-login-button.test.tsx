/*
 * SPDX-FileCopyrightText: 2026 Encedo Limited <https://www.encedo.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Tests for the OIDC SSO button — the fork's addition to page-layout.tsx.
 *
 * Kept in a file of its own rather than appended to the upstream
 * page-layout.test.jsx: this repo is regularly merged with zextras/devel, and a
 * separate file cannot conflict. It is also the only guard that would catch an
 * upstream merge silently dropping the button — otherwise we would find out in
 * production.
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import PageLayout from './page-layout';
import { setup } from '../tests/testUtils';
import { APIInterceptor, createAPIInterceptor } from '../vitest-env-setup';

const ORIGIN = 'https://mail.example.com';
const HEALTH_URL = '/oidc/health';

const oidcHealthApi = {
	available: (): APIInterceptor =>
		createAPIInterceptor('get', HEALTH_URL, () => new HttpResponse(null, { status: 200 })),
	unavailable: (): APIInterceptor =>
		createAPIInterceptor('get', HEALTH_URL, () => new HttpResponse(null, { status: 503 })),
	networkError: (): APIInterceptor => createAPIInterceptor('get', HEALTH_URL, HttpResponse.error)
};

describe('OIDC SSO button', () => {
	const originalLocation = window.location;
	let assign: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		assign = vi.fn();
		Object.defineProperty(window, 'location', {
			writable: true,
			value: { ...originalLocation, origin: ORIGIN, search: '', assign }
		});
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
	});

	it('is shown when the connector reports healthy', async () => {
		oidcHealthApi.available();

		setup(<PageLayout version={1} isAdvanced={false} />);

		expect(await screen.findByTestId('loginOidc')).toBeInTheDocument();
	});

	it('navigates to /oidc/authorize with no query string when clicked', async () => {
		oidcHealthApi.available();

		const { user } = setup(<PageLayout version={1} isAdvanced={false} />);
		await user.click(await screen.findByTestId('loginOidc'));

		// Exactly this URL: the connector only ever reads ?domain=, and the old
		// ?redirectUrl=${destinationUrl} put a literal "null" in the URL when the
		// user landed on the login page directly.
		expect(assign).toHaveBeenCalledWith('/oidc/authorize');
		expect(assign).toHaveBeenCalledTimes(1);
	});

	it('is hidden when the connector responds with an error', async () => {
		const api = oidcHealthApi.unavailable();

		setup(<PageLayout version={1} isAdvanced={false} />);

		// Wait for the health check to actually resolve — asserting absence before
		// the effect has run would pass even if the gating were broken.
		await waitFor(() => expect(api.getCalledTimes()).toBe(1));
		expect(screen.queryByTestId('loginOidc')).not.toBeInTheDocument();
	});

	it('is hidden when the connector is unreachable', async () => {
		const api = oidcHealthApi.networkError();

		setup(<PageLayout version={1} isAdvanced={false} />);

		await waitFor(() => expect(api.getCalledTimes()).toBe(1));
		expect(screen.queryByTestId('loginOidc')).not.toBeInTheDocument();
	});

	it('is not rendered on the Advanced login form', async () => {
		const api = oidcHealthApi.available();

		setup(<PageLayout version={1} isAdvanced />);

		// The button lives in the CE branch only (Advanced renders FormSelector).
		await waitFor(() => expect(api.getCalledTimes()).toBe(1));
		expect(screen.queryByTestId('loginOidc')).not.toBeInTheDocument();
	});
});
