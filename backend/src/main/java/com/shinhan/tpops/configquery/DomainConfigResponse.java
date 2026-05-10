package com.shinhan.tpops.configquery;

import com.shinhan.tpops.domainconfig.DomainConfig;
import java.time.LocalDateTime;

public record DomainConfigResponse(
	Long domainConfigId,
	Long fileId,
	String domainName,
	Integer domainId,
	String shmkey,
	Integer maxuser,
	Integer minclh,
	Integer maxclh,
	Integer tportno,
	Integer racport,
	Integer blocktime,
	Integer maxsvg,
	Integer maxsvr,
	Integer maxspr,
	Integer maxsvc,
	Integer maxsacall,
	Integer maxcacall,
	Integer maxtotalsvg,
	Integer maxgw,
	Integer maxcpc,
	Integer maxcousin,
	Integer maxcousinsvg,
	Integer gwchkint,
	Integer gwconnectTimeout,
	Integer nclhchktime,
	Integer nliveinq,
	String ipcperm,
	Integer maxnode,
	Integer startLine,
	Integer endLine,
	LocalDateTime createdAt
) {

	public static DomainConfigResponse from(DomainConfig domainConfig) {
		return new DomainConfigResponse(
			domainConfig.getId(),
			domainConfig.getConfigFile().getId(),
			domainConfig.getDomainName(),
			domainConfig.getDomainId(),
			domainConfig.getShmkey(),
			domainConfig.getMaxuser(),
			domainConfig.getMinclh(),
			domainConfig.getMaxclh(),
			domainConfig.getTportno(),
			domainConfig.getRacport(),
			domainConfig.getBlocktime(),
			domainConfig.getMaxsvg(),
			domainConfig.getMaxsvr(),
			domainConfig.getMaxspr(),
			domainConfig.getMaxsvc(),
			domainConfig.getMaxsacall(),
			domainConfig.getMaxcacall(),
			domainConfig.getMaxtotalsvg(),
			domainConfig.getMaxgw(),
			domainConfig.getMaxcpc(),
			domainConfig.getMaxcousin(),
			domainConfig.getMaxcousinsvg(),
			domainConfig.getGwchkint(),
			domainConfig.getGwconnectTimeout(),
			domainConfig.getNclhchktime(),
			domainConfig.getNliveinq(),
			domainConfig.getIpcperm(),
			domainConfig.getMaxnode(),
			domainConfig.getStartLine(),
			domainConfig.getEndLine(),
			domainConfig.getCreatedAt()
		);
	}
}
