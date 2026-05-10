package com.shinhan.tpops.configquery;

import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.configfile.ParseStatus;
import java.time.LocalDateTime;

public record ConfigFileResponse(
	Long fileId,
	Long serverId,
	String fileName,
	Integer versionNo,
	Boolean current,
	String fileHash,
	LocalDateTime uploadedAt,
	ParseStatus parseStatus,
	String errorMessage,
	LocalDateTime parsedAt
) {

	public static ConfigFileResponse from(ConfigFile configFile) {
		return new ConfigFileResponse(
			configFile.getId(),
			configFile.getServerInfo().getId(),
			configFile.getFileName(),
			configFile.getVersionNo(),
			configFile.getCurrent(),
			configFile.getFileHash(),
			configFile.getUploadedAt(),
			configFile.getParseStatus(),
			configFile.getErrorMessage(),
			configFile.getParsedAt()
		);
	}
}
