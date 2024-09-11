// server/casdoor/handler.go

package casdoor

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func InitAuthConfig() {
	println("Casdoor init")
	casdoorsdk.InitConfig(
		GlobalConfig.Server.Endpoint,
		GlobalConfig.Server.ClientID,
		GlobalConfig.Server.ClientSecret,
		GlobalConfig.Certificate,
		GlobalConfig.Server.Organization,
		GlobalConfig.Server.Application,
	)
}

func GetPong(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "ping")
}

func SigninHandler(w http.ResponseWriter, r *http.Request) {
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

func UserInfoHandler(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Authorization header is missing", http.StatusUnauthorized)
		return
	}

	token := strings.Split(authHeader, "Bearer ")
	if len(token) != 2 {
		http.Error(w, "Invalid Bearer token", http.StatusUnauthorized)
		return
	}

	claims, err := casdoorsdk.ParseJwtToken(token[1])
	if err != nil {
		http.Error(w, "Failed to parse JWT token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"data":   claims.User,
	})
}
