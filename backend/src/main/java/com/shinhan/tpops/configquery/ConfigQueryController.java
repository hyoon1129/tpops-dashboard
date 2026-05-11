package com.shinhan.tpops.configquery;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

	@GetMapping("/domains/page")
	public PageResponse<DomainConfigResponse> findDomains(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findDomains(serverId, page, size, sort, direction);
	}

	@GetMapping("/nodes")
	public List<NodeConfigResponse> findNodes(@PathVariable Long serverId) {
		return configQueryService.findNodes(serverId);
	}

	@GetMapping("/nodes/page")
	public PageResponse<NodeConfigResponse> findNodes(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findNodes(serverId, page, size, sort, direction);
	}

	@GetMapping("/svrgroups")
	public List<SvrgroupConfigResponse> findSvrgroups(@PathVariable Long serverId) {
		return configQueryService.findSvrgroups(serverId);
	}

	@GetMapping("/svrgroups/page")
	public PageResponse<SvrgroupConfigResponse> findSvrgroups(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findSvrgroups(serverId, page, size, sort, direction);
	}

	@GetMapping("/server-configs")
	public List<ServerConfigResponse> findServerConfigs(@PathVariable Long serverId) {
		return configQueryService.findServerConfigs(serverId);
	}

	@GetMapping("/server-configs/page")
	public PageResponse<ServerConfigResponse> findServerConfigs(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findServerConfigs(serverId, page, size, sort, direction);
	}

	@GetMapping("/services")
	public List<ServiceConfigResponse> findServices(@PathVariable Long serverId) {
		return configQueryService.findServices(serverId);
	}

	@GetMapping("/services/page")
	public PageResponse<ServiceConfigResponse> findServices(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findServices(serverId, page, size, sort, direction);
	}

	@GetMapping("/gateways")
	public List<GatewayConfigResponse> findGateways(@PathVariable Long serverId) {
		return configQueryService.findGateways(serverId);
	}

	@GetMapping("/gateways/page")
	public PageResponse<GatewayConfigResponse> findGateways(
		@PathVariable Long serverId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "100") int size,
		@RequestParam(defaultValue = "id") String sort,
		@RequestParam(defaultValue = "ASC") Sort.Direction direction
	) {
		return configQueryService.findGateways(serverId, page, size, sort, direction);
	}
}
