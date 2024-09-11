// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"github.com/mattermost/mattermost/server/v8/cmd/mattermost/casdoor"
	"os"

	"github.com/mattermost/mattermost/server/v8/cmd/mattermost/commands"
	// Import and register app layer slash commands
	_ "github.com/mattermost/mattermost/server/v8/channels/app/slashcommands"
	// Plugins
	_ "github.com/mattermost/mattermost/server/v8/channels/app/oauthproviders/gitlab"

	// Enterprise Imports
	_ "github.com/mattermost/mattermost/server/v8/enterprise"
)

func main() {
	// Load Casdoor configuration from environment variables
	err := casdoor.LoadConfig()
	if err != nil {
		panic("Failed to load Casdoor configuration")
	}

	// Initialize Casdoor SDK
	casdoor.InitAuthConfig()

	if err := commands.Run(os.Args[1:]); err != nil {
		os.Exit(1)
	}
}
