package com.shinhan.tpops.domainconfig;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DomainConfigRepository extends JpaRepository<DomainConfig, Long> {

	List<DomainConfig> findByConfigFileId(Long fileId);
}
