/* eslint-disable import/no-extraneous-dependencies */
/* global globalThis */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
	Button,
	Checkbox,
	Input,
	Row,
	Select,
	Snackbar,
	Text
} from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import BackupCodes from './backup-codes';
import ChangePasswordForm from './change-password-form';
import CredentialsForm from './credentials-form';
import ForgetPassword from './forget-password';
import OfflineModal from './modals';
import OtpSetup from './otp-setup';
import OtpWizard from './otp-wizard';
import Spinner from './spinner';
import { generateOtp, postV2Login, submitOtp } from '../services/v2-service';
import { useLoginConfigStore } from '../store/login/store';
import { saveCredentials } from '../utils';

const formState = {
	credentials: 'credentials',
	waiting: 'waiting',
	twoFactor: 'two-factor',
	otpWizard: 'otp-wizard',
	otpSetup: 'otp-setup',
	backupCodes: 'backup-codes',
	changePassword: 'change-password',
	forgetPassword: 'forget-password'
};

export default function V2LoginManager({ configuration, disableInputs }) {
	const [t] = useTranslation();

	const [loadingCredentials, setLoadingCredentials] = useState(false);
	const [loadingOtp, setLoadingOtp] = useState(false);
	const [progress, setProgress] = useState(formState.credentials);

	useEffect(() => {
		const isWizardScreen =
			progress === formState.otpWizard ||
			progress === formState.otpSetup ||
			progress === formState.backupCodes;
		useLoginConfigStore.setState({ isOtpWizardActive: isWizardScreen });
		return () => {
			useLoginConfigStore.setState({ isOtpWizardActive: false });
		};
	}, [progress]);

	const [authError, setAuthError] = useState(false);
	const [showOtpError, setShowOtpError] = useState(false);

	const [otpList, setOtpList] = useState([]);
	const [otpId, setOtpId] = useState('');
	const [otp, setOtp] = useState('');
	const onChangeOtp = useCallback(
		(ev) => {
			setOtp(ev.target.value);
		},
		[setOtp]
	);
	const [trustDevice, setTrustDevice] = useState(false);
	const toggleTrustDevice = useCallback(() => setTrustDevice((v) => !v), [setTrustDevice]);

	const [email, setEmail] = useState('');
	const [loadingChangePassword, setLoadingChangePassword] = useState(false);

	const [otpUri, setOtpUri] = useState('');
	const [otpGeneratedId, setOtpGeneratedId] = useState('');
	const [staticOtpCodes, setStaticOtpCodes] = useState([]);
	const [loadingOtpSetup, setLoadingOtpSetup] = useState(false);
	const [otpVerifyError, setOtpVerifyError] = useState('');
	const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(null);

	const [snackbarNetworkError, setSnackbarNetworkError] = useState('');
	const [showSnackbarDetails, setShowSnackbarDetails] = useState(false);
	const [detailNetworkModal, setDetailNetworkModal] = useState(false);
	const [showOtpDisabled, setShowOtpDisabled] = useState(false);
	const [showOtpMaxAttempts, setShowOtpMaxAttempts] = useState(false);

	const submitCredentials = useCallback(
		(username, password) => {
			setLoadingCredentials(true);
			return postV2Login('password', username, password)
				.then((res) => {
					switch (res.status) {
						case 200:
							setEmail(username);
							if (res.redirected) {
								setProgress(formState.changePassword);
							} else {
								res.json().then(async (response) => {
									await saveCredentials(username, password);
									if (
										response?.['2FA'] === true &&
										response?.['otp-wizard'] === true &&
										(!response?.otp || response.otp.length === 0)
									) {
										setProgress(formState.otpWizard);
										setLoadingCredentials(false);
									} else if (response?.['2FA'] === true) {
										setOtpList(
											map(response?.otp ?? [], (obj) => ({
												label: obj.label,
												value: obj.id,
												enabled: obj.enabled
											}))
										);
										setOtpId(response?.otp?.[0].id);
										setShowOtpDisabled(response?.otp?.[0]?.enabled === false);
										setProgress(formState.twoFactor);
										setLoadingCredentials(false);
									} else {
										globalThis.location.assign(configuration.destinationUrl);
									}
								});
							}
							break;
						case 401:
							setAuthError(
								t(
									'credentials_not_valid',
									'Credentials are not valid, please check data and try again'
								)
							);
							setLoadingCredentials(false);
							break;
						case 403:
							setAuthError(
								t(
									'auth_not_valid',
									'The authentication policy needs more steps: please contact your administrator for more information'
								)
							);
							setLoadingCredentials(false);
							break;
						case 502:
							setAuthError(
								t('server_unreachable', 'Error 502: Service Unreachable - Retry later.')
							);
							setLoadingCredentials(false);
							break;
						default:
							setShowSnackbarDetails(true);
							setSnackbarNetworkError(t('cant_login', 'Cannot log in now'));
							setLoadingCredentials(false);
					}
				})
				.catch(() => setLoadingCredentials(false));
		},
		[configuration.destinationUrl, t]
	);

	const submitOtpCb = useCallback(
		(e) => {
			e.preventDefault();
			setLoadingOtp(true);
			submitOtp(otpId, otp, trustDevice)
				.then((res) => {
					if (res.status === 200) {
						if (res.redirected) {
							setProgress(formState.changePassword);
						} else {
							globalThis.location.assign(configuration.destinationUrl);
						}
					} else if (res.status === 403) {
						setLoadingOtp(false);
						setShowOtpMaxAttempts(true);
						setShowOtpError(false);
					} else {
						setLoadingOtp(false);
						setShowOtpError(true);
					}
				})
				.catch(() => setLoadingOtp(false));
		},
		[otpId, otp, trustDevice, configuration.destinationUrl]
	);

	const onCloseCbk = useCallback(() => setDetailNetworkModal(false), [setDetailNetworkModal]);
	const onSnackbarActionCbk = useCallback(
		() => setDetailNetworkModal(true),
		[setDetailNetworkModal]
	);
	const onCloseSnackbarCbk = useCallback(
		() => setSnackbarNetworkError(''),
		[setSnackbarNetworkError]
	);

	const onOtpSelect = useCallback(
		(selectedId) => {
			setOtpId(selectedId);
			const selectedOtp = otpList.find((item) => item.value === selectedId);
			setShowOtpDisabled(selectedOtp ? !selectedOtp.enabled : false);
		},
		[otpList]
	);

	const onClickForgetPassword = useCallback(() => {
		setProgress(formState.forgetPassword);
	}, []);

	const onBackToLogin = useCallback(() => {
		setProgress(formState.credentials);
	}, []);

	const onOtpWizardProceed = useCallback(
		(otpLabel) => {
			setLoadingOtpSetup(true);
			generateOtp(otpLabel)
				.then((data) => {
					if (data.secret) {
						const uri = `otpauth://totp/${encodeURIComponent(data.label)}?secret=${data.secret}&issuer=${encodeURIComponent(data.issuer)}&algorithm=${data.algorithm}&digits=${data.digits_length}&period=${data.period}`;
						setOtpUri(uri);
						setOtpGeneratedId(data.id);
						setStaticOtpCodes(data.static_otp_codes || []);
						setProgress(formState.otpSetup);
					} else {
						setShowSnackbarDetails(false);
						setSnackbarNetworkError(
							t(
								'otp_generation_failed',
								'Something went wrong, please try again with another unique name or wait a couple of minutes before try again'
							)
						);
					}
				})
				.catch(() => {
					setShowSnackbarDetails(false);
					setSnackbarNetworkError(
						t(
							'otp_generation_failed',
							'Something went wrong, please try again with another unique name or wait a couple of minutes before try again'
						)
					);
				})
				.finally(() => setLoadingOtpSetup(false));
		},
		[t]
	);

	const onVerifyOtpSetupCode = useCallback(
		(code, isTrustedDevice) => {
			setLoadingOtpSetup(true);
			setOtpVerifyError('');
			submitOtp(otpGeneratedId, code, isTrustedDevice)
				.then(async (res) => {
					if (res.status === 200) {
						setProgress(formState.backupCodes);
					} else {
						let remaining = null;
						try {
							const body = await res.json();
							remaining =
								body?.remainingTokensAttempts ??
								body?.attemptsRemaining ??
								body?.attempts_remaining ??
								null;
						} catch {
							// ignore parse errors
						}
						setOtpAttemptsRemaining(remaining);
						setOtpVerifyError('invalid');
					}
				})
				.catch(() => {
					setShowSnackbarDetails(false);
					setSnackbarNetworkError(
						t('otp_verification_failed', 'Failed to verify OTP. Please try again')
					);
				})
				.finally(() => setLoadingOtpSetup(false));
		},
		[otpGeneratedId, t]
	);

	const onBackFromSetup = useCallback(() => {
		setOtpVerifyError('');
		setOtpAttemptsRemaining(null);
		setProgress(formState.otpWizard);
	}, []);

	const onLoginToWorkspace = useCallback(() => {
		globalThis.location.assign(configuration.destinationUrl);
	}, [configuration.destinationUrl]);

	return (
		<>
			{progress === formState.credentials && (
				<CredentialsForm
					configuration={configuration}
					disableInputs={disableInputs}
					authError={authError}
					submitCredentials={submitCredentials}
					loading={loadingCredentials}
					onClickForgetPassword={onClickForgetPassword}
				/>
			)}
			{progress === formState.waiting && (
				<Row orientation="vertical" crossAlignment="center" padding={{ vertical: 'extralarge' }}>
					<Spinner />
				</Row>
			)}
			{progress === formState.twoFactor && (
				<form onSubmit={submitOtpCb} style={{ width: '100%' }}>
					<input type="submit" style={{ display: 'none' }} />
					<Row padding={{ bottom: 'large' }}>
						<Text size="large" color="text" weight="bold">
							{t('two_step_authentication', 'Two-Step-Authentication')}
						</Text>
					</Row>
					<Row padding={{ top: 'large' }}>
						<div style={{ width: '100%' }} className={showOtpDisabled ? 'select-otp-error' : ''}>
							<Select
								items={otpList}
								background="gray5"
								label={t('choose_otp', 'Choose the OTP Method')}
								onChange={onOtpSelect}
								defaultSelection={otpList[0]}
							/>
						</div>
					</Row>
					<Row padding={{ top: 'extrasmall' }} mainAlignment="flex-start">
						<Text color="error" style={{ fontSize: '12px' }} overflow="break-word">
							{showOtpDisabled &&
								t(
									'otp_method_disabled',
									'This OTP method is disabled. To restore it, please contact your system administrator.'
								)}
						</Text>
					</Row>
					<Row padding={{ top: 'large' }}>
						<Input
							defaultValue={otp}
							hasError={showOtpError || showOtpMaxAttempts}
							disabled={disableInputs || showOtpDisabled || showOtpMaxAttempts}
							onChange={onChangeOtp}
							label={t('type_otp', 'Type here One-Time-Password')}
							backgroundColor="gray5"
						/>
					</Row>
					<Row padding={{ top: 'extrasmall' }} mainAlignment="flex-start">
						<Text color="error" style={{ fontSize: '12px' }} overflow="break-word">
							{showOtpMaxAttempts &&
								t(
									'otp_max_attempts',
									'Invalid OTP. You have reached the maximum number of attempts'
								)}
							{!showOtpMaxAttempts &&
								showOtpError &&
								t('wrong_password', 'Wrong password, please check data and try again')}
							{!showOtpMaxAttempts && !showOtpError && <br />}
						</Text>
					</Row>
					<Row orientation="vertical" crossAlignment="flex-start" padding={{ vertical: 'small' }}>
						<Button
							onClick={submitOtpCb}
							disabled={disableInputs || showOtpDisabled || showOtpMaxAttempts}
							label={t('login', 'Login')}
							width="fill"
							loading={loadingOtp}
						/>
					</Row>
					<Row mainAlignment="flex-start">
						<Checkbox
							value={trustDevice}
							label={t('trust_device_and_ip', 'Trust this device and IP address')}
							onClick={toggleTrustDevice}
						/>
					</Row>
				</form>
			)}
			{progress === formState.otpWizard && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 1,
						width: '100%'
					}}
				>
					<OtpWizard
						onBackToLogin={onBackToLogin}
						onProceed={onOtpWizardProceed}
						disableInputs={disableInputs}
						loading={loadingOtpSetup}
					/>
				</div>
			)}
			{progress === formState.otpSetup && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 1,
						width: '100%'
					}}
				>
					<OtpSetup
						otpUri={otpUri}
						onBackToLogin={onBackToLogin}
						onVerifyCode={onVerifyOtpSetupCode}
						disableInputs={disableInputs}
						loading={loadingOtpSetup}
						verifyError={otpVerifyError}
						attemptsRemaining={otpAttemptsRemaining}
						onBack={onBackFromSetup}
					/>
				</div>
			)}
			{progress === formState.backupCodes && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 1,
						width: '100%'
					}}
				>
					<BackupCodes
						staticOtpCodes={staticOtpCodes}
						onLoginToWorkspace={onLoginToWorkspace}
						configuration={configuration}
					/>
				</div>
			)}
			{progress === formState.changePassword && (
				<ChangePasswordForm
					isLoading={loadingChangePassword}
					setIsLoading={setLoadingChangePassword}
					configuration={configuration}
					username={email}
				/>
			)}
			{progress === formState.forgetPassword && (
				<ForgetPassword configuration={configuration} disableInputs={disableInputs} />
			)}
			<Snackbar
				open={!!snackbarNetworkError}
				label={snackbarNetworkError}
				{...(showSnackbarDetails && {
					actionLabel: t('details', 'Details'),
					onActionClick: onSnackbarActionCbk
				})}
				onClose={onCloseSnackbarCbk}
				autoHideTimeout={10000}
				type="error"
			/>
			<OfflineModal open={detailNetworkModal} onClose={onCloseCbk} />
		</>
	);
}

V2LoginManager.propTypes = {
	configuration: PropTypes.shape({
		destinationUrl: PropTypes.string.isRequired
	}).isRequired,
	disableInputs: PropTypes.bool
};

V2LoginManager.defaultProps = {
	disableInputs: false
};
