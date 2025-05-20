package com.corp.devpilot.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

	@Bean
	public CorsFilter corsFilter() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of("*")); // or "*" for all origins
		config.setAllowCredentials(true);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of(
			"Content-Type",
			"Authorization",
			"Access-Control-Request-Private-Network",
			"Access-Control-Allow-Origin"
		));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);

		return new CorsFilter(source);
	}
}
