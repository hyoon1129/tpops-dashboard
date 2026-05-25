package com.shinhan.tpops.search;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.configfile.ConfigFileRepository;
import com.shinhan.tpops.domainconfig.DomainConfig;
import com.shinhan.tpops.domainconfig.DomainConfigRepository;
import com.shinhan.tpops.gatewayconfig.GatewayConfig;
import com.shinhan.tpops.gatewayconfig.GatewayConfigRepository;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.nodeconfig.NodeConfigRepository;
import com.shinhan.tpops.parser.ConfigSection;
import com.shinhan.tpops.serverconfig.ServerConfig;
import com.shinhan.tpops.serverconfig.ServerConfigRepository;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfigRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfigSearchService {

	private final ConfigFileRepository configFileRepository;
	private final DomainConfigRepository domainConfigRepository;
	private final NodeConfigRepository nodeConfigRepository;
	private final SvrgroupConfigRepository svrgroupConfigRepository;
	private final ServerConfigRepository serverConfigRepository;
	private final ServiceConfigRepository serviceConfigRepository;
	private final GatewayConfigRepository gatewayConfigRepository;

	@Transactional(readOnly = true)
	public List<SearchResultResponse> search(Long serverId, ConfigSection section, String keyword) {
		if (keyword == null || keyword.isBlank()) {
			return List.of();
		}

		ConfigFile configFile = configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
			.orElse(null);
		if (configFile == null) {
			return List.of();
		}

		List<SearchResultResponse> results = new ArrayList<>();
		String normalizedKeyword = keyword.toLowerCase(Locale.ROOT);
		if (section == null || section == ConfigSection.DOMAIN) {
			searchDomains(results, configFile.getId(), normalizedKeyword);
		}
		if (section == null || section == ConfigSection.NODE) {
			searchNodes(results, configFile.getId(), normalizedKeyword);
		}
		if (section == null || section == ConfigSection.SVRGROUP) {
			searchSvrgroups(results, configFile.getId(), normalizedKeyword);
		}
		if (section == null || section == ConfigSection.SERVER) {
			searchServers(results, configFile.getId(), normalizedKeyword);
		}
		if (section == null || section == ConfigSection.SERVICE) {
			searchServices(results, configFile.getId(), normalizedKeyword);
		}
		if (section == null || section == ConfigSection.GATEWAY) {
			searchGateways(results, configFile.getId(), normalizedKeyword);
		}
		return results;
	}

	private void searchDomains(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (DomainConfig domain : domainConfigRepository.findByConfigFileId(fileId)) {
			String related = null;
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "domainName", domain.getDomainName(), keyword);
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "domainId", domain.getDomainId(), keyword);
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "shmkey", domain.getShmkey(), keyword);
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "tportno", domain.getTportno(), keyword);
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "racport", domain.getRacport(), keyword);
			addIfMatched(results, ConfigSection.DOMAIN, domain.getDomainName(), related, "ipcperm", domain.getIpcperm(), keyword);
		}
	}

	private void searchNodes(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (NodeConfig node : nodeConfigRepository.findByConfigFileId(fileId)) {
			String related = node.getHostname();
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "nodeName", node.getNodeName(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "hostname", node.getHostname(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "tmaxdir", node.getTmaxdir(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "appdir", node.getAppdir(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "tmaxhome", node.getTmaxhome(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "nodetype", node.getNodetype(), keyword);
			addIfMatched(results, ConfigSection.NODE, node.getNodeName(), related, "clhopt", node.getClhopt(), keyword);
		}
	}

	private void searchSvrgroups(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (SvrgroupConfig svrgroup : svrgroupConfigRepository.findByConfigFileId(fileId)) {
			String related = svrgroup.getNodename();
			addIfMatched(results, ConfigSection.SVRGROUP, svrgroup.getSvrgroupName(), related, "svrgroupName", svrgroup.getSvrgroupName(), keyword);
			addIfMatched(results, ConfigSection.SVRGROUP, svrgroup.getSvrgroupName(), related, "nodename", svrgroup.getNodename(), keyword);
			addIfMatched(results, ConfigSection.SVRGROUP, svrgroup.getSvrgroupName(), related, "cousin", svrgroup.getCousin(), keyword);
			addIfMatched(results, ConfigSection.SVRGROUP, svrgroup.getSvrgroupName(), related, "backup", svrgroup.getBackup(), keyword);
			addIfMatched(results, ConfigSection.SVRGROUP, svrgroup.getSvrgroupName(), related, "envfile", svrgroup.getEnvfile(), keyword);
		}
	}

	private void searchServers(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (ServerConfig server : serverConfigRepository.findByConfigFileId(fileId)) {
			String related = server.getSvgname();
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "serverName", server.getServerName(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "svgname", server.getSvgname(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "svrtype", server.getSvrtype(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "clopt", server.getClopt(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "target", server.getTarget(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "schedule", server.getSchedule(), keyword);
			addIfMatched(results, ConfigSection.SERVER, server.getServerName(), related, "restart", server.getRestart(), keyword);
		}
	}

	private void searchServices(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (ServiceConfig service : serviceConfigRepository.findByConfigFileId(fileId)) {
			BusinessCode businessCode = service.getBusinessCode();
			String businessCodeValue = businessCode == null ? null : businessCode.getCode();
			String businessName = businessCode == null ? null : businessCode.getBusinessName();
			String related = service.getSvrname();
			addIfMatched(results, ConfigSection.SERVICE, service.getServiceName(), related, "serviceName", service.getServiceName(), keyword);
			addIfMatched(results, ConfigSection.SERVICE, service.getServiceName(), related, "svrname", service.getSvrname(), keyword);
			addIfMatched(results, ConfigSection.SERVICE, service.getServiceName(), related, "svctime", service.getSvctime(), keyword);
			addIfMatched(results, ConfigSection.SERVICE, service.getServiceName(), related, "businessCode", businessCodeValue, keyword);
			addIfMatched(results, ConfigSection.SERVICE, service.getServiceName(), related, "businessName", businessName, keyword);
		}
	}

	private void searchGateways(List<SearchResultResponse> results, Long fileId, String keyword) {
		for (GatewayConfig gateway : gatewayConfigRepository.findByConfigFileId(fileId)) {
			String related = gateway.getNodename();
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "gatewayName", gateway.getGatewayName(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "gwtype", gateway.getGwtype(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "nodename", gateway.getNodename(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "portno", gateway.getPortno(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "rgwportno", gateway.getRgwportno(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "rgwaddr", gateway.getRgwaddr(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "clopt", gateway.getClopt(), keyword);
			addIfMatched(results, ConfigSection.GATEWAY, gateway.getGatewayName(), related, "backupRgwaddr", gateway.getBackupRgwaddr(), keyword);
		}
	}

	private void addIfMatched(
		List<SearchResultResponse> results,
		ConfigSection section,
		String name,
		String related,
		String field,
		Object value,
		String keyword
	) {
		if (value == null) {
			return;
		}
		String stringValue = String.valueOf(value);
		if (stringValue.toLowerCase(Locale.ROOT).contains(keyword)) {
			results.add(new SearchResultResponse(section, name, related, field, stringValue));
		}
	}
}
