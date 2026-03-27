import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CompanyFeatureFlagEntity } from '../entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlagMapper } from '../mappers/company-feature-flag.mapper';
import { CompanyFeatureFlag } from 'src/feature-flag/domain/entities/CompanyFeatureFlag';

@Injectable()
export class CompanyFeatureFlagRepository extends Repository<CompanyFeatureFlagEntity> {
  constructor(private dataSource: DataSource) {
    super(CompanyFeatureFlagEntity, dataSource.createEntityManager());
  }

  async findByCompany(companyId: string) {
    const findCompany = await this.find({ where: { companyId } });
    if (!findCompany) {
      return null;
    }

    return findCompany.map((companyFeatureFlag) => {
      return CompanyFeatureFlagMapper.toDomain(companyFeatureFlag);
    });
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
    const findOneCompanyFeatureFlag = await this.findOne({
      where: { companyId, featureId },
    });
    if (!findOneCompanyFeatureFlag) {
      return null;
    }

    return CompanyFeatureFlagMapper.toDomain(findOneCompanyFeatureFlag);
  }

  async deleteByFeatureFlagId(featureId: string) {
    return this.delete({ featureId });
  }
}
