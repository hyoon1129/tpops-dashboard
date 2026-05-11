package com.shinhan.tpops.serverconfig;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerConfigRepository extends JpaRepository<ServerConfig, Long> {

	List<ServerConfig> findByConfigFileId(Long fileId);

	Page<ServerConfig> findByConfigFileId(Long fileId, Pageable pageable);
}
