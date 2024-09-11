// server/casdoor/conf.go

package casdoor

import (
	"os"
)

type ServerConfig struct {
	Endpoint     string
	ClientID     string
	ClientSecret string
	Organization string
	Application  string
	FrontendURL  string
}

type Config struct {
	Certificate string
	Server      ServerConfig
}

var GlobalConfig *Config

func LoadConfig() error {
	println("casdoor certificate: " + os.Getenv("CASDOOR_CERTIFICATE"))

	GlobalConfig = &Config{
		Certificate: os.Getenv("CASDOOR_CERTIFICATE"),
		Server: ServerConfig{
			Endpoint:     os.Getenv("CASDOOR_ENDPOINT"),
			ClientID:     os.Getenv("CASDOOR_CLIENT_ID"),
			ClientSecret: os.Getenv("CASDOOR_CLIENT_SECRET"),
			Organization: os.Getenv("CASDOOR_ORGANIZATION_NAME"),
			Application:  os.Getenv("CASDOOR_APPLICATION_NAME"),
			FrontendURL:  os.Getenv("CASDOOR_FRONTEND_URL"),
		},
	}
	return nil
}
