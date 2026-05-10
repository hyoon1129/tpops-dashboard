package com.shinhan.tpops.serviceconfig;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceConfigRepository extends JpaRepository<ServiceConfig, Long> {

	List<ServiceConfig> findByConfigFileId(Long fileId);
}
