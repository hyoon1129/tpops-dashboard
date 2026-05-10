package com.shinhan.tpops.serverconfig;

import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "server_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServerConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "server_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "svrgroup_config_id")
	private SvrgroupConfig svrgroupConfig;

	@Column(name = "server_name", length = 255)
	private String serverName;

	@Column(length = 255)
	private String svgname;

	@Column(length = 100)
	private String svrtype;

	@Column(columnDefinition = "TEXT")
	private String clopt;

	@Column(name = "min_value")
	private Integer minValue;

	@Column(name = "max_value")
	private Integer maxValue;

	@Column(length = 255)
	private String target;

	@Column(length = 50)
	private String schedule;

	private Integer maxqcount;
	private Integer cpc;
	private Integer asqcount;

	@Column(length = 10)
	private String restart;

	private Integer maxrstart;
	private Integer gperiod;

	@Column(name = "start_line")
	private Integer startLine;

	@Column(name = "end_line")
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "serverConfig")
	private List<ServiceConfig> serviceConfigs = new ArrayList<>();

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
