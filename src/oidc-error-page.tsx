/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Button, Container, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import errorSVG from '../assets/carbonio-load-app-error.svg';

export const OidcErrorPage = (): React.JSX.Element => {
	const [t] = useTranslation();
	const urlParams = new URLSearchParams(window.location.search);
	const errorMessage = urlParams.get('oidcError') ?? urlParams.get('error') ?? '';
	// origin = protocol + hostname + port. Building it by hand from protocol and
	// hostname dropped the port, so on a non-default port (e.g. https://mail:8443)
	// "Back to login page" navigated to the wrong URL.
	const loginUrl = window.location.origin;

	return (
		<Container gap={'10px'} orientation={'vertical'} mainAlignment={'center'} background={'gray5'}>
			<Container gap={'70px'} orientation={'horizontal'} height={'fit'} mainAlignment={'center'}>
				<Container width={'fit'}>
					<img src={errorSVG} alt="oidc-error" />
				</Container>
				<Container
					width={'fit'}
					gap={'104px'}
					orientation={'column'}
					crossAlignment={'flex-start'}
					mainAlignment={'space-evenly'}
					style={{ marginTop: '64px' }}
				>
					<Container
						width={'fit'}
						gap={'32px'}
						orientation={'column'}
						crossAlignment={'flex-start'}
					>
						<Text style={{ fontSize: '64px' }} weight={'medium'} color={'primary'}>
							{t('oidc.error_title', 'OIDC Login Error')}
						</Text>
						{errorMessage && (
							<Text
								overflow={'break-word'}
								style={{ fontSize: '28px' }}
								weight={'light'}
								color={'secondary'}
							>
								{errorMessage}
							</Text>
						)}
					</Container>
					<Container crossAlignment={'flex-start'} height={'fit'}>
						<Row gap={'16px'}>
							<Button
								iconPlacement={'left'}
								icon="ArrowBack"
								label={t('oidc.back_to_login', 'Back to login page')}
								type={'outlined'}
								onClick={(): void => {
									window.location.assign(loginUrl);
								}}
								color="primary"
							/>
						</Row>
					</Container>
				</Container>
			</Container>
		</Container>
	);
};
