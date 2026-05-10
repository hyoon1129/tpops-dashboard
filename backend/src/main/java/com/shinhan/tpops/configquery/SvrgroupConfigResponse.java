package com.shinhan.tpops.configquery;

import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import java.time.LocalDateTime;

public record SvrgroupConfigResponse(
	Long svrgroupConfigId,
	Long fileId,
	Long nodeConfigId,
	String svrgroupName,
	String nodename,
	String cousin,
	Integer loadValue,
	String backup,
	String envfile,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static SvrgroupConfigResponse from(SvrgroupConfig svrgroupConfig) {
		return new SvrgroupConfigResponse(
			svrgroupConfig.getId(),
			svrgroupConfig.getConfigFile().getId(),
			svrgroupConfig.getNodeConfig() == null ? null : svrgroupConfig.getNodeConfig().getId(),
			svrgroupConfig.getSvrgroupName(),
			svrgroupConfig.getNodename(),
			svrgroupConfig.getCousin(),
			svrgroupConfig.getLoadValue(),
			svrgroupConfig.getBackup(),
			svrgroupConfig.getEnvfile(),
			svrgroupConfig.getStartLine(),
			svrgroupConfig.getEndLine(),
			svrgroupConfig.getCreatedAt()
		);
	}
}
