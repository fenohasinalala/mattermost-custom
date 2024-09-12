// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';

import {trackEvent} from 'actions/telemetry_actions';

import type {CustomizeHeaderType} from 'components/header_footer_route/header_footer_route';

import {
    ServerUrl,
    goToLink,
    setToken,

    //showMessage,
} from './Setting';

type AuthCallbackProps = {
    onCustomizeHeader?: CustomizeHeaderType;
}

const AuthCallback = ({
    onCustomizeHeader,
}: AuthCallbackProps) => {
    const location = useLocation();

    const handleCallback = (code: string, state: string) => {
        return fetch(`${ServerUrl}/api/signin?code=${code}&state=${state}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).then((res) => res.json());
    };

    /*
    const cacheWhoami = (whoami: Whoami) => {
        sessionStorage.setItem('idItem', whoami.id as string);
        sessionStorage.setItem('roleItem', whoami.role as string);
        sessionStorage.setItem('bearerItem', whoami.bearer as string);
    };

    const setSession = (token: string) => {
        setToken(token);
        return fetch(`${ServerUrl}/whoami`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).
            then((res) => res.json()).
            then((whoami) => {
                cacheWhoami(whoami);
                goToLink('/');
                clearToken();
            });
    };

    */

    const history = useHistory();

    const handleHeaderBackButtonOnClick = useCallback(() => {
        trackEvent('access_problem', 'click_back');
        history.goBack();
    }, [history]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        handleCallback(code, state).then((res) => {
            if (res?.status === 'ok') {
                //setSession(res.data);
            } else {
                //showMessage(res);
            }
        });
    }, [location]);

    useEffect(() => {
        if (onCustomizeHeader) {
            onCustomizeHeader({
                onBackButtonClick: handleHeaderBackButtonOnClick,
            });
        }
    }, [onCustomizeHeader, handleHeaderBackButtonOnClick]);

    return (
        <div>
            Chargement, La page est en cours de chargement, merci de bien vouloir patienter.
        </div>
    );
};

export default AuthCallback;
