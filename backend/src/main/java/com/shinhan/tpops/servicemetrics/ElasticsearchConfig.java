package com.shinhan.tpops.servicemetrics;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.message.BasicHeader;
import org.elasticsearch.client.RestClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;

@Configuration
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.endpoint:}') && T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.api-key:}')")
public class ElasticsearchConfig {

	@Bean(destroyMethod = "close")
	public RestClient tpopsElasticsearchRestClient(
		@Value("${tpops.elasticsearch.endpoint}") String endpoint,
		@Value("${tpops.elasticsearch.api-key}") String apiKey
	) {
		Header[] defaultHeaders = {new BasicHeader("Authorization", "ApiKey " + apiKey)};
		return RestClient.builder(HttpHost.create(endpoint))
			.setDefaultHeaders(defaultHeaders)
			.build();
	}

	@Bean
	public ElasticsearchClient tpopsElasticsearchClient(RestClient tpopsElasticsearchRestClient) {
		ElasticsearchTransport transport = new RestClientTransport(
			tpopsElasticsearchRestClient,
			new JacksonJsonpMapper()
		);
		return new ElasticsearchClient(transport);
	}
}
