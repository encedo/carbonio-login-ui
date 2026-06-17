/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import BackupCodes from './backup-codes';

vi.mock('react-i18next', () => ({
	useTranslation: () => [(key, defaultText) => defaultText || key]
}));

vi.mock('../store/login/store', () => ({
	useLoginConfigStore: () => ({ loginLogo: undefined })
}));

vi.mock('@zextras/carbonio-design-system', () => ({
	Button: ({ onClick, label, disabled, 'data-testid': dataTestId }) => (
		<button type="button" onClick={onClick} disabled={disabled} data-testid={dataTestId}>
			{label}
		</button>
	),
	Checkbox: ({ onClick, label, 'data-testid': dataTestId }) => (
		<button type="button" onClick={onClick} data-testid={dataTestId}>
			{label}
		</button>
	),
	Row: ({ children }) => <div>{children}</div>,
	Text: ({ children }) => <span>{children}</span>,
	Container: ({ children, 'data-testid': dataTestId }) => (
		<div data-testid={dataTestId}>{children}</div>
	),
	Padding: ({ children }) => <div>{children}</div>
}));

describe('BackupCodes copy fallback branches', () => {
	let originalClipboard;
	let originalExecCommand;

	beforeEach(() => {
		originalClipboard = navigator.clipboard;
		originalExecCommand = document.execCommand;
		Object.defineProperty(document, 'execCommand', {
			value: vi.fn().mockReturnValue(true),
			configurable: true
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'clipboard', {
			value: originalClipboard,
			configurable: true
		});
		Object.defineProperty(document, 'execCommand', {
			value: originalExecCommand,
			configurable: true
		});
	});

	const renderComponent = () =>
		render(
			<BackupCodes
				staticOtpCodes={[{ code: 'AAAA-BBBB' }, { code: 'CCCC-DDDD' }, { code: 'EEEE-FFFF' }]}
				onLoginToWorkspace={vi.fn()}
			/>
		);

	test('covers textarea fallback when clipboard.writeText rejects', async () => {
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: vi.fn().mockRejectedValue(new Error('copy failed'))
			},
			configurable: true
		});
		renderComponent();

		const originalCreateElement = document.createElement.bind(document);
		const textAreaMock = originalCreateElement('textarea');
		textAreaMock.select = vi.fn();
		textAreaMock.remove = vi.fn();
		const createElementSpy = vi
			.spyOn(document, 'createElement')
			.mockImplementation((tagName) =>
				tagName === 'textarea' ? textAreaMock : originalCreateElement(tagName)
			);
		const appendChildSpy = vi
			.spyOn(document.body, 'appendChild')
			.mockImplementation(() => textAreaMock);

		screen.getByTestId('backup_codes_copy').click();

		await waitFor(() => expect(createElementSpy).toHaveBeenCalledWith('textarea'));
		expect(textAreaMock.value).toBe('AAAA-BBBB\nCCCC-DDDD\nEEEE-FFFF');
		expect(textAreaMock).toHaveStyle({ position: 'fixed' });
		expect(textAreaMock).toHaveStyle({ opacity: '0' });
		expect(appendChildSpy).toHaveBeenCalledWith(textAreaMock);
		expect(textAreaMock.select).toHaveBeenCalledTimes(1);
		expect(document.execCommand).toHaveBeenCalledWith('copy');
		expect(textAreaMock.remove).toHaveBeenCalledTimes(1);

		createElementSpy.mockRestore();
		appendChildSpy.mockRestore();
	});

	test('covers textarea fallback when clipboard API is unavailable', () => {
		Object.defineProperty(navigator, 'clipboard', {
			value: undefined,
			configurable: true
		});
		renderComponent();

		const originalCreateElement = document.createElement.bind(document);
		const textAreaMock = originalCreateElement('textarea');
		textAreaMock.select = vi.fn();
		textAreaMock.remove = vi.fn();
		const createElementSpy = vi
			.spyOn(document, 'createElement')
			.mockImplementation((tagName) =>
				tagName === 'textarea' ? textAreaMock : originalCreateElement(tagName)
			);
		const appendChildSpy = vi
			.spyOn(document.body, 'appendChild')
			.mockImplementation(() => textAreaMock);

		screen.getByTestId('backup_codes_copy').click();

		expect(createElementSpy).toHaveBeenCalledWith('textarea');
		expect(textAreaMock.value).toBe('AAAA-BBBB\nCCCC-DDDD\nEEEE-FFFF');
		expect(textAreaMock).toHaveStyle({ position: 'fixed' });
		expect(textAreaMock).toHaveStyle({ opacity: '0' });
		expect(appendChildSpy).toHaveBeenCalledWith(textAreaMock);
		expect(textAreaMock.select).toHaveBeenCalledTimes(1);
		expect(document.execCommand).toHaveBeenCalledWith('copy');
		expect(textAreaMock.remove).toHaveBeenCalledTimes(1);

		createElementSpy.mockRestore();
		appendChildSpy.mockRestore();
	});
});
