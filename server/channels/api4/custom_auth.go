// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package api4

import (
	"fmt"
	"net/http"
)

func (api *API) InitCustomAuth() {
	api.BaseRoutes.CustomAuth.Handle("/ping", api.APIHandler(getCustomAuthPing)).Methods(http.MethodGet)
	//api.BaseRoutes.CustomAuth.Handle("/signin", api.APIHandler(signinHandler)).Methods(http.MethodPost)
}

func getCustomAuthPing(c *Context, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "pong")
}
