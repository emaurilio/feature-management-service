import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CompanyFeatureFlagEntity } from '../entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlagMapper } from '../mappers/company-feature-flag.mapper';
import { CompanyFeatureFlag } from 'src/FeatureFlagModule/domain/entities/CompanyFeatureFlag';

@Injectable()
export class CompanyFeatureFlagRepository extends Repository<CompanyFeatureFlagEntity> {
  constructor(private dataSource: DataSource) {
    super(CompanyFeatureFlagEntity, dataSource.createEntityManager());
  }

  async findByCompany(companyId: string) {
    return this.find({ where: { companyId } });
  }

  async createCompanyFeatureFlag(companyFeatureFlag: CompanyFeatureFlagEntity) {
    return this.save(companyFeatureFlag);
  }

  async createMany(companyFeatureFlags: CompanyFeatureFlag[]) {
    const entities = companyFeatureFlags.map((companyFeatureFlag) => {
      return CompanyFeatureFlagMapper.toPersistence(companyFeatureFlag);
    });
    return this.save(entities);
  }

  async findByCompanyIdAndFeatureFlagId(companyId: string, featureId: string) {
    return this.findOne({ where: { companyId, featureId } });
  }
}
