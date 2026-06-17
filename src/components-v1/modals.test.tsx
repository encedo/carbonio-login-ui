/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';

import OfflineModal from './modals';
import { setup } from '../tests/testUtils';

describe('modals', () => {
	test('loads modal screen', async () => {
		const onCloseFn = vi.fn();
		const open = true;
		setup(<OfflineModal open={open} onClose={onCloseFn} />);
		act(() => {
			vi.runOnlyPendingTimers();
		});
		expect(screen.getByText('Offline')).toBeVisible();

		const okButton = screen.getByRole('button', {
			name: /ok/i
		});
		expect(okButton).toBeEnabled();
		const offline = screen.getByTestId('offlineMsg');
		expect(within(offline).getByText(/offline/i)).toBeVisible();
	});
});
