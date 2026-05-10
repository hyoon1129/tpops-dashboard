package com.shinhan.tpops.nodeconfig;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NodeConfigRepository extends JpaRepository<NodeConfig, Long> {

	List<NodeConfig> findByConfigFileId(Long fileId);
}
