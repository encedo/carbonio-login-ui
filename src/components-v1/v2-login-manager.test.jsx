/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import V2LoginManager from './v2-login-manager';
import { generateOtp, postV2Login, submitOtp } from '../services/v2-service';
import { setup } from '../tests/testUtils';
import { saveCredentials } from '../utils';

vi.mock('../services/v2-service');
vi.mock('../utils', () => ({
	saveCredentials: vi.fn()
}));

vi.mock('./credentials-form', () => ({
	default: function CredentialsFormMock({ submitCredentials }) {
		return (
			<div data-testid="credentials-form">
				<button
					type="button"
					data-testid="submit-credentials"
					onClick={() => submitCredentials('user@example.com', 'password123')}
				>
					submit
				</button>
			</div>
		);
	}
}));

vi.mock('./otp-wizard', () => ({
	default: function OtpWizardMock({ onProceed }) {
		return (
			<div data-testid="otp-wizard">
				<button
					type="button"
					data-testid="otp-wizard-proceed"
					onClick={() => onProceed('OfficePhone')}
				>
					proceed
				</button>
			</div>
		);
	}
}));

vi.mock('./otp-setup', () => ({
	default: function OtpSetupMock({ otpUri, verifyError, attemptsRemaining, onVerifyCode, onBack }) {
		return (
			<div data-testid="otp-setup">
				<div data-testid="otp-setup-uri">{otpUri}</div>
				<div data-testid="otp-setup-error">{verifyError}</div>
				<div data-testid="otp-setup-attempts">{String(attemptsRemaining)}</div>
				<button
					type="button"
					data-testid="otp-setup-verify"
					onClick={() => onVerifyCode('123456', true)}
				>
					verify
				</button>
				<button type="button" data-testid="otp-setup-back" onClick={onBack}>
					back
				</button>
			</div>
		);
	}
}));

vi.mock('./backup-codes', () => ({
	default: function BackupCodesMock({ staticOtpCodes }) {
		return (
			<div data-testid="backup-codes">{staticOtpCodes.map((entry) => entry.code).join(',')}</div>
		);
	}
}));

vi.mock('./change-password-form', () => ({
	default: function ChangePasswordFormMock() {
		return <div data-testid="change-password-form" />;
	}
}));
vi.mock('./forget-password', () => ({
	default: function ForgetPasswordMock() {
		return <div data-testid="forget-password" />;
	}
}));
vi.mock('./modals', () => ({
	default: function OfflineModalMock() {
		return <div data-testid="offline-modal" />;
	}
}));
vi.mock('./spinner', () => ({
	default: function SpinnerMock() {
		return <div data-testid="spinner" />;
	}
}));

describe('V2LoginManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		saveCredentials.mockResolvedValue(undefined);
	});

	test('goes to two-factor flow after credential login requiring existing OTP methods', async () => {
		postV2Login.mockResolvedValueOnce({
			status: 200,
			redirected: false,
			json: () =>
				Promise.resolve({
					'2FA': true,
					otp: [{ label: 'Auth App', id: 'otp-1' }]
				})
		});

		setup(<V2LoginManager configuration={{ destinationUrl: '/home' }} disableInputs={false} />);

		await waitFor(() => {
			expect(screen.getByTestId('submit-credentials')).toBeInTheDocument();
		});
		screen.getByTestId('submit-credentials').click();

		await waitFor(() => {
			expect(screen.getByText('Two-Step-Authentication')).toBeInTheDocument();
		});
		expect(postV2Login).toHaveBeenCalledWith('password', 'user@example.com', 'password123');
		expect(saveCredentials).toHaveBeenCalledWith('user@example.com', 'password123');
	});

	test('goes to OTP wizard when 2FA is enabled and no otp devices exist', async () => {
		postV2Login.mockResolvedValueOnce({
			status: 200,
			redirected: false,
			json: () =>
				Promise.resolve({
					'2FA': true,
					'otp-wizard': true,
					otp: []
				})
		});

		setup(<V2LoginManager configuration={{ destinationUrl: '/home' }} disableInputs={false} />);

		screen.getByTestId('submit-credentials').click();

		await waitFor(() => {
			expect(screen.getByTestId('otp-wizard')).toBeInTheDocument();
		});
	});

	test('moves from OTP wizard to OTP setup after generating OTP', async () => {
		postV2Login.mockResolvedValueOnce({
			status: 200,
			redirected: false,
			json: () =>
				Promise.resolve({
					'2FA': true,
					'otp-wizard': true,
					otp: []
				})
		});
		generateOtp.mockResolvedValueOnce({
			secret: 'ABC123',
			label: 'OfficePhone',
			issuer: 'Carbonio',
			algorithm: 'SHA1',
			digits_length: 6,
			period: 30,
			id: 'generated-id',
			static_otp_codes: [{ code: 'S1' }, { code: 'S2' }]
		});

		setup(<V2LoginManager configuration={{ destinationUrl: '/home' }} disableInputs={false} />);

		screen.getByTestId('submit-credentials').click();
		await waitFor(() => {
			expect(screen.getByTestId('otp-wizard')).toBeInTheDocument();
		});

		screen.getByTestId('otp-wizard-proceed').click();

		await waitFor(() => {
			expect(screen.getByTestId('otp-setup')).toBeInTheDocument();
		});
		expect(generateOtp).toHaveBeenCalledWith('OfficePhone');
		expect(screen.getByTestId('otp-setup-uri')).toHaveTextContent('otpauth://totp/OfficePhone');
	});

	test('moves from OTP setup to backup codes when OTP verify succeeds', async () => {
		postV2Login.mockResolvedValueOnce({
			status: 200,
			redirected: false,
			json: () => Promise.resolve({ '2FA': true, 'otp-wizard': true, otp: [] })
		});
		generateOtp.mockResolvedValueOnce({
			secret: 'ABC123',
			label: 'OfficePhone',
			issuer: 'Carbonio',
			algorithm: 'SHA1',
			digits_length: 6,
			period: 30,
			id: 'generated-id',
			static_otp_codes: [{ code: 'CODE-A' }, { code: 'CODE-B' }]
		});
		submitOtp.mockResolvedValueOnce({ status: 200 });

		setup(<V2LoginManager configuration={{ destinationUrl: '/home' }} disableInputs={false} />);

		screen.getByTestId('submit-credentials').click();
		await waitFor(() => {
			expect(screen.getByTestId('otp-wizard')).toBeInTheDocument();
		});
		screen.getByTestId('otp-wizard-proceed').click();
		await waitFor(() => {
			expect(screen.getByTestId('otp-setup')).toBeInTheDocument();
		});

		screen.getByTestId('otp-setup-verify').click();

		await waitFor(() => {
			expect(screen.getByTestId('backup-codes')).toBeInTheDocument();
		});
		expect(submitOtp).toHaveBeenCalledWith('generated-id', '123456', true);
		expect(screen.getByTestId('backup-codes')).toHaveTextContent('CODE-A,CODE-B');
	});

	test('shows OTP setup error and attempts remaining when setup verification fails', async () => {
		postV2Login.mockResolvedValueOnce({
			status: 200,
			redirected: false,
			json: () => Promise.resolve({ '2FA': true, 'otp-wizard': true, otp: [] })
		});
		generateOtp.mockResolvedValueOnce({
			secret: 'ABC123',
			label: 'OfficePhone',
			issuer: 'Carbonio',
			algorithm: 'SHA1',
			digits_length: 6,
			period: 30,
			id: 'generated-id',
			static_otp_codes: [{ code: 'CODE-A' }]
		});
		submitOtp.mockResolvedValueOnce({
			status: 401,
			json: () => Promise.resolve({ attemptsRemaining: 2 })
		});

		setup(<V2LoginManager configuration={{ destinationUrl: '/home' }} disableInputs={false} />);

		screen.getByTestId('submit-credentials').click();
		await waitFor(() => {
			expect(screen.getByTestId('otp-wizard')).toBeInTheDocument();
		});
		screen.getByTestId('otp-wizard-proceed').click();
		await waitFor(() => {
			expect(screen.getByTestId('otp-setup')).toBeInTheDocument();
		});

		screen.getByTestId('otp-setup-verify').click();

		await waitFor(() => expect(screen.getByTestId('otp-setup-error')).toHaveTextContent('invalid'));
		expect(screen.getByTestId('otp-setup-attempts')).toHaveTextContent('2');
		expect(screen.queryByTestId('backup-codes')).not.toBeInTheDocument();
	});
});
