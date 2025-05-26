package main

import (
	"bytes"
	"context"
	"fmt"
	"io/fs"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	stdruntime "runtime"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx     context.Context // Wails 런타임이 GO <-> JS 간 이벤트/RPC 바인딩에 사용하는 context 이벤트
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

/*
시스템 내 java 실행 파일 경로 확인
결과가 유효하면 절대 경로, 아니면 PATH 환경변수 내 "java" 리턴
*/
func findJava() string {
	var cmd *exec.Cmd
	if stdruntime.GOOS == "windows" {
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

func writeEmbeddedScripts(tmpDir string) error {
	return fs.WalkDir(scriptsFS, "backend/scripts", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		relPath, _ := filepath.Rel("backend/scripts", path)
		target := filepath.Join(tmpDir, "scripts", relPath)

		if d.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		data, err := scriptsFS.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0755)
	})
}

// .jar 백엔드 실행
func (a *App) StartJar() error {
	// Java .jar을 임시 디렉토리에 풂
	// 상대 경로 리소스를 올바르게 참조하기 위함
	tmpDir, err := os.MkdirTemp("", "devpilot-")
	if err != nil {
		return err
	}
	jarPath := filepath.Join(tmpDir, "devpilot-0.0.1-SNAPSHOT.jar")

	// jarPath 위치에 쓰기된 jarBytes용량을 소유자 읽기/쓰기/실행, 이외 사용자 읽기/실행 권한으로 write
	if err := os.WriteFile(jarPath, jarBytes, 0755); err != nil {
		return err
	}

	// scripts 폴더 복사
	if err := writeEmbeddedScripts(tmpDir); err != nil {
		return err
	}

	info, _ := os.Stat(jarPath)
	fmt.Println("Wrote JAR to", jarPath, "size=", info.Size(), "bytes")

	javaPath := findJava()
	fmt.Println("Using Java at path: ", javaPath)

	const SERVER_HOST = "127.0.0.1"
	const SERVER_PORT = 3000

	// app에 상주할 JVM process 실행
	cmd := exec.Command(javaPath, "-jar", jarPath,
		fmt.Sprintf("--server.address=%s", SERVER_HOST),
		fmt.Sprintf("--server.port=%d", SERVER_PORT),
	)

	// 임시 디렉토리 내에서 실행
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

	// 백엔드 리스닝 여부를 폴링
	a.notifyWhenReady(SERVER_HOST, SERVER_PORT)

	// 백그라운드에서 프로세스 종료 감시 - Wait()
	go func() {
		if err := cmd.Wait(); err != nil {
			fmt.Println("Java exited with error:", err)
		} else {
			fmt.Println("Java exited normally")
		}
	}()
	return nil
}

// HTTP서버(127.0.0.1:port)가 실제 리스닝을 시작했는지 폴링
// 준비되면 “backend:ready”, 실패 시 “backend:failed” 이벤트 발행
func (a *App) notifyWhenReady(host string, port int) {
	go func() {
		address := net.JoinHostPort(host, fmt.Sprintf("%d", port))
		deadline := time.Now().Add(30 * time.Second) // 30초간 폴링
		for time.Now().Before(deadline) {
			conn, err := net.DialTimeout("tcp", address, 500*time.Millisecond)
			if err == nil {
				conn.Close()

				// 백엔드 준비 완료 알림
				wailsruntime.EventsEmit(a.ctx, "backend:ready", nil)
				return
			}
			// 500ms마다 재시도
			time.Sleep(500 * time.Millisecond)
		}

		// 시간 내 준비되지 않으면 backend:failed 이벤트 emit후 종료
		wailsruntime.EventsEmit(a.ctx, "backend:failed", nil)
	}()
}

// 앱 종료 시 java server 종료 훅: JVM에 SIGINT를 보내 Graceful Shutdown 시도
// 1초 뒤에 살아있으면 강제종료
func (a *App) shutdown(ctx context.Context) {
	if a.javaCmd != nil && a.javaCmd.Process != nil {
		fmt.Println("Shutting down Java PID:", a.javaCmd.Process.Pid)
		// 정상 종료 시도
		if err := a.javaCmd.Process.Signal(os.Interrupt); err != nil {
			fmt.Println("Failed to send SIGINT to Java:", err)
		}

		// 강제 종료
		go func() {
			time.Sleep(time.Second)
			if err := a.javaCmd.Process.Kill(); err != nil {
				fmt.Println("Failed to kill Java process:", err)
			}
		}()
	}
}
