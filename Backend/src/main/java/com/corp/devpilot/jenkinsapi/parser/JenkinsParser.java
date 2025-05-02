package com.corp.devpilot.jenkinsapi.parser;

import com.corp.devpilot.jenkinsapi.domain.dto.CrumbDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JobDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class JenkinsParser {

    public static CrumbDto parseCrumb(String json) {
        JSONObject o = new JSONObject(json);
        return new CrumbDto(
                o.getString("crumbRequestField"),
                o.getString("crumb")
        );
    }

    public static JenkinsInfoDto parseInfo(String json) {
        JSONObject o = new JSONObject(json);
        String mode = o.optString("mode");
        String desc = o.optString("nodeDescription");

        List<JobDto> jobs = new ArrayList<>();
        JSONArray arr = o.getJSONArray("jobs");
        for (int i = 0; i < arr.length(); i++) {
            JSONObject j = arr.getJSONObject(i);
            jobs.add(new JobDto(
                    j.getString("name"),
                    j.getString("url"),
                    j.optString("color")
            ));
        }

        return new JenkinsInfoDto(mode, desc, jobs);
    }
}
