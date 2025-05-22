package com.corp.devpilot.jenkinsapi.service;

import java.io.FileInputStream;
import java.util.List;
import java.util.Properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsApiException;
import com.corp.devpilot.jenkinsapi.domain.dto.BuildDetailDto;
import com.corp.devpilot.jenkinsapi.domain.dto.BuildSummaryDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import reactor.netty.http.client.HttpClient;

@Service
public class JenkinsApiService {

	private WebClient client;
	private final String user;
	private final TokenManager tokenManager;
	private final String envPath;

	public JenkinsApiService(
		TokenManager tokenManager,
		@Value("${server.jenkins.user}") String user,
		@Value("${user.home}/.devpilot/.env") String envPath
	) {
		this.tokenManager = tokenManager;
		this.user = user;
		this.envPath = envPath;
	}

	// 토큰 증명용
	WebClient authorizedClient() {
		tokenManager.isClient();
		String token = tokenManager.getToken().trim();
		if (token.isEmpty()) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_TOKEN);
		}
		return this.client.mutate()
			.defaultHeaders(h -> h.setBasicAuth(user, token))
			.build();
	}

	public void isClient() throws JenkinsApiException {
		if (client == null) {
			try {
				Properties props = new Properties();
				props.load(new FileInputStream(envPath));

				SslContext sslContext = SslContextBuilder.forClient()
					.trustManager(InsecureTrustManagerFactory.INSTANCE)
					.build();

				HttpClient httpClient = HttpClient.create()
					.secure(spec -> spec.sslContext(sslContext));

				this.client = WebClient.builder()
					.baseUrl("http://" + props.getProperty("EC2_HOST") + ":" + props.getProperty("JENKINS_PORT"))
					.clientConnector(new ReactorClientHttpConnector(httpClient))
					.build();

				//        this.client = WebClient.builder()
				//                .baseUrl(url)
				//                .defaultHeaders(h -> h.setBasicAuth(user, token))
				//                .build();
			} catch (Exception e) {
				throw new JenkinsApiException(ErrorCode.JENKINS_INVALID_TOKEN_FILE);
			}
		}
	}

	public int lastBuild(String jobName) throws JenkinsApiException {
		isClient();
		try {
			String last = authorizedClient().get()
				.uri(uri -> uri.path("/job/" + jobName + "/lastBuild/api/json")
					.queryParam("pretty", "true")
					.build())
				.retrieve()
				.bodyToMono(String.class)
				.block();

			return JenkinsParser.parseLastBuildNumber(last);
		} catch (Exception e) {
			return 0;
		}
	}

	public JenkinsInfoDto fetchInfo() {
		// GET 요청이므로 Crumb 없이 바로 호출
		isClient();
		String body = authorizedClient().get()
			.uri(uri -> uri.path("/api/json")
				.queryParam("pretty", "true")
				.build())
			.retrieve()
			.bodyToMono(String.class)
			.block();

		return JenkinsParser.parseInfo(body);
	}

	public List<BuildSummaryDto> fetchBuildSummaries(String jobName) {
		isClient();
		String json = authorizedClient()
			.get()
			.uri(uri -> uri
				.path("/job/{jobName}/api/json")
				.queryParam("tree", "builds[number,result,timestamp,duration]")
				.build(jobName))
			.retrieve()
			.bodyToMono(String.class)
			.block();  // 컨트롤러에서 동기 호출이므로 block() 사용

		return JenkinsParser.parseBuildSummaries(json);
	}

	public BuildDetailDto fetchBuildDetail(String jobName, int buildNumber) {
		isClient();
		String json = authorizedClient()
			.get()
			.uri(uri -> uri
				.path("/job/{jobName}/{buildNumber}/api/json")
				.queryParam("pretty", "true")
				.build(jobName, buildNumber))
			.retrieve()
			.bodyToMono(String.class)
			.block();

		return JenkinsParser.parseBuildDetail(json);
	}
}
