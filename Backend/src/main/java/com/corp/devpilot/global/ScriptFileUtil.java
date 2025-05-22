package com.corp.devpilot.global;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ResourceLoader;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.*;
import java.util.Collections;

@Slf4j
public class ScriptFileUtil {

	public static void extractScriptsToTemp(ResourceLoader resourceLoader) {
		String basePath = System.getProperty("java.io.tmpdir") + "devpilot-" + System.nanoTime();
		File targetDir = new File(basePath, "scripts");

		try {
			copyResourceDirectory(resourceLoader, "scripts", targetDir);
			System.setProperty("devpilot.script.base-path", targetDir.getAbsolutePath());
			log.info("스크립트 복사 완료: {}", targetDir.getAbsolutePath());
		} catch (IOException e) {
			throw new RuntimeException("스크립트 디렉토리 복사 실패", e);
		}
	}

	private static void copyResourceDirectory(ResourceLoader loader, String resourcePath, File destDir) throws IOException {
		URL url;
		try {
			url = loader.getResource(resourcePath).getURL();
		} catch (IOException e) {
			throw new IllegalArgumentException("해당 리소스를 찾을 수 없습니다: " + resourcePath, e);
		}

		if (url.getProtocol().equals("jar")) {
			// jar 내부에 있을 경우
			try (FileSystem fs = FileSystems.newFileSystem(URI.create(url.toString().split("!")[0]), Collections.emptyMap())) {
				Path jarPath = fs.getPath("/" + resourcePath);
				copyDirectory(jarPath, destDir.toPath());
			}
		} else {
			// 개발 환경에서 파일 시스템 접근
			try {
				Path srcPath = Paths.get(url.toURI());
				copyDirectory(srcPath, destDir.toPath());
			} catch (URISyntaxException e) {
				throw new RuntimeException("리소스 URL을 URI로 변환하는 중 오류 발생: " + url, e);
			}
		}
	}

	private static void copyDirectory(Path src, Path target) throws IOException {
		Files.walk(src).forEach(path -> {
			try {
				Path relative = src.relativize(path);
				Path targetPath = target.resolve(relative.toString());
				if (Files.isDirectory(path)) {
					Files.createDirectories(targetPath);
				} else {
					Files.copy(path, targetPath, StandardCopyOption.REPLACE_EXISTING);
				}
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		});
	}
}
