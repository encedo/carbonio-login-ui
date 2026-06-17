/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import FormSelector from './form-selector';
import { getAuthSupported } from '../services/auth-configuration-service';
import { setup } from '../tests/testUtils';

vi.mock('../services/auth-configuration-service');

describe('FormSelector', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should render ServerNotResponding component on error', async () => {
		getAuthSupported.mockRejectedValueOnce();

		setup(<FormSelector destinationUrl="/home" domain="example.com" />);

		await waitFor(() => {
			expect(screen.getByTestId('server-not-responding')).toBeInTheDocument();
		});
	});

	// test('should render V2LoginManager component when configuration is available and API version is supported', async () => {
	// 	const mockConfiguration = {
	// 		minApiVersion: 2,
	// 		maxApiVersion: 3,
	// 		destinationUrl: '/home'
	// 	};
	// 	getAuthSupported.mockResolvedValueOnce(mockConfiguration);

	// 	setup(<FormSelector destinationUrl="/home" domain="example.com" />);

	// 	await waitFor(() => {
	// 		expect(screen.getByTestId('v2-login-manager')).toBeInTheDocument();
	// 	});

	// 	expect(V2LoginManager).toHaveBeenCalledWith(
	// 		{
	// 			configuration: mockConfiguration,
	// 			disableInputs: false
	// 		},
	// 		{}
	// 	);
	// });

	// test('should render V1LoginManager component when configuration is available and API version is supported', async () => {
	// 	const mockConfiguration = {
	// 		minApiVersion: 1,
	// 		maxApiVersion: 2,
	// 		destinationUrl: '/home'
	// 	};
	// 	getAuthSupported.mockResolvedValueOnce(mockConfiguration);

	// 	setup(<FormSelector destinationUrl="/home" domain="example.com" />);

	// 	await waitFor(() => {
	// 		expect(screen.getByTestId('v1-login-manager')).toBeInTheDocument();
	// 	});

	// 	expect(V1LoginManager).toHaveBeenCalledWith(
	// 		{
	// 			configuration: mockConfiguration,
	// 			disableInputs: false
	// 		},
	// 		{}
	// 	);
	// });

	test('should render NotSupportedVersion component when configuration is available but API version is not supported', async () => {
		const mockConfiguration = {
			minApiVersion: 3,
			maxApiVersion: 4,
			destinationUrl: '/home'
		};
		getAuthSupported.mockResolvedValueOnce(mockConfiguration);

		setup(<FormSelector destinationUrl="/home" domain="example.com" />);

		await waitFor(() => {
			expect(screen.getByTestId('not-supported-version')).toBeInTheDocument();
		});
	});
});
