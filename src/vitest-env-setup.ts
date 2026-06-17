// Copyright (C) 2011-2020 Zextras
/* eslint-disable import/no-extraneous-dependencies */
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { DefaultBodyType, http, HttpResponse, StrictRequest } from 'msw';
import { SetupServer } from 'msw/node';

import server from './mocks/server';

beforeEach(() => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448
	vi.useFakeTimers({ shouldAdvanceTime: true });
});
beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => {
	server.resetHandlers();
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
});

export const getSetupServer = (): SetupServer => server;

export type APIInterceptor = {
	getLastRequest: () => StrictRequest<DefaultBodyType>;
	getCalledTimes: () => number;
};

export const createAPIInterceptor = (
	method: 'get' | 'post',
	url: string,
	response: () => HttpResponse<DefaultBodyType>
): APIInterceptor => {
	let calledTimes = 0;
	const requests: Array<StrictRequest<DefaultBodyType>> = [];

	getSetupServer().use(
		http[method](url, async ({ request }) => {
			calledTimes += 1;
			requests.push(request);
			return response();
		})
	);

	return {
		getLastRequest: () => requests[requests.length - 1],
		getCalledTimes: () => calledTimes
	};
};

const advancedSupportedURL = '/services/catalog/services';
export const advancedSupportedApi = {
	withError: (): APIInterceptor =>
		createAPIInterceptor('get', advancedSupportedURL, HttpResponse.error),
	withResponse: (response: () => HttpResponse<DefaultBodyType>): APIInterceptor =>
		createAPIInterceptor('get', advancedSupportedURL, response),
	supported: (): APIInterceptor =>
		createAPIInterceptor('get', advancedSupportedURL, () =>
			HttpResponse.json({ items: ['carbonio-advanced'] }, { status: 200 })
		),
	notSupported: (): APIInterceptor =>
		createAPIInterceptor('get', advancedSupportedURL, () =>
			HttpResponse.json({ items: ['carbonio-files'] }, { status: 200 })
		)
};
