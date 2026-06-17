/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import { advancedSupportedApi } from '../../vitest-env-setup';
import { getAdvancedSupported } from '../advanced-supported';

const okStatuses = [200, 201, 202];
const notOkStatuses = [418, 404, 500, 502, 302];

describe('getAdvancedSupported', () => {
	it.each(okStatuses)(
		'should return advanced supported TRUE when advanced in response (status %d)',
		async (code: number) => {
			advancedSupportedApi.withResponse(() =>
				HttpResponse.json({ items: ['carbonio-advanced'] }, { status: code })
			);
			const response = await getAdvancedSupported();
			expect(response).toEqual({ supported: true });
		}
	);

	it.each(okStatuses)(
		'should return advanced supported FALSE carbonio-advanced missing from response',
		async (code: number) => {
			advancedSupportedApi.withResponse(() =>
				HttpResponse.json({ items: ['carbonio-mailbox'] }, { status: code })
			);
			const response = await getAdvancedSupported();
			expect(response).toEqual({ supported: false });
		}
	);

	it.each(okStatuses)(
		'should return error when api ok (status %d) but body is not a json',
		async (code: number) => {
			advancedSupportedApi.withResponse(() => HttpResponse.text('Hello', { status: code }));
			const response = await getAdvancedSupported();
			expect(response).toEqual({ errorMessage: 'Failed to check Advanced installation' });
		}
	);

	it.each(notOkStatuses)(
		'should return error when api returns not ok status %d',
		async (code: number) => {
			advancedSupportedApi.withResponse(() => HttpResponse.json({}, { status: code }));
			const response = await getAdvancedSupported();
			expect(response).toEqual({ errorMessage: 'Failed to check Advanced installation' });
		}
	);

	it.each(notOkStatuses)(
		'should return error when api returns not status %d with carbonio-advanced',
		async (code: number) => {
			advancedSupportedApi.withResponse(() =>
				HttpResponse.json({ 'carbonio-advanced': [] }, { status: code })
			);
			const response = await getAdvancedSupported();
			expect(response).toEqual({ errorMessage: 'Failed to check Advanced installation' });
		}
	);

	it('should return error when api returns http error', async () => {
		advancedSupportedApi.withResponse(HttpResponse.error);
		const response = await getAdvancedSupported();
		expect(response).toEqual({ errorMessage: 'Failed to check Advanced installation' });
	});
});
