package com.shinhan.tpops.configquery;

import com.shinhan.tpops.serverconfig.ServerConfig;
import java.time.LocalDateTime;

public record ServerConfigResponse(
	Long serverConfigId,
	Long fileId,
	Long svrgroupConfigId,
	String serverName,
	String svgname,
	String svrtype,
	String clopt,
	Integer minValue,
	Integer maxValue,
	String target,
	String schedule,
	Integer maxqcount,
	Integer cpc,
	Integer asqcount,
	String restart,
	Integer maxrstart,
	Integer gperiod,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static ServerConfigResponse from(ServerConfig serverConfig) {
		return new ServerConfigResponse(
			serverConfig.getId(),
			serverConfig.getConfigFile().getId(),
			serverConfig.getSvrgroupConfig() == null ? null : serverConfig.getSvrgroupConfig().getId(),
			serverConfig.getServerName(),
			serverConfig.getSvgname(),
			serverConfig.getSvrtype(),
			serverConfig.getClopt(),
			serverConfig.getMinValue(),
			serverConfig.getMaxValue(),
			serverConfig.getTarget(),
			serverConfig.getSchedule(),
			serverConfig.getMaxqcount(),
			serverConfig.getCpc(),
			serverConfig.getAsqcount(),
			serverConfig.getRestart(),
			serverConfig.getMaxrstart(),
			serverConfig.getGperiod(),
			serverConfig.getStartLine(),
			serverConfig.getEndLine(),
			serverConfig.getCreatedAt()
		);
	}
}
