package com.shinhan.tpops.businesscode;

import com.shinhan.tpops.serviceconfig.ServiceConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "business_code")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessCode {

	@Id
	@Column(length = 50)
	private String code;

	@Column(name = "business_name", nullable = false, length = 255)
	private String businessName;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "businessCode")
	private List<ServiceConfig> serviceConfigs = new ArrayList<>();

	public BusinessCode(String code, String businessName) {
		this.code = code;
		this.businessName = businessName;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
