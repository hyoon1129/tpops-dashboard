package com.shinhan.tpops.serviceconfig;

import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceConfigRepository extends JpaRepository<ServiceConfig, Long> {

	List<ServiceConfig> findByConfigFileId(Long fileId);

	Page<ServiceConfig> findByConfigFileId(Long fileId, Pageable pageable);

	List<ServiceConfig> findByServiceNameIn(Collection<String> serviceNames);

	@org.springframework.data.jpa.repository.Query("SELECT s FROM ServiceConfig s LEFT JOIN FETCH s.businessCode")
	List<ServiceConfig> findAllWithBusinessCode();
}
