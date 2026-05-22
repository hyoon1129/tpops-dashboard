package com.shinhan.tpops.serviceconfig;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceConfigRepository extends JpaRepository<ServiceConfig, Long> {

	List<ServiceConfig> findByConfigFileId(Long fileId);

	Page<ServiceConfig> findByConfigFileId(Long fileId, Pageable pageable);

	Page<ServiceConfig> findByConfigFileIdAndServiceNameContainingIgnoreCase(Long fileId, String keyword, Pageable pageable);

	List<ServiceConfig> findByServiceNameIn(Collection<String> serviceNames);

	@Query("SELECT s FROM ServiceConfig s LEFT JOIN FETCH s.businessCode WHERE s.configFile.current = true")
	List<ServiceConfig> findAllWithBusinessCode();

	@Query("SELECT s FROM ServiceConfig s LEFT JOIN FETCH s.businessCode WHERE s.serviceName = :serviceName AND s.configFile.current = true")
	List<ServiceConfig> findByServiceNameWithBusinessCode(String serviceName);

	@Query("SELECT s FROM ServiceConfig s LEFT JOIN FETCH s.businessCode WHERE s.serviceName = :serviceName AND s.configFile.id = :fileId")
	Optional<ServiceConfig> findByServiceNameAndConfigFileIdWithBusinessCode(String serviceName, Long fileId);
}
