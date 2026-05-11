package com.shinhan.tpops.gatewayconfig;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GatewayConfigRepository extends JpaRepository<GatewayConfig, Long> {

	List<GatewayConfig> findByConfigFileId(Long fileId);

	Page<GatewayConfig> findByConfigFileId(Long fileId, Pageable pageable);
}
