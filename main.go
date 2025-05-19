package main

import (
	"bytes"
	"context"
	"embed"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strings"
	"syscall"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed devpilot-0.0.1-SNAPSHOT.jar
var jarBytes []byte

func findJava() string {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("where", "java")
	} else {
		cmd = exec.Command("which", "java")
	}
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err == nil {
		line := strings.TrimSpace(strings.SplitN(out.String(), "\n", 2)[0])
		if info, err := os.Stat(line); err == nil && !info.IsDir() {
			return line
		}
	}
	return "java"
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	sigCtx, stop := signal.NotifyContext(context.Background(),
		os.Interrupt, syscall.SIGTERM,
	)
	defer stop()

	go func() {
		<-sigCtx.Done()
		fmt.Println("🏁 Received shutdown signal, cleaning up…")
		app.shutdown(context.Background())
		os.Exit(0)
	}()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "DevPilot",
		Width:            1024,
		Height:           768,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind:             []interface{}{app},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
