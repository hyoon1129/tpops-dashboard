package com.shinhan.tpops.servicemetrics;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class ServiceResponseTimeController {

	private final ServiceResponseTimeService serviceResponseTimeService;

	@GetMapping("/service-response-times")
	public ServiceResponseTimeResponse findServiceResponseTimes(
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
	) {
		return serviceResponseTimeService.findServiceResponseTimes(from, to);
	}

	@GetMapping("/services/{serviceName}/response-time")
	public ServiceResponseTimeMetric findServiceResponseTime(
		@PathVariable String serviceName,
		@RequestParam(required = false) Long fileId,
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
		@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
	) {
		return serviceResponseTimeService.findServiceResponseTime(serviceName, fileId, from, to);
	}
}
