package com.corp.devpilot.jenkinsapi.service;

import com.corp.devpilot.jenkinsapi.domain.dto.CrumbDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;

@Service
public class JenkinsApiService {

    private final WebClient client;

    public JenkinsApiService(
            @Value("${server.jenkins.url}") String url,
            @Value("${server.jenkins.user}") String user,
            @Value("${server.jenkins.token}") String token
    ) throws SSLException {

        // 모든 인증서 신뢰(임시용)

        SslContext sslContext = SslContextBuilder.forClient()
                .trustManager(InsecureTrustManagerFactory.INSTANCE)
                .build();

        HttpClient httpClient = HttpClient.create()
                .secure(spec -> spec.sslContext(sslContext));

        this.client = WebClient.builder()
                .baseUrl(url)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeaders(h -> h.setBasicAuth(user, token))
                .build();


//        this.client = WebClient.builder()
//                .baseUrl(url)
//                .defaultHeaders(h -> h.setBasicAuth(user, token))
//                .build();
    }

    // Token이 있을 시 Crumb 없어도 API 요청이 가능하나, Token 발급이 어떻게 될 지 몰라 일단 보류
    public CrumbDto fetchCrumb() {
        String body = client.get()
                .uri("/crumbIssuer/api/json")
                .retrieve()
                .bodyToMono(String.class)
                .block();
        return JenkinsParser.parseCrumb(body);
    }

    public JenkinsInfoDto fetchInfo() {
        CrumbDto crumb = fetchCrumb();
        String body = client.get()
                .uri(uri -> uri.path("/api/json")
                        .queryParam("pretty","true")
                        .build())
                .header(crumb.getCrumbRequestField(), crumb.getCrumb())
                .retrieve()
                .bodyToMono(String.class)
                .block();
        return JenkinsParser.parseInfo(body);
    }
}
