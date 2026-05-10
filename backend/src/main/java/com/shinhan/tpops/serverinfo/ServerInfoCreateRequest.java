package com.shinhan.tpops.serverinfo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ServerInfoCreateRequest(
	@NotBlank
	@Size(max = 100)
	String serverName,

	@Size(max = 50)
	String serverIp,

	@Size(max = 30)
	String environment,

	@Size(max = 255)
	String description
) {
}
