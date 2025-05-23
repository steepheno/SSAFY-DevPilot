package main

import (
	"context"
	"embed"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

/*
프론트엔드 정적 에셋 전체를 embed.FS 타입으로 번들에 포함
dist 폴더 하위 마크업, 스타일시트, 스크립트를 내부 웹서버가 서빙
*/

//go:embed all:frontend/dist
var assets embed.FS

//go:embed backend/scripts/**
var scriptsFS embed.FS

/*
 Backend jar 파일을 []byte 형태로 번들에 포함
런타임에 임시 파일로 풀어 Java 백엔드 기동
*/
//go:embed backend/build/libs/devpilot-0.0.1-SNAPSHOT.jar
var jarBytes []byte // 실제 jar 파일 내용이 들어갈 메모리 공간

func main() {
	// App 구조체 instance (startup, shutdown 로직 포함)
	app := NewApp()

	// OS 인터럽트(SIGINT, SIGTERM)를 감지하는 컨텍스트 생성
	sigCtx, stop := signal.NotifyContext(context.Background(),
		os.Interrupt, syscall.SIGTERM,
	)
	defer stop()

	// 백그라운드 고루틴: 인터럽트 신호 수신 시 Java 프로세스 종료 -> 프로그램 종료
	go func() {
		<-sigCtx.Done()
		fmt.Println("Received shutdown signal, cleaning up...")
		app.shutdown(context.Background())
		os.Exit(0)
	}()

	// Create application with options
	//- AssetServer: embed.FS를 통해 dist 폴더의 웹 리소스 서빙
	//- OnStartup: 앱 준비 시 app.startup 호출 (백엔드 기동)
	//- OnShutdown: Wails 내부 Quit() 호출 시 app.shutdown 호출
	//- Bind: 프론트엔드에서 호출 가능한 Go 메서드(Bind 대상) 등록
	err := wails.Run(&options.App{
		Title:            "DevPilot",
		Width:            1280,
		Height:           800,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind:             []any{app},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
