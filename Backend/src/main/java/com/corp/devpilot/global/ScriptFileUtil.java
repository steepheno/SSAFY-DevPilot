package com.corp.devpilot.global;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StreamUtils;

import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Paths;

@Slf4j
public class ScriptFileUtil {

	public static void extractScriptsToTemp(ResourceLoader loader) {
		String[] files = {
			// linux 스크립트
			"scripts/linux/confirm.sh",
			"scripts/linux/deploy_project_files.sh",
			"scripts/linux/docker_helper.sh",
			"scripts/linux/jenkins_configuration.sh",
			"scripts/linux/jenkins_installation.sh",
			"scripts/linux/jenkins_pipeline.sh",
			"scripts/linux/main.sh",
			"scripts/linux/register_github_job.sh",
			"scripts/linux/register_gitlab_job.sh",
			"scripts/linux/register_gitlab_webhook.sh",
			"scripts/linux/setup_jenkins_system_config.groovy",
			"scripts/linux/ssh_connection.sh",
			"scripts/linux/upload_jenkinsfile.sh",
			"scripts/linux/utils.sh",

			"scripts/window/deploy_projects_files.ps1",
			"scripts/window/docker_helper.ps1",
			"scripts/window/gitlab_api_token.groovy",
			"scripts/window/gitlab_connection.groovy",
			"scripts/window/gitlab_personal_token.groovy",
			"scripts/window/gitlab_server.groovy",
			"scripts/window/jenkins.yaml",
			"scripts/window/jenkins_configuration.ps1",
			"scripts/window/jenkins_installation.ps1",
			"scripts/window/jenkins_pipeline.ps1",
			"scripts/window/main.ps1",
			"scripts/window/register_env_file.groovy",
			"scripts/window/register_github_job.ps1",
			"scripts/window/register_gitlab_job.ps1",
			"scripts/window/register_gitlab_webhook.ps1",
			"scripts/window/setup_jenkins_system_config.groovy",
			"scripts/window/ssh_connection.ps1",
			"scripts/window/upload_jenkinsfile.ps1",
			"scripts/window/username_password.groovy",
			"scripts/window/utils.ps1"
		};

		String jarPath;
		try {
			URL url = ScriptFileUtil.class.getProtectionDomain()
				.getCodeSource()
				.getLocation();

			String fullPath = url.toString();

			if (fullPath.startsWith("jar:")) {
				fullPath = fullPath.substring(4); // "jar:" 제거
			}
			if (fullPath.contains("!")) {
				fullPath = fullPath.substring(0, fullPath.indexOf("!")); // 내부 경로 제거
			}

			jarPath = new File(new URI(fullPath)).getAbsolutePath();

		} catch (URISyntaxException e) {
			throw new RuntimeException("JAR 경로 URI 변환 실패", e);
		}

		File jarDir = new File(jarPath).getParentFile();
		File targetDir = new File(jarDir, "scripts");
		if (!targetDir.exists()) {
			targetDir.mkdirs();
		}

		for (String path : files) {
			try {
				Resource resource = loader.getResource("classpath:" + path);
				if (!resource.exists()) {
					throw new FileNotFoundException("리소스 없음: " + path);
				}

				File outFile = new File(targetDir, Paths.get(path).getFileName().toString());
				try (InputStream in = resource.getInputStream(); OutputStream out = new FileOutputStream(outFile)) {
					StreamUtils.copy(in, out);
					outFile.setExecutable(true);
				}
				log.info("복사 완료: {}", outFile.getAbsolutePath());

			} catch (IOException e) {
				throw new RuntimeException("스크립트 복사 실패: " + path, e);
			}
		}

		System.setProperty("devpilot.script.base-path", targetDir.getAbsolutePath());
		log.info("스크립트 디렉토리 복사 완료. 설정된 base-path: {}", System.getProperty("devpilot.script.base-path"));
	}
}
