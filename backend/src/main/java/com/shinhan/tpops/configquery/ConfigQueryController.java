package com.shinhan.tpops.configquery;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servers/{serverId}")
@RequiredArgsConstructor
public class ConfigQueryController {

	private final ConfigQueryService configQueryService;

	@GetMapping("/config-file/current")
	public ConfigFileResponse findCurrentConfigFile(@PathVariable Long serverId) {
		return configQueryService.findCurrentConfigFile(serverId);
	}

	@GetMapping("/domains")
	public List<DomainConfigResponse> findDomains(@PathVariable Long serverId) {
		return configQueryService.findDomains(serverId);
	}

	@GetMapping("/nodes")
	public List<NodeConfigResponse> findNodes(@PathVariable Long serverId) {
		return configQueryService.findNodes(serverId);
	}

	@GetMapping("/svrgroups")
	public List<SvrgroupConfigResponse> findSvrgroups(@PathVariable Long serverId) {
		return configQueryService.findSvrgroups(serverId);
	}

	@GetMapping("/server-configs")
	public List<ServerConfigResponse> findServerConfigs(@PathVariable Long serverId) {
		return configQueryService.findServerConfigs(serverId);
	}

	@GetMapping("/services")
	public List<ServiceConfigResponse> findServices(@PathVariable Long serverId) {
		return configQueryService.findServices(serverId);
	}

	@GetMapping("/gateways")
	public List<GatewayConfigResponse> findGateways(@PathVariable Long serverId) {
		return configQueryService.findGateways(serverId);
	}
}
