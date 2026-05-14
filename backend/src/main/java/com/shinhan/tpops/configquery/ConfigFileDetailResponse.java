package com.shinhan.tpops.configquery;

import com.shinhan.tpops.configfile.ConfigFile;

public record ConfigFileDetailResponse(
	ConfigFileResponse file,
	String fileContent
) {

	public static ConfigFileDetailResponse from(ConfigFile configFile) {
		return new ConfigFileDetailResponse(
			ConfigFileResponse.from(configFile),
			configFile.getFileContent()
		);
	}
}
