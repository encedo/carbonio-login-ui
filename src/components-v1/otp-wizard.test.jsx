/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import OtpWizard from './otp-wizard';
import { useLoginConfigStore } from '../store/login/store';
import { setup } from '../tests/testUtils';

vi.mock('../store/login/store');

const defaultProps = {
	onBackToLogin: vi.fn(),
	onProceed: vi.fn()
};

describe('OtpWizard', () => {
	beforeEach(() => {
		useLoginConfigStore.mockReturnValue({ loginLogo: undefined });
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		test('renders the back-to-login button', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('back_to_login')).toBeInTheDocument();
		});

		test('renders the form wrapper', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('form-wrapper')).toBeInTheDocument();
		});

		test('renders the OTP name input', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('otp_wizard_name_input')).toBeInTheDocument();
		});

		test('renders the proceed button', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('otp_wizard_proceed')).toBeInTheDocument();
		});

		test('renders title text', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(
				screen.getByText(
					'Your organization introduced the Two-Factor-Authentication to improve the security of your account.'
				)
			).toBeInTheDocument();
		});

		test('renders description text', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(
				screen.getByText(
					'Before you start, create a unique name to help you identify it later in your security settings.'
				)
			).toBeInTheDocument();
		});

		test('renders hint text', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(
				screen.getByText(
					'Maximum 20 characters. Do not use special characters, spaces, or hyphens.'
				)
			).toBeInTheDocument();
		});

		test('does not render logo when loginLogo is undefined', () => {
			useLoginConfigStore.mockReturnValue({ loginLogo: undefined });
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
		});

		test('renders logo without link when loginLogo has no url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150' }
			});
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			expect(screen.queryByRole('link')).not.toBeInTheDocument();
		});

		test('renders logo with link when loginLogo has a url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150', url: 'https://example.com' }
			});
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			const anchor = screen.getByRole('link');
			expect(anchor).toHaveAttribute('href', 'https://example.com');
			expect(anchor).toHaveAttribute('target', '_blank');
		});
	});

	describe('Back button', () => {
		test('calls onBackToLogin when back button is clicked', async () => {
			const onBackToLogin = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onBackToLogin={onBackToLogin} />);
			await user.click(screen.getByTestId('back_to_login'));
			expect(onBackToLogin).toHaveBeenCalledTimes(1);
		});
	});

	describe('Input validation', () => {
		test('input accepts valid alphanumeric name', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'MyOTP123');
			expect(input).toHaveValue('MyOTP123');
		});

		test('sets error when input contains special characters', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'bad name!');
			// Input should show error state — the input container gets aria-invalid or similar
			expect(input).toHaveValue('bad name!');
			// Proceed button should be disabled due to invalid chars
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('sets error when input contains spaces', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'bad name');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('sets error when input contains hyphens', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'bad-name');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('sets error when input exceeds 20 characters', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'a'.repeat(21));
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('clears error when input becomes valid after invalid entry', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			// Type invalid then clear and type valid
			await user.type(input, 'bad name!');
			await user.clear(input);
			await user.type(input, 'GoodName');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeEnabled();
		});

		test('allows exactly 20 characters', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'a'.repeat(20));
			expect(screen.getByTestId('otp_wizard_proceed')).toBeEnabled();
		});
	});

	describe('Proceed button state', () => {
		test('proceed button is disabled when input is empty', () => {
			setup(<OtpWizard {...defaultProps} />);
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('proceed button is disabled when disableInputs is true even with valid input', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} disableInputs />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'ValidName');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('proceed button is enabled with valid input', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'ValidName');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeEnabled();
		});

		test('proceed button is disabled with input containing special characters', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'bad@name');
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});

		test('proceed button is disabled when input exceeds 20 characters', async () => {
			const { user } = setup(<OtpWizard {...defaultProps} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'a'.repeat(21));
			expect(screen.getByTestId('otp_wizard_proceed')).toBeDisabled();
		});
	});

	describe('Proceed action', () => {
		test('calls onProceed with the OTP name when proceed button is clicked', async () => {
			const onProceed = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onProceed={onProceed} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'MyToken');
			await user.click(screen.getByTestId('otp_wizard_proceed'));
			expect(onProceed).toHaveBeenCalledTimes(1);
			expect(onProceed).toHaveBeenCalledWith('MyToken');
		});

		test('does not call onProceed when proceed button is clicked with empty input', async () => {
			const onProceed = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onProceed={onProceed} />);
			await user.click(screen.getByTestId('otp_wizard_proceed'));
			expect(onProceed).not.toHaveBeenCalled();
		});

		test('does not call onProceed when disableInputs is true', async () => {
			const onProceed = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onProceed={onProceed} disableInputs />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'ValidName');
			await user.click(screen.getByTestId('otp_wizard_proceed'));
			expect(onProceed).not.toHaveBeenCalled();
		});

		test('calls onProceed via form submit (Enter key)', async () => {
			const onProceed = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onProceed={onProceed} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'MyToken');
			await user.keyboard('{Enter}');
			expect(onProceed).toHaveBeenCalledTimes(1);
			expect(onProceed).toHaveBeenCalledWith('MyToken');
		});

		test('does not call onProceed on Enter key when input is invalid', async () => {
			const onProceed = vi.fn();
			const { user } = setup(<OtpWizard {...defaultProps} onProceed={onProceed} />);
			const input = screen.getByRole('textbox');
			await user.type(input, 'bad name!');
			await user.keyboard('{Enter}');
			expect(onProceed).not.toHaveBeenCalled();
		});
	});

	describe('Disabled inputs prop', () => {
		test('input is disabled when disableInputs is true', () => {
			setup(<OtpWizard {...defaultProps} disableInputs />);
			expect(screen.getByRole('textbox')).toBeDisabled();
		});

		test('input is enabled when disableInputs is false', () => {
			setup(<OtpWizard {...defaultProps} disableInputs={false} />);
			expect(screen.getByRole('textbox')).toBeEnabled();
		});
	});
});
