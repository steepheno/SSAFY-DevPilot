package com.corp.devpilot.jenkinsapi.parser;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import com.corp.devpilot.jenkinsapi.domain.dto.CrumbDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsEventDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JobDto;

@Component
public class JenkinsParser {

	public static CrumbDto parseCrumb(String json) {
		JSONObject object = new JSONObject(json);
		return new CrumbDto(
			object.getString("crumbRequestField"),
			object.getString("crumb")
		);
	}

	public static JenkinsInfoDto parseInfo(String json) {
		JSONObject object = new JSONObject(json);
		String mode = object.optString("mode");
		String desc = object.optString("nodeDescription");

		List<JobDto> jobs = new ArrayList<>();
		JSONArray arr = object.getJSONArray("jobs");
		for (int i = 0; i < arr.length(); i++) {
			JSONObject jsonObject = arr.getJSONObject(i);
			jobs.add(new JobDto(
				jsonObject.getString("name"),
				jsonObject.getString("url"),
				jsonObject.optString("color")
			));
		}

		return new JenkinsInfoDto(mode, desc, jobs);
	}

	public static JenkinsEventDto parseEvent(String json) {
		JSONObject object = new JSONObject(json);
		System.out.println(json);
		if (!object.has("jenkins_event")) {
			return null;  // 구독 확인이나 heartbeat 등, 무시하고 다음으로
		}
		String evt = object.getString("jenkins_event");
		String name = object.optString("job_name");
		int buildNumber = object.optInt("jenkins_object_id");
		long timestamp = object.optLong("timestamp", System.currentTimeMillis());
		String result = object.optString("result", null);

		return new JenkinsEventDto(evt, name, buildNumber, result, timestamp);
	}
}
