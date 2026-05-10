package com.shinhan.tpops.businesscode;

import java.time.LocalDateTime;

public record BusinessCodeResponse(
	String code,
	String businessName,
	LocalDateTime createdAt
) {

	public static BusinessCodeResponse from(BusinessCode businessCode) {
		return new BusinessCodeResponse(
			businessCode.getCode(),
			businessCode.getBusinessName(),
			businessCode.getCreatedAt()
		);
	}
}
