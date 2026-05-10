package com.shinhan.tpops.configquery;

import com.shinhan.tpops.gatewayconfig.GatewayConfig;
import java.time.LocalDateTime;

public record GatewayConfigResponse(
	Long gatewayConfigId,
	Long fileId,
	Long nodeConfigId,
	String gatewayName,
	String gwtype,
	String nodename,
	Integer portno,
	Integer rgwportno,
	String rgwaddr,
	Integer cpc,
	String clopt,
	Integer loadValue,
	String backupRgwaddr,
	Integer backupRgwportno,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static GatewayConfigResponse from(GatewayConfig gatewayConfig) {
		return new GatewayConfigResponse(
			gatewayConfig.getId(),
			gatewayConfig.getConfigFile().getId(),
			gatewayConfig.getNodeConfig() == null ? null : gatewayConfig.getNodeConfig().getId(),
			gatewayConfig.getGatewayName(),
			gatewayConfig.getGwtype(),
			gatewayConfig.getNodename(),
			gatewayConfig.getPortno(),
			gatewayConfig.getRgwportno(),
			gatewayConfig.getRgwaddr(),
			gatewayConfig.getCpc(),
			gatewayConfig.getClopt(),
			gatewayConfig.getLoadValue(),
			gatewayConfig.getBackupRgwaddr(),
			gatewayConfig.getBackupRgwportno(),
			gatewayConfig.getStartLine(),
			gatewayConfig.getEndLine(),
			gatewayConfig.getCreatedAt()
		);
	}
}
