// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';

import {trackEvent} from 'actions/telemetry_actions';

import type {CustomizeHeaderType} from 'components/header_footer_route/header_footer_route';

import {
    ServerUrl,
} from './Setting';

type AuthCallbackProps = {
    onCustomizeHeader?: CustomizeHeaderType;
}

const AuthCallback = ({
    onCustomizeHeader,
}: AuthCallbackProps) => {
    const location = useLocation();

    //const [isWaiting, setIsWaiting] = useState(false);

    const handleCallback = (code: string, state: string) => {
        return fetch(`${ServerUrl}/api/signin?code=${code}&state=${state}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).then((res) => res.json());
    };

    async function loginToMattermost(loginId: string, password: string, token: string = '', deviceId: string = ''): Promise<any> {
        const url = 'https://mattermost.numer.tech/api/v4/users/login';

        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',

            //'Accept': '*/*',
            'Accept-Language': 'en',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',

            //'Origin': 'https://mattermost.numer.tech',
            //'DNT': '1',
            'Sec-GPC': '1',

            //'Connection': 'keep-alive',
            //'Cookie': 'rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2BTLWa%2FpAJAxVzkqSz2so9xmHj4qPjnkhvQsT%2F8%2FXbbMlSkAFEFM3MQan%2F4ouEQKsCw6AxkAZ5MtA%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX19ZneNXXCyPzrwuRekjx3Eta8XfXYTaiZAo%2B6%2FGBN%2BE7l%2B48var9Yvk;',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',

            //'Priority': 'u=0',
            //'TE': 'trailers'
        };

        const body = JSON.stringify({
            login_id: loginId,
            password,
            token,
            deviceId,
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Login successful:', data);
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

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
                //loginToMattermost('', '', res.data, '');
                //submit({loginId: '', password: '', token: res.data});
            } else {
                console.error('Error logging in:', res?.status);
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
