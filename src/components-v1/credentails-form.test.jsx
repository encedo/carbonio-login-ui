/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';

import CredentialsForm from './credentials-form';
import { setup } from '../tests/testUtils';

describe('CredentialsForm', () => {
	test('submits user credentials on form submit', async () => {
		const submitCredentialsMock = vi.fn();
		const configuration = {
			twoFactorsEnabled: false,
			domain: 'demo.zextras.io',
			systemType: 'carbonio',
			minApiVersion: 2,
			authMethods: ['password', 'anonymous', 'saml'],
			version: '23.6.0',
			maxApiVersion: 3,
			destinationUrl: ''
		};

		const { user } = setup(
			<CredentialsForm
				authError
				submitCredentials={submitCredentialsMock}
				configuration={configuration}
				disableInputs={false}
				loading={false}
			/>
		);

		const username = screen.getByTestId('username');
		const password = screen.getByTestId('password');
		const usernameInput = within(username).getByRole('textbox');
		const passwordInput = within(password).getByLabelText(/password/i);
		const loginButton = screen.getByTestId('login');
		await user.clear(usernameInput);
		await user.type(usernameInput, 'testuser');
		await user.clear(passwordInput);
		await user.type(passwordInput, 'testpassword');
		expect(loginButton).toBeEnabled();
		await user.click(loginButton);

		expect(submitCredentialsMock).toHaveBeenCalledWith('testuser', 'testpassword');
	});

	test('displays SAML login button when SAML auth method is available', () => {
		setup(
			<CredentialsForm
				authError=""
				submitCredentials={vi.fn()}
				configuration={{ authMethods: ['saml'], destinationUrl: 'https://example.com' }}
				disableInputs={false}
				loading={false}
			/>
		);

		const samlButton = screen.getByTestId('loginSaml');
		expect(samlButton).toBeEnabled();
	});

	test('does not display SAML login button when SAML auth method is not available', () => {
		setup(
			<CredentialsForm
				authError=""
				submitCredentials={vi.fn()}
				configuration={{ authMethods: [], destinationUrl: 'https://example.com' }}
				disableInputs={false}
				loading={false}
			/>
		);

		const samlButton = screen.queryByLabelText('Login SAML');
		expect(samlButton).not.toBeInTheDocument();
	});
});
