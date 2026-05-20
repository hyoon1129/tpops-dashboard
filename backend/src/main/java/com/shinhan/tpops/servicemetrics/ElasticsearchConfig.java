package com.shinhan.tpops.servicemetrics;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import javax.net.ssl.SSLContext;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.message.BasicHeader;
import org.apache.http.ssl.SSLContexts;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class ElasticsearchConfig {

	@Bean(destroyMethod = "close")
	@ConditionalOnExpression(
		"T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.endpoint:}') " +
		"&& T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.api-key:}')"
	)
	public RestClient apiKeyRestClient(
		@Value("${tpops.elasticsearch.endpoint}") String endpoint,
		@Value("${tpops.elasticsearch.api-key}") String apiKey
	) {
		Header[] defaultHeaders = {new BasicHeader("Authorization", "ApiKey " + apiKey)};
		return RestClient.builder(HttpHost.create(endpoint))
			.setDefaultHeaders(defaultHeaders)
			.build();
	}

	@Bean(destroyMethod = "close")
	@Primary
	@ConditionalOnExpression(
		"T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.endpoint:}') " +
		"&& T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.ca-cert-path:}') " +
		"&& T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.api-key:}')"
	)
	public RestClient caCertRestClient(
		@Value("${tpops.elasticsearch.endpoint}") String endpoint,
		@Value("${tpops.elasticsearch.ca-cert-path}") String caCertPath,
		@Value("${tpops.elasticsearch.api-key}") String apiKey
	) throws Exception {
		CertificateFactory cf = CertificateFactory.getInstance("X.509");
		Certificate trustedCa;
		try (InputStream is = Files.newInputStream(Paths.get(caCertPath))) {
			trustedCa = cf.generateCertificate(is);
		}

		KeyStore trustStore = KeyStore.getInstance("pkcs12");
		trustStore.load(null, null);
		trustStore.setCertificateEntry("ca", trustedCa);

		SSLContext sslContext = SSLContexts.custom()
			.loadTrustMaterial(trustStore, null)
			.build();

		Header[] defaultHeaders = {new BasicHeader("Authorization", "ApiKey " + apiKey)};
		return RestClient.builder(HttpHost.create(endpoint))
			.setDefaultHeaders(defaultHeaders)
			.setHttpClientConfigCallback(httpClientBuilder ->
				httpClientBuilder.setSSLContext(sslContext))
			.build();
	}

	@Bean
	@ConditionalOnExpression(
		"T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.endpoint:}') " +
		"&& (T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.api-key:}') " +
		"|| T(org.springframework.util.StringUtils).hasText('${tpops.elasticsearch.ca-cert-path:}'))"
	)
	public ElasticsearchClient tpopsElasticsearchClient(RestClient tpopsElasticsearchRestClient) {
		ElasticsearchTransport transport = new RestClientTransport(
			tpopsElasticsearchRestClient,
			new JacksonJsonpMapper()
		);
		return new ElasticsearchClient(transport);
	}
}
