package com.corp.devpilot.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

	@Bean
	public OpenAPI openAPI() {
		Info info = new Info()
			.title("DevPilot API")
			.version("v1.0.0")
			.contact(new Contact()
				.name("DevPilot Team")
				.email("devpilot@example.com")
				.url("https://lab.ssafy.com/s12-final/S12P31A301"))
			.license(new License()
				.name("MIT License")
				.url("https://opensource.org/licenses/MIT"));


		return new OpenAPI()
			.info(info);
	}
}