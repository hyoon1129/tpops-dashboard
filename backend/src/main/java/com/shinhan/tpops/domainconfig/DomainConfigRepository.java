package com.shinhan.tpops.domainconfig;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DomainConfigRepository extends JpaRepository<DomainConfig, Long> {

	List<DomainConfig> findByConfigFileId(Long fileId);

	Page<DomainConfig> findByConfigFileId(Long fileId, Pageable pageable);

	Page<DomainConfig> findByConfigFileIdAndDomainNameContainingIgnoreCase(Long fileId, String keyword, Pageable pageable);
}
