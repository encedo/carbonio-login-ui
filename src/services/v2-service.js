/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PASSWORD, RECOVERY_TOKEN } from '../constants';
import { getDeviceModel, deviceId } from '../utils';

export function postV2Login(authMethod, user, password) {
	return fetch('/zx/auth/v2/login', {
		method: 'POST',
		headers: {
			'X-Device-Model': getDeviceModel(),
			'X-Device-Id': deviceId(),
			'X-Service': 'WebUI',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			auth_method: authMethod,
			user,
			[authMethod === RECOVERY_TOKEN ? RECOVERY_TOKEN : PASSWORD]: password
		})
	});
}

export function submitOtp(id, code, trustDevice) {
	return fetch('/zx/auth/v2/otp/validate', {
		method: 'POST',
		headers: {
			'X-Device-Model': getDeviceModel(),
			'X-Device-Id': deviceId(),
			'X-Service': 'WebUI',
			'Content-Type': 'application/json',
			version: '2'
		},
		body: JSON.stringify({
			id,
			code,
			unsecure_device: !trustDevice
		})
	});
}

export function generateOtp(labelPrefix) {
	return fetch(
		`/zx/auth/v2/otp/generate?labelPrefix=${encodeURIComponent(labelPrefix)}&temporary=true`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				labelPrefix,
				humanReadable: false
			})
		}
	).then((res) => res.json());
}
