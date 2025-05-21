package com.corp.devpilot.jenkinsapi.parser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import com.corp.devpilot.jenkinsapi.domain.dto.BuildDetailDto;
import com.corp.devpilot.jenkinsapi.domain.dto.BuildSummaryDto;
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

	public static List<BuildSummaryDto> parseBuildSummaries(String json) {
		JSONObject root = new JSONObject(json);
		JSONArray builds = root.getJSONArray("builds");
		List<BuildSummaryDto> list = new ArrayList<>();
		for (int i = 0; i < builds.length(); i++) {
			JSONObject node = builds.getJSONObject(i);
			list.add(BuildSummaryDto.builder()
				.number(node.getInt("number"))
				.result(node.optString("result", null))
				.timestamp(node.optLong("timestamp"))
				.duration(node.optLong("duration"))
				.build());
		}
		return list;
	}

	public static BuildDetailDto parseBuildDetail(String json) {
		JSONObject root = new JSONObject(json);

		// parameters 추출
		List<Map<String, Object>> params = new ArrayList<>();
		JSONArray actions = root.optJSONArray("actions");
		if (actions != null) {
			for (int i = 0; i < actions.length(); i++) {
				JSONObject action = actions.getJSONObject(i);
				if (action.has("causes")) {
					JSONArray causes = action.getJSONArray("causes");
					for (int j = 0; j < causes.length(); j++) {
						JSONObject jsonObject = causes.getJSONObject(j);
						Map<String, Object> map = new HashMap<>();
						if (jsonObject.has("userId")) {
							map.put("userId", jsonObject.optString("userId"));
						}
						if (jsonObject.has("userName")) {
							map.put("userName", jsonObject.optString("userName"));
						}
						if (jsonObject.has("shortDescription")) {
							map.put("shortDescription", jsonObject.optString("shortDescription"));
						}
						params.add(map);
					}
				}
			}
		}

		return BuildDetailDto.builder()
			.number(root.optInt("number", -1))
			.result(root.optString("result", null))
			.timestamp(root.optLong("timestamp", 0L))
			.duration(root.optLong("duration", 0L))
			.fullDisplayName(root.optString("fullDisplayName", null))
			.parameters(params)
			.build();
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

	public static int parseLastBuildNumber(String json) {
		JSONObject root = new JSONObject(json);
		return root.optInt("number", 0);
	}
}
