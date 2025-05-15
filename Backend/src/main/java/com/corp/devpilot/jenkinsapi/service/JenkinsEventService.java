package com.corp.devpilot.jenkinsapi.service;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsApiException;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsEventDto;
import com.corp.devpilot.jenkinsapi.domain.dto.ProgressiveLogDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

@Component
public class JenkinsEventService {

	private final JenkinsApiService jenkinsApiService;

	public JenkinsEventService(JenkinsApiService jenkinsApiService) {
		this.jenkinsApiService = jenkinsApiService;
	}

	/**
	 * MVC 환경에서 SseEmitter를 이용해 Jenkins 이벤트를 스트리밍합니다.
	 */
	public SseEmitter streamBuildAndPipelineEvents(String clientId) {
		jenkinsApiService.isClient();
		SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
		WebClient client = jenkinsApiService.authorizedClient();
		// 1) 구독 확인 메시지 전송
		try {
			emitter.send(SseEmitter.event()
				.name("subscription_succeeded")
				.data("subscribed to job,pipeline"));
		} catch (IOException e) {
			emitter.completeWithError(e);
			return emitter;
		}

		// 2) connect 호출 및 JSESSIONID 추출
		String jsessionId = Optional.ofNullable(
				client.get()
					.uri(u -> u.path("/sse-gateway/connect")
						.queryParam("clientId", clientId)
						.build())
					.retrieve()
					.toBodilessEntity()
					.block()
			)
			.map(resp -> resp.getHeaders().getFirst(HttpHeaders.SET_COOKIE))
			.orElseThrow(() -> new JenkinsApiException(ErrorCode.JENKINS_EMPTY_RESPONSE));

		String[] jsession = jsessionId.split(";", 2)[0].split("=", 2);

		// 3) configure 요청 (쿠키 포함)
		client.post()
			.uri("/sse-gateway/configure")
			.cookie(jsession[0], jsession[1])
			.contentType(MediaType.APPLICATION_JSON)
			.bodyValue(createSubscriptionPayload(clientId))
			.retrieve()
			.toBodilessEntity()
			.block();

		// 4) listen Flux 구성
		Flux<JenkinsEventDto> flux = client.get()
			.uri(u -> u.path("/sse-gateway/listen/{clientId}")
				.build(clientId))
			.cookie(jsession[0], jsession[1])
			.accept(MediaType.TEXT_EVENT_STREAM)
			.retrieve()
			.bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {
			})
			.<JenkinsEventDto>handle((sse, sink) -> {
				JenkinsEventDto event = JenkinsParser.parseEvent(sse.data());
				if (event != null) {
					sink.next(event);
				}
			})
			.retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofSeconds(1)))
			.repeat();

		// 5) Flux 구독 후 emitter로 전송
		flux.subscribe(
			event -> {
				try {
					emitter.send(SseEmitter.event()
						.name(event.getEventType().toLowerCase())
						.data(event));
				} catch (IOException ex) {
					emitter.completeWithError(ex);
				}
			},
			emitter::completeWithError
			// onComplete는 무시하여 커넥션 유지
		);

		return emitter;
	}

	private Map<String, Object> createSubscriptionPayload(String clientId) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("dispatcherId", clientId);
		payload.put("subscribe", List.of(
			Map.of("jenkins_channel", "job"),
			Map.of("jenkins_channel", "pipeline")
		));
		return payload;
	}

	/**
	 * offset 지점부터 로그 청크 하나를 가져옵니다.
	 * @param jobName     Jenkins job name
	 * @param buildNumber build 번호
	 * @param offset      이전까지 읽은 바이트 수
	 */
	@SuppressWarnings("checkstyle:WhitespaceAround")
	public ProgressiveLogDto fetchProgressiveLog(
		String jobName, int buildNumber, long offset
	) {
		jenkinsApiService.isClient();
		WebClient client = jenkinsApiService.authorizedClient();
		Mono<ResponseEntity<String>> mono = client.get()
			.uri(uri -> uri
				.path("/job/{job}/{build}/logText/progressiveText")
				.queryParam("start", offset)
				.build(jobName, buildNumber))
			.retrieve()
			.toEntity(String.class);

		ResponseEntity<String> res = mono.block();
		try {
			assert res != null;
			List<String> sizeHdr = res.getHeaders().get("X-Text-Size");
			List<String> moreHdr = res.getHeaders().get("X-More-Data");

			long newOffset = (sizeHdr != null && !sizeHdr.isEmpty())
				? Long.parseLong(sizeHdr.get(0))
				: offset;
			boolean more = (moreHdr != null && !moreHdr.isEmpty())
				&& Boolean.parseBoolean(moreHdr.get(0));

			System.out.println(newOffset + " " + more);
			// 3) DTO 반환
			return new ProgressiveLogDto(
				res.getBody(),   // 이번에 읽은 로그 청크
				newOffset,      // 다음 호출 때 사용할 오프셋
				more            // 더 읽을 데이터가 남았는지
			);
		} catch (Exception e) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_RESPONSE);
		}
	}

	public Flux<ServerSentEvent<String>> streamLog(String jobName, int buildNumber) {
		AtomicLong offset = new AtomicLong(0L);

		return Flux.range(0, Integer.MAX_VALUE)
			.delayElements(Duration.ofMillis(300L), Schedulers.boundedElastic())
			.map(i -> fetchProgressiveLog(jobName, buildNumber, offset.get()))
			.takeUntil(dto -> !dto.isMoreData())
			.doOnNext(dto -> offset.set(dto.getTextSize()))
			.map(dto -> ServerSentEvent.<String>builder()
				.event("log")
				.data(dto.getChunk())
				.build()
			);
	}
}
