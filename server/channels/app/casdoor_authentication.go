package app

import (
	"fmt"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"net/http"
	"os"
)

func (a *App) GetTokenClaim(token string) *casdoorsdk.Claims {
	if len(token) == 0 {
		fmt.Println("token is not valid Bearer token", http.StatusUnauthorized)
		return nil
	}

	claims, err := casdoorsdk.ParseJwtToken(token)
	if err != nil {
		fmt.Println("ParseJwtToken() error", http.StatusUnauthorized)
		return nil
	}
	return claims
}

func (a *App) AuthenticateCasdoorUser(c request.CTX, token string) (user *model.User, err *model.AppError) {
	loginId := a.GetTokenClaim(token).Email
	if user, err = a.GetUserForLogin(c, "", loginId); err != nil {
		return nil, err
	}
	var roles = a.GetTokenClaim(token).Roles
	var hasRole bool = false
	for _, r := range roles {
		if r.Name == os.Getenv("MATTERMOST_ROLE") {
			hasRole = true
		}
	}
	if !hasRole {
		return nil, model.NewAppError("Login", "api.user.login.inactive.app_error", nil, "user_id="+user.Id, http.StatusUnauthorized)
	}
	return user, err
}
