// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Sdk from 'casdoor-js-sdk';

import * as Conf from './Conf';

export const ServerUrl = 'http://localhost:8065/api/v4/custom_auth';

export const CasdoorSdk = new Sdk(Conf.sdkConfig);

export const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    return token !== null && token.length > 0;
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const goToLink = (link) => {
    window.location.href = link;
};

export const getSigninUrl = () => {
    return CasdoorSdk.getSigninUrl();
};

export const getUserinfo = () => {
    return fetch(`${ServerUrl}/api/userinfo`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    }).then((res) => res.json());
};

export const getUsers = () => {
    return fetch(`${Conf.sdkConfig.serverUrl}/api/get-users?owner=${Conf.sdkConfig.organizationName}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    }).then((res) => res.json());
};

export const logout = () => {
    localStorage.removeItem('token');
};

export const showMessage = (message) => {
    alert(message);
};