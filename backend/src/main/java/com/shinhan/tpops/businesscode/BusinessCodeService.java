package com.shinhan.tpops.businesscode;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BusinessCodeService {

	private final BusinessCodeRepository businessCodeRepository;

	@Transactional(readOnly = true)
	public List<BusinessCodeResponse> findAll() {
		return businessCodeRepository.findAll().stream()
			.map(BusinessCodeResponse::from)
			.toList();
	}

	@Transactional
	public BusinessCodeResponse create(BusinessCodeCreateRequest request) {
		BusinessCode businessCode = new BusinessCode(request.code(), request.businessName());
		return BusinessCodeResponse.from(businessCodeRepository.save(businessCode));
	}
}
