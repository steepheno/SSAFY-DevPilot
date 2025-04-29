package com.corp.devpilot.jenkinsfile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BranchConfig {
	private String branchName;
	private boolean buildEnabled;
	private boolean testEnabled;
	private boolean deployEnabled;
}
