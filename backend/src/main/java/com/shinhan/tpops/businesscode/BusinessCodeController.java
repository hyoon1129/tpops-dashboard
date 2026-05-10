package com.shinhan.tpops.businesscode;

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
@RequestMapping("/api/business-codes")
@RequiredArgsConstructor
public class BusinessCodeController {

	private final BusinessCodeService businessCodeService;

	@GetMapping
	public List<BusinessCodeResponse> findAll() {
		return businessCodeService.findAll();
	}

	@PostMapping
	public ResponseEntity<BusinessCodeResponse> create(@Valid @RequestBody BusinessCodeCreateRequest request) {
		BusinessCodeResponse response = businessCodeService.create(request);
		return ResponseEntity
			.created(URI.create("/api/business-codes/" + response.code()))
			.body(response);
	}
}
