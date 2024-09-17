// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';

import type {Team} from '@mattermost/types/lib/teams';

import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getMyTeamMember, getTeamByName} from 'mattermost-redux/selectors/entities/teams';

import {trackEvent} from 'actions/telemetry_actions';

import type {CustomizeHeaderType} from 'components/header_footer_route/header_footer_route';

import {
    ServerUrl,
} from './Setting';

import {redirectUserToDefaultTeam} from '../../actions/global_actions';
import LocalStorageStore from '../../stores/local_storage_store';
import type {GlobalState} from '../../types/store';
import {setCSRFFromCookie} from '../../utils/utils';
import {getIsOnboardingFlowEnabled} from "mattermost-redux/selectors/entities/preferences";
import {loadMe} from "mattermost-redux/actions/users";
import {addUserToTeamFromInvite} from "../../actions/team_actions";

type AuthCallbackProps = {
    onCustomizeHeader?: CustomizeHeaderType;
}

const AuthCallback = ({
    onCustomizeHeader,
}: AuthCallbackProps) => {
    const location = useLocation();

    //const [isWaiting, setIsWaiting] = useState(false);
    const {pathname, search, hash} = useLocation();

    const query = new URLSearchParams(search);
    const redirectTo = query.get('redirect_to');
    const dispatch = useDispatch();
    const history = useHistory();

    const {
        EnableLdap,
        EnableSaml,
        EnableSignInWithEmail,
        EnableSignInWithUsername,
        EnableSignUpWithEmail,
        EnableSignUpWithGitLab,
        EnableSignUpWithOffice365,
        EnableSignUpWithGoogle,
        EnableSignUpWithOpenId,
        EnableOpenServer,
        EnableUserCreation,
        LdapLoginFieldName,
        GitLabButtonText,
        GitLabButtonColor,
        OpenIdButtonText,
        OpenIdButtonColor,
        SamlLoginButtonText,
        EnableCustomBrand,
        CustomDescriptionText,
        SiteName,
        ExperimentalPrimaryTeam,
        ForgotPasswordLink,
        PasswordEnableForgotLink,
    } = useSelector(getConfig);
    const onboardingFlowEnabled = useSelector(getIsOnboardingFlowEnabled);
    const experimentalPrimaryTeam = useSelector((state: GlobalState) => (ExperimentalPrimaryTeam ? getTeamByName(state, ExperimentalPrimaryTeam) : undefined));
    const experimentalPrimaryTeamMember = useSelector((state: GlobalState) => (experimentalPrimaryTeam ? getMyTeamMember(state, experimentalPrimaryTeam.id) : undefined));
    const handleHeaderBackButtonOnClick = useCallback(() => {
        trackEvent('access_problem', 'click_back');
        history.goBack();
    }, [history]);

    const handleCallback = (code: string, state: string) => {
        return fetch(`${ServerUrl}/api/signin?code=${code}&state=${state}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).then((res) => res.json());
    };

    /*
    async function loginToMattermost(loginId: string, password: string, token: string = '', deviceId: string = ''): Promise<any> {
        const url = 'https://mattermost.numer.tech/api/v4/users/login';

        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',

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
     */

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        handleCallback(code, state).then((res) => {
            if (res?.status === 'ok') {
                //loginToMattermost('', '', res.data, '');
                //submit({loginId: '', password: '', token: res.data});
            } else {
                //console.error('Error logging in:', res?.status);
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


    const postSubmit = async () => {
        await dispatch(loadMe());

        // check for query params brought over from signup_user_complete
        const params = new URLSearchParams(search);
        const inviteToken = params.get('t') || '';
        const inviteId = params.get('id') || '';

        if (inviteId || inviteToken) {
            const {data: team} = await dispatch(addUserToTeamFromInvite(inviteToken, inviteId));

            if (team) {
                finishSignin(team);
            } else {
                // there's not really a good way to deal with this, so just let the user log in like normal
                finishSignin();
            }
        } else {
            finishSignin();
        }
    };

    const finishSignin = (team?: Team) => {
        setCSRFFromCookie();

        // Record a successful login to local storage. If an unintentional logout occurs, e.g.
        // via session expiration, this bit won't get reset and we can notify the user as such.
        LocalStorageStore.setWasLoggedIn(true);

        // After a user has just logged in, we set the following flag to "false" so that after
        // a user is notified of successful login, we can set it back to "true"
        LocalStorageStore.setWasNotifiedOfLogIn(false);

        if (redirectTo && redirectTo.match(/^\/([^/]|$)/)) {
            history.push(redirectTo);
        } else if (team) {
            history.push(`/${team.name}`);
        } else if (experimentalPrimaryTeamMember?.team_id) {
            // Only set experimental team if user is on that team
            history.push(`/${ExperimentalPrimaryTeam}`);
        } else if (onboardingFlowEnabled) {
            // need info about whether admin or not,
            // and whether admin has already completed
            // first time onboarding. Instead of fetching and orchestrating that here,
            // let the default root component handle it.
            history.push('/');
        } else {
            redirectUserToDefaultTeam();
        }
    };

    return (
        <div>
            Chargement, La page est en cours de chargement, merci de bien vouloir patienter.
        </div>
    );
};

export default AuthCallback;
