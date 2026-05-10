package com.shinhan.tpops.serverinfo;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerInfoController {

	private final ServerInfoService serverInfoService;

	@GetMapping
	public List<ServerInfoResponse> findAll() {
		return serverInfoService.findAll();
	}

	@PostMapping
	public ResponseEntity<ServerInfoResponse> create(@Valid @RequestBody ServerInfoCreateRequest request) {
		ServerInfoResponse response = serverInfoService.create(request);
		return ResponseEntity
			.created(URI.create("/api/servers/" + response.serverId()))
			.body(response);
	}
}
