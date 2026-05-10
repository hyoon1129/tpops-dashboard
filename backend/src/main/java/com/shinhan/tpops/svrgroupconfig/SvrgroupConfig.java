package com.shinhan.tpops.svrgroupconfig;

import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.serverconfig.ServerConfig;
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
@Table(name = "svrgroup_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SvrgroupConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "svrgroup_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "node_config_id")
	private NodeConfig nodeConfig;

	@Column(name = "svrgroup_name", length = 255)
	private String svrgroupName;

	@Column(length = 255)
	private String nodename;

	@Column(length = 255)
	private String cousin;

	@Column(name = "load_value")
	private Integer loadValue;

	@Column(length = 255)
	private String backup;

	@Column(length = 500)
	private String envfile;

	@Column(name = "start_line")
	private Integer startLine;

	@Column(name = "end_line")
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "svrgroupConfig")
	private List<ServerConfig> serverConfigs = new ArrayList<>();

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
