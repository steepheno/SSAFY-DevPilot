package com.corp.devpilot.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	// @Bean
	// public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	// 	http
	// 		.csrf(csrf -> csrf.disable())
	// 		.authorizeHttpRequests(authorize -> authorize
	// 			.requestMatchers(
	// 				"/swagger-ui.html",
	// 				"/swagger-ui/**",
	// 				"/v3/api-docs/**",
	// 				"/api-docs/**",
	// 				"/swagger-resources/**",
	// 				"/webjars/**",
	// 				"/api/jenkins/**"
	// 			)
	// 			.permitAll()
	// 			.anyRequest().authenticated()
	// 		)
	// 		.formLogin(formLogin -> formLogin.permitAll());
	//
	// 	return http.build();
	// }

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
			.csrf(csrf -> csrf.disable())
			.cors(cors -> {})
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().permitAll()
			)
			.build();
	}
}