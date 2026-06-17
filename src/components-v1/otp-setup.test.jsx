/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import OtpSetup from './otp-setup';
import { useLoginConfigStore } from '../store/login/store';
import { setup } from '../tests/testUtils';

vi.mock('../store/login/store');

const defaultProps = {
	otpUri: 'otpauth://totp/Carbonio:user@example.com?secret=ABC123&issuer=Carbonio',
	onBackToLogin: vi.fn(),
	onVerifyCode: vi.fn(),
	onBack: vi.fn()
};

describe('OtpSetup', () => {
	beforeEach(() => {
		useLoginConfigStore.mockReturnValue({ loginLogo: undefined });
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		test('renders key UI elements', () => {
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.getByTestId('back_to_login')).toBeInTheDocument();
			expect(screen.getByTestId('form-wrapper')).toBeInTheDocument();
			expect(screen.getByTestId('otp_qr_code')).toBeInTheDocument();
			expect(screen.getByTestId('otp_secret_code')).toBeInTheDocument();
			expect(screen.getByTestId('otp_setup_code_input')).toBeInTheDocument();
			expect(screen.getByTestId('otp_setup_verify')).toBeInTheDocument();
		});

		test('renders secret code extracted from otp uri', () => {
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.getByTestId('otp_secret_code')).toHaveTextContent('ABC123');
		});

		test('renders empty secret when otp uri is invalid', () => {
			setup(<OtpSetup {...defaultProps} otpUri="not-a-valid-uri" />);
			expect(screen.getByTestId('otp_secret_code')).toHaveTextContent('');
		});

		test('does not render logo when loginLogo is undefined', () => {
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
		});

		test('renders logo without link when loginLogo has no url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150' }
			});
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			expect(screen.queryByRole('link')).not.toBeInTheDocument();
		});

		test('renders logo with link when loginLogo has a url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150', url: 'https://example.com' }
			});
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			const anchor = screen.getByRole('link');
			expect(anchor).toHaveAttribute('href', 'https://example.com');
			expect(anchor).toHaveAttribute('target', '_blank');
		});
	});

	describe('Actions', () => {
		test('calls onBackToLogin when back-to-login is clicked', async () => {
			const onBackToLogin = vi.fn();
			const { user } = setup(<OtpSetup {...defaultProps} onBackToLogin={onBackToLogin} />);
			await user.click(screen.getByTestId('back_to_login'));
			expect(onBackToLogin).toHaveBeenCalledTimes(1);
		});

		test('verify button is disabled when code is empty', () => {
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.getByTestId('otp_setup_verify')).toBeDisabled();
		});

		test('verify button is enabled after entering code', async () => {
			const { user } = setup(<OtpSetup {...defaultProps} />);
			await user.type(screen.getByRole('textbox'), '123456');
			expect(screen.getByTestId('otp_setup_verify')).toBeEnabled();
		});

		test('calls onVerifyCode with trustDevice false by default', async () => {
			const onVerifyCode = vi.fn();
			const { user } = setup(<OtpSetup {...defaultProps} onVerifyCode={onVerifyCode} />);
			await user.type(screen.getByRole('textbox'), '123456');
			await user.click(screen.getByTestId('otp_setup_verify'));
			expect(onVerifyCode).toHaveBeenCalledTimes(1);
			expect(onVerifyCode).toHaveBeenCalledWith('123456', false);
		});

		test('calls onVerifyCode with trustDevice true when checkbox is selected', async () => {
			const onVerifyCode = vi.fn();
			const { user } = setup(<OtpSetup {...defaultProps} onVerifyCode={onVerifyCode} />);
			await user.click(screen.getByText('Remember this device or IP'));
			await user.type(screen.getByRole('textbox'), '123456');
			await user.click(screen.getByTestId('otp_setup_verify'));
			expect(onVerifyCode).toHaveBeenCalledWith('123456', true);
		});

		test('calls onVerifyCode on Enter key submit', async () => {
			const onVerifyCode = vi.fn();
			const { user } = setup(<OtpSetup {...defaultProps} onVerifyCode={onVerifyCode} />);
			await user.type(screen.getByRole('textbox'), '123456');
			await user.keyboard('{Enter}');
			expect(onVerifyCode).toHaveBeenCalledWith('123456', false);
		});

		test('does not call onVerifyCode on Enter key when code is empty', async () => {
			const onVerifyCode = vi.fn();
			const { user } = setup(<OtpSetup {...defaultProps} onVerifyCode={onVerifyCode} />);
			await user.keyboard('{Enter}');
			expect(onVerifyCode).not.toHaveBeenCalled();
		});
	});

	describe('Error and disabled states', () => {
		test('shows verify error with attempts remaining', () => {
			setup(<OtpSetup {...defaultProps} verifyError="Invalid code" attemptsRemaining={2} />);
			expect(
				screen.getByText(
					'This code is incorrect or expired. Please try again. (2 attempts remaining)'
				)
			).toBeInTheDocument();
		});

		test('does not show verify error when verifyError is not provided', () => {
			setup(<OtpSetup {...defaultProps} />);
			expect(screen.queryByText(/This code is incorrect or expired/i)).not.toBeInTheDocument();
		});

		test('input and verify are disabled when disableInputs is true', async () => {
			const { user } = setup(<OtpSetup {...defaultProps} disableInputs />);
			const input = screen.getByRole('textbox');
			expect(input).toBeDisabled();
			expect(screen.getByTestId('otp_setup_verify')).toBeDisabled();
			await user.type(input, '123456');
			expect(screen.getByTestId('otp_setup_verify')).toBeDisabled();
		});
	});
});
