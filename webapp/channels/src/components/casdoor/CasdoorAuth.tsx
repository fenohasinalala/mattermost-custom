// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {useHistory, useLocation} from 'react-router-dom';

import type {Team} from '@mattermost/types/teams';

import {loadMe} from 'mattermost-redux/actions/users';
import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getIsOnboardingFlowEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {getMyTeamMember, getTeamByName} from 'mattermost-redux/selectors/entities/teams';

import {trackEvent} from 'actions/telemetry_actions';

import type {CustomizeHeaderType} from 'components/header_footer_route/header_footer_route';

import {
    ServerUrl, goToLink
} from './Setting';

import {redirectUserToDefaultTeam} from '../../actions/global_actions';
import {addUserToTeamFromInvite} from '../../actions/team_actions';
import {login} from '../../actions/views/login';
import LocalStorageStore from '../../stores/local_storage_store';
import type {GlobalState} from '../../types/store';
import {setCSRFFromCookie} from '../../utils/utils';
import type {AlertBannerProps} from '../alert_banner';
import type {SubmitOptions} from '../claim/components/email_to_ldap';

type AuthCallbackProps = {
    onCustomizeHeader?: CustomizeHeaderType;
}

const AuthCallback = ({
    onCustomizeHeader,
}: AuthCallbackProps) => {
    const location = useLocation();
    const {formatMessage} = useIntl();
    const [showMfa, setShowMfa] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [alertBanner, setAlertBanner] = useState<AlertBannerProps | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);
    const {pathname, search, hash} = useLocation();

    const query = new URLSearchParams(search);
    const redirectTo = query.get('redirect_to');
    const dispatch = useDispatch();
    const history = useHistory();

    const {
        ExperimentalPrimaryTeam,
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


    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        handleCallback(code, state).then((res) => {
            if (res?.status === 'ok') {
                submit({loginId: '', password: '', token: res.data});
            } else {
                //console.erroddr('Error logging in:', res?.status);
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

    const submit = async ({loginId, password, token}: SubmitOptions) => {
        setIsWaiting(true);

        const {error: loginError} = await dispatch(login(loginId, password, token));

        if (loginError && loginError.server_error_id && loginError.server_error_id.length !== 0) {
            if (loginError.server_error_id === 'api.user.login.not_verified.app_error') {
                history.push('/should_verify_email?&email=' + encodeURIComponent(loginId));
            } else if (loginError.server_error_id === 'store.sql_user.get_for_login.app_error' ||
                loginError.server_error_id === 'ent.ldap.do_login.user_not_registered.app_error') {
                setShowMfa(false);
                setIsWaiting(false);
                setAlertBanner({
                    mode: 'danger',
                    title: formatMessage({
                        id: 'login.userNotFound',
                        defaultMessage: "We couldn't find an account matching your login credentials.",
                    }),
                });
                setHasError(true);
            } else if (loginError.server_error_id === 'api.user.check_user_password.invalid.app_error' ||
                loginError.server_error_id === 'ent.ldap.do_login.invalid_password.app_error') {
                setShowMfa(false);
                setIsWaiting(false);
                setAlertBanner({
                    mode: 'danger',
                    title: formatMessage({
                        id: 'login.invalidPassword',
                        defaultMessage: 'Your password is incorrect.',
                    }),
                });
                setHasError(true);
            } else if (!showMfa && loginError.server_error_id === 'mfa.validate_token.authenticate.app_error') {
                setShowMfa(true);
            } else if (loginError.server_error_id === 'api.user.login.invalid_credentials_email_username') {
                setShowMfa(false);
                setIsWaiting(false);
                setAlertBanner({
                    mode: 'danger',
                    title: formatMessage({
                        id: 'login.invalidCredentials',
                        defaultMessage: 'The email/username or password is invalid.',
                    }),
                });
                setHasError(true);
            } else {
                setShowMfa(false);
                setIsWaiting(false);
                setAlertBanner({
                    mode: 'danger',
                    title: loginError.message,
                });
                setHasError(true);
            }
        //TODO: display : Casdoor user not authorized --> with confirmation button --> redirection to login page
        goToLink("/")
            return;
        }

        await postSubmit();
    };

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
