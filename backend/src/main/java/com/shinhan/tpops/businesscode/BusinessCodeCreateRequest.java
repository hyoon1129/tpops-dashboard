package com.shinhan.tpops.businesscode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BusinessCodeCreateRequest(
	@NotBlank
	@Size(max = 50)
	String code,

	@NotBlank
	@Size(max = 255)
	String businessName
) {
}
