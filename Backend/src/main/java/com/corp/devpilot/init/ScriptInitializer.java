package com.corp.devpilot.init;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import com.corp.devpilot.global.ScriptFileUtil;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ScriptInitializer implements ApplicationRunner {

	private final ResourceLoader resourceLoader;

	@Override
	public void run(ApplicationArguments args) {
		ScriptFileUtil.extractScriptsToTemp(resourceLoader);
	}
}
