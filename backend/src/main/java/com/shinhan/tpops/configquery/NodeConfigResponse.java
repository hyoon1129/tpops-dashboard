package com.shinhan.tpops.configquery;

import com.shinhan.tpops.nodeconfig.NodeConfig;
import java.time.LocalDateTime;

public record NodeConfigResponse(
	Long nodeConfigId,
	Long fileId,
	Long domainConfigId,
	String nodeName,
	String hostname,
	String tmaxdir,
	String appdir,
	String tmaxhome,
	String pathdir,
	String tlogdir,
	String ulogdir,
	String slogdir,
	String nodetype,
	String autobackup,
	Integer maxgwcpc,
	Integer maxgwsvr,
	String clhopt,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static NodeConfigResponse from(NodeConfig nodeConfig) {
		return new NodeConfigResponse(
			nodeConfig.getId(),
			nodeConfig.getConfigFile().getId(),
			nodeConfig.getDomainConfig() == null ? null : nodeConfig.getDomainConfig().getId(),
			nodeConfig.getNodeName(),
			nodeConfig.getHostname(),
			nodeConfig.getTmaxdir(),
			nodeConfig.getAppdir(),
			nodeConfig.getTmaxhome(),
			nodeConfig.getPathdir(),
			nodeConfig.getTlogdir(),
			nodeConfig.getUlogdir(),
			nodeConfig.getSlogdir(),
			nodeConfig.getNodetype(),
			nodeConfig.getAutobackup(),
			nodeConfig.getMaxgwcpc(),
			nodeConfig.getMaxgwsvr(),
			nodeConfig.getClhopt(),
			nodeConfig.getStartLine(),
			nodeConfig.getEndLine(),
			nodeConfig.getCreatedAt()
		);
	}
}
