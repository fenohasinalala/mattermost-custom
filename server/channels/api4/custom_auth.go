// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package api4

import (
	"encoding/json"
	"fmt"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"net/http"
)

func (api *API) InitCustomAuth() {
	api.BaseRoutes.CustomAuth.Handle("/ping", api.APIHandler(getCustomAuthPing)).Methods(http.MethodGet)
	api.BaseRoutes.CustomAuth.Handle("/signin", api.APIHandler(signinHandler)).Methods(http.MethodPost)
}

func signinHandler(c *Context, w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	token, err := casdoorsdk.GetOAuthToken(code, state)
	if err != nil {
		fmt.Println("GetOAuthToken() error", err)
		http.Error(w, "GetOAuthToken() error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"data":   token.AccessToken,
	})
}

func getCustomAuthPing(c *Context, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "pong")
}
