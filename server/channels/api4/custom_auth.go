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
	api.BaseRoutes.CustomAuth.Handle("/api/signin", api.APIHandler(signinHandler)).Methods(http.MethodPost)
	api.BaseRoutes.CustomAuth.Handle("/api/signin", api.APIHandler(signinHandler)).Methods(http.MethodOptions)
}

func signinHandler(c *Context, w http.ResponseWriter, r *http.Request) {
	// Gérer les requêtes préliminaires OPTIONS pour CORS
	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.WriteHeader(http.StatusOK) // Réponse correcte à l'OPTIONS
		return
	}

	// En-têtes CORS pour les autres requêtes
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Traitement de la requête POST
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
