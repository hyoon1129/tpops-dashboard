package com.shinhan.tpops.servicemetrics;

import java.time.Instant;
import java.util.List;

public record ServiceResponseTimeResponse(
	String indexName,
	String serviceNameField,
	String responseTimeField,
	Instant from,
	Instant to,
	long documentCount,
	List<ServiceResponseTimeMetric> services
) {
}
