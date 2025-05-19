package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// App struct
type App struct {
	ctx     context.Context
	javaCmd *exec.Cmd
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	fmt.Println("Loading Java Backend...")
	if err := a.StartJar(); err != nil {
		fmt.Println("Error: ", err, "Occurred while Loading Java Backend.")
	} else {
		fmt.Println("Successfully loaded Java Backend.")
	}
}

func (a *App) StartJar() error {
	tmpDir, err := os.MkdirTemp("", "devpilot-")
	if err != nil {
		return err
	}
	jarPath := filepath.Join(tmpDir, "devpilot-0.0.1-SNAPSHOT.jar")

	// jarPath 위치에 쓰기된 jarBytes용량을 소유자 읽기/쓰기/실행, 이외 사용자 읽기/실행 권한으로 write
	if err := os.WriteFile(jarPath, jarBytes, 0755); err != nil {
		return err
	}
	info, _ := os.Stat(jarPath)
	fmt.Println("Wrote JAR to", jarPath, "size=", info.Size(), "bytes")

	javaPath := findJava()
	fmt.Println("Using Java at path: ", javaPath)

	const SERVER_HOST = "127.0.0.1"
	const SERVER_PORT = 3000

	// app에 상주할 Java process
	cmd := exec.Command(javaPath, "-jar", jarPath,
		fmt.Sprintf("--server.address=%s", SERVER_HOST),
		fmt.Sprintf("--server.port=%d", SERVER_PORT),
	)
	cmd.Dir = tmpDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()

	// Start() 호출로 Java 프로세스를 백그라운드에서 비동기 실행, Start는 즉시 return
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start java: %w", err)
	}
	fmt.Println("Started Java PID:", cmd.Process.Pid)

	// App 필드에 저장
	a.javaCmd = cmd

	// 백그라운드에서 Wait()
	go func() {
		if err := cmd.Wait(); err != nil {
			fmt.Println("Java exited with error:", err)
		} else {
			fmt.Println("Java exited normally")
		}
	}()
	return nil
}

// 앱 종료 시 java server 종료 훅
func (a *App) shutdown(ctx context.Context) {
	if a.javaCmd != nil && a.javaCmd.Process != nil {
		fmt.Println("Shutting down Java PID:", a.javaCmd.Process.Pid)
		// 정상 종료 시도
		if err := a.javaCmd.Process.Signal(os.Interrupt); err != nil {
			fmt.Println("Failed to send SIGINT to Java:", err)
		}
		// 1초 후 강제 종료
		go func() {
			time.Sleep(time.Second)
			if err := a.javaCmd.Process.Kill(); err != nil {
				fmt.Println("Failed to kill Java process:", err)
			}
		}()
	}
}
