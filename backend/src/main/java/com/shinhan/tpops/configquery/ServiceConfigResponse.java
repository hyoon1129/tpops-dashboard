package com.shinhan.tpops.configquery;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import java.time.LocalDateTime;

public record ServiceConfigResponse(
	Long serviceConfigId,
	Long fileId,
	Long serverConfigId,
	String serviceName,
	String svrname,
	Integer svctime,
	String businessCode,
	String businessName,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static ServiceConfigResponse from(ServiceConfig serviceConfig) {
		BusinessCode businessCode = serviceConfig.getBusinessCode();
		return new ServiceConfigResponse(
			serviceConfig.getId(),
			serviceConfig.getConfigFile().getId(),
			serviceConfig.getServerConfig() == null ? null : serviceConfig.getServerConfig().getId(),
			serviceConfig.getServiceName(),
			serviceConfig.getSvrname(),
			serviceConfig.getSvctime(),
			businessCode == null ? null : businessCode.getCode(),
			businessCode == null ? null : businessCode.getBusinessName(),
			serviceConfig.getStartLine(),
			serviceConfig.getEndLine(),
			serviceConfig.getCreatedAt()
		);
	}
}
