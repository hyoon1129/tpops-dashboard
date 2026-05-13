package com.shinhan.tpops.servicemetrics;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregate;
import co.elastic.clients.elasticsearch._types.aggregations.AvgAggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ServiceResponseTimeService {

	private static final String BY_SERVICE_AGGREGATION = "by_service";
	private static final String AVG_RESPONSE_TIME_AGGREGATION = "avg_response_time";

	private final ObjectProvider<ElasticsearchClient> elasticsearchClientProvider;
	private final ServiceConfigRepository serviceConfigRepository;

	@Value("${tpops.elasticsearch.index-name:tp-svclog-test}")
	private String indexName;

	@Value("${tpops.elasticsearch.timestamp-field:@timestamp}")
	private String timestampField;

	@Value("${tpops.elasticsearch.service-name-field:tp_svc_id}")
	private String serviceNameField;

	@Value("${tpops.elasticsearch.response-time-field:tp_resp_time}")
	private String responseTimeField;

public ServiceResponseTimeResponse findServiceResponseTimes(Instant from, Instant to) {
		validateRequest(from, to);
		ElasticsearchClient client = elasticsearchClientProvider.getIfAvailable();
		if (client == null) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Elasticsearch 접속 정보가 설정되지 않았습니다.");
		}

		Map<String, ServiceConfig> serviceConfigs = serviceConfigRepository.findAllWithBusinessCode().stream()
			.collect(Collectors.toMap(ServiceConfig::getServiceName, Function.identity(), (first, ignored) -> first));
		if (serviceConfigs.isEmpty()) {
			return new ServiceResponseTimeResponse(indexName, serviceNameField, responseTimeField, from, to, 0, List.of());
		}
		List<String> serviceNames = List.copyOf(serviceConfigs.keySet());

		try {
			SearchResponse<Void> response = client.search(search -> search
				.index(indexName)
				.size(0)
				.query(query -> query.range(range -> range
					.date(date -> date
						.field(timestampField)
						.gte(from.toString())
						.lt(to.toString())
					)
				))
				.aggregations(BY_SERVICE_AGGREGATION, aggregation -> aggregation
					.terms(terms -> terms
						.field(serviceNameField)
						.size(serviceNames.size())
						.include(include -> include.terms(serviceNames))
					)
					.aggregations(AVG_RESPONSE_TIME_AGGREGATION, aggregationBuilder -> aggregationBuilder
						.avg(avg -> avg.field(responseTimeField))
					)
				),
				Void.class
			);

			return toResponse(from, to, serviceConfigs, response);
		} catch (ElasticsearchException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Elasticsearch 조회에 실패했습니다.", exception);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Elasticsearch 응답을 처리하지 못했습니다.", exception);
		}
	}

	private void validateRequest(Instant from, Instant to) {
		if (from == null || to == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회 시작/종료 시간이 필요합니다.");
		}
		if (!from.isBefore(to)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회 시작 시간은 종료 시간보다 이전이어야 합니다.");
		}
	}

	private ServiceResponseTimeResponse toResponse(Instant from, Instant to, Map<String, ServiceConfig> serviceConfigs, SearchResponse<Void> response) {
		Aggregate byService = response.aggregations().get(BY_SERVICE_AGGREGATION);
		if (byService == null || !byService.isSterms()) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "서비스별 응답 시간 집계 결과가 올바르지 않습니다.");
		}

		List<StringTermsBucket> buckets = byService.sterms().buckets().array();
		List<ServiceResponseTimeMetric> metrics = buckets.stream()
			.map(bucket -> toMetric(bucket, serviceConfigs.get(bucket.key().stringValue())))
			.filter(Objects::nonNull)
			.toList();
		long documentCount = response.hits().total() == null ? 0 : response.hits().total().value();

		return new ServiceResponseTimeResponse(
			indexName,
			serviceNameField,
			responseTimeField,
			from,
			to,
			documentCount,
			metrics
		);
	}

	private ServiceResponseTimeMetric toMetric(StringTermsBucket bucket, ServiceConfig serviceConfig) {
		String serviceName = bucket.key().stringValue();
		Aggregate averageAggregate = bucket.aggregations().get(AVG_RESPONSE_TIME_AGGREGATION);
		if (averageAggregate == null || !averageAggregate.isAvg()) {
			return null;
		}

		AvgAggregate average = averageAggregate.avg();
		Double averageResponseTimeSec = Double.isNaN(average.value()) ? null : average.value();
		Double averageResponseTimeMs = averageResponseTimeSec == null ? null : averageResponseTimeSec * 1000;
		BusinessCode businessCode = serviceConfig == null ? null : serviceConfig.getBusinessCode();

		return new ServiceResponseTimeMetric(
			serviceName,
			serviceConfig == null ? null : serviceConfig.getSvrname(),
			businessCode == null ? null : businessCode.getBusinessName(),
			bucket.docCount(),
			averageResponseTimeSec,
			averageResponseTimeMs
		);
	}
}
