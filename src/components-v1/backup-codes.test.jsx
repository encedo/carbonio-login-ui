/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import BackupCodes from './backup-codes';
import { useLoginConfigStore } from '../store/login/store';
import { setup } from '../tests/testUtils';

vi.mock('../store/login/store');

const sampleCodes = [{ code: 'AAAA-BBBB' }, { code: 'CCCC-DDDD' }, { code: 'EEEE-FFFF' }];

const defaultProps = {
	staticOtpCodes: sampleCodes,
	onLoginToWorkspace: vi.fn(),
	configuration: undefined
};

describe('BackupCodes', () => {
	let originalClipboard;
	let writeTextMock;
	let clipboardMock;
	let originalCreateObjectURL;
	let originalRevokeObjectURL;
	let originalExecCommand;
	let createObjectURLMock;
	let revokeObjectURLMock;
	let execCommandMock;

	beforeEach(() => {
		useLoginConfigStore.mockReturnValue({ loginLogo: undefined });
		vi.clearAllMocks();

		originalClipboard = navigator.clipboard;
		writeTextMock = vi.fn().mockResolvedValue(undefined);
		clipboardMock = { writeText: writeTextMock };
		Object.defineProperty(navigator, 'clipboard', {
			get: () => clipboardMock,
			configurable: true
		});

		originalCreateObjectURL = URL.createObjectURL;
		originalRevokeObjectURL = URL.revokeObjectURL;
		originalExecCommand = document.execCommand;

		createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
		revokeObjectURLMock = vi.fn();
		execCommandMock = vi.fn().mockReturnValue(true);

		Object.defineProperty(URL, 'createObjectURL', {
			value: createObjectURLMock,
			configurable: true
		});
		Object.defineProperty(URL, 'revokeObjectURL', {
			value: revokeObjectURLMock,
			configurable: true
		});
		Object.defineProperty(document, 'execCommand', {
			value: execCommandMock,
			configurable: true
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'clipboard', {
			value: originalClipboard,
			configurable: true
		});
		Object.defineProperty(URL, 'createObjectURL', {
			value: originalCreateObjectURL,
			configurable: true
		});
		Object.defineProperty(URL, 'revokeObjectURL', {
			value: originalRevokeObjectURL,
			configurable: true
		});
		Object.defineProperty(document, 'execCommand', {
			value: originalExecCommand,
			configurable: true
		});
	});

	describe('Rendering', () => {
		test('renders key UI elements', () => {
			setup(<BackupCodes {...defaultProps} />);

			expect(screen.getByTestId('form-wrapper')).toBeInTheDocument();
			expect(screen.getByTestId('backup_codes_grid')).toBeInTheDocument();
			expect(screen.getByTestId('backup_codes_copy')).toBeInTheDocument();
			expect(screen.getByTestId('backup_codes_save')).toBeInTheDocument();
			expect(screen.getByTestId('backup_codes_checkbox')).toBeInTheDocument();
			expect(screen.getByTestId('backup_codes_login')).toBeInTheDocument();
		});

		test('renders each backup code', () => {
			setup(<BackupCodes {...defaultProps} />);
			expect(screen.getByText('AAAA-BBBB')).toBeInTheDocument();
			expect(screen.getByText('CCCC-DDDD')).toBeInTheDocument();
			expect(screen.getByText('EEEE-FFFF')).toBeInTheDocument();
		});

		test('does not render logo when loginLogo is undefined', () => {
			setup(<BackupCodes {...defaultProps} />);
			expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
		});

		test('renders logo without link when loginLogo has no url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150' }
			});
			setup(<BackupCodes {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			expect(screen.queryByRole('link')).not.toBeInTheDocument();
		});

		test('renders logo with link when loginLogo has a url', () => {
			useLoginConfigStore.mockReturnValue({
				loginLogo: { image: '/logo.png', width: '150', url: 'https://example.com' }
			});
			setup(<BackupCodes {...defaultProps} />);
			expect(screen.getByTestId('logo')).toBeInTheDocument();
			const anchor = screen.getByRole('link');
			expect(anchor).toHaveAttribute('href', 'https://example.com');
			expect(anchor).toHaveAttribute('target', '_blank');
		});
	});

	describe('Actions and state', () => {
		test('login button is disabled until saved checkbox is confirmed', async () => {
			const { user } = setup(<BackupCodes {...defaultProps} />);
			const loginButton = screen.getByTestId('backup_codes_login');
			expect(loginButton).toBeDisabled();

			await user.click(screen.getByText('I have saved this backup codes (mandatory)'));
			expect(loginButton).toBeEnabled();
		});

		test('calls onLoginToWorkspace when login button is clicked after confirmation', async () => {
			const onLoginToWorkspace = vi.fn();
			const { user } = setup(
				<BackupCodes {...defaultProps} onLoginToWorkspace={onLoginToWorkspace} />
			);

			await user.click(screen.getByText('I have saved this backup codes (mandatory)'));
			await user.click(screen.getByTestId('backup_codes_login'));
			expect(onLoginToWorkspace).toHaveBeenCalledTimes(1);
		});

		test('copy button can be clicked when clipboard API is available', () => {
			setup(<BackupCodes {...defaultProps} />);
			expect(() => screen.getByTestId('backup_codes_copy').click()).not.toThrow();
		});

		test('copy button can be clicked when clipboard API is missing', () => {
			clipboardMock = undefined;
			setup(<BackupCodes {...defaultProps} />);
			expect(() => screen.getByTestId('backup_codes_copy').click()).not.toThrow();
		});

		test('downloads backup codes as txt', async () => {
			const clickSpy = vi
				.spyOn(HTMLAnchorElement.prototype, 'click')
				.mockImplementation(() => undefined);
			const { user } = setup(<BackupCodes {...defaultProps} />);

			await user.click(screen.getByTestId('backup_codes_save'));

			expect(createObjectURLMock).toHaveBeenCalledTimes(1);
			expect(clickSpy).toHaveBeenCalledTimes(1);
			expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
			clickSpy.mockRestore();
		});
	});
});
