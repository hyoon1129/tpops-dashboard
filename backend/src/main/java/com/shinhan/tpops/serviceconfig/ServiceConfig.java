package com.shinhan.tpops.serviceconfig;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.serverconfig.ServerConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "service_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "service_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "server_config_id")
	private ServerConfig serverConfig;

	@Column(name = "service_name", nullable = false, length = 255)
	private String serviceName;

	@Column(nullable = false, length = 255)
	private String svrname;

	private Integer svctime;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "business_code")
	private BusinessCode businessCode;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
