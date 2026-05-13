package com.shinhan.tpops.servicemetrics;

public record ServiceResponseTimeMetric(
	String serviceName,
	String serverName,
	String businessName,
	long documentCount,
	Double avgResponseTimeSec,
	Double avgResponseTimeMs
) {
}
