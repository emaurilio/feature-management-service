import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CompanyFeatureFlagEntity } from '../entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlagMapper } from '../mappers/company-feature-flag.mapper';
import { CompanyFeatureFlag } from 'src/feature-flag/domain/entities/CompanyFeatureFlag';
import { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';

@Injectable()
export class CompanyFeatureFlagRepository
  extends Repository<CompanyFeatureFlagEntity>
  implements CompanyFeatureFlagRepositoryInterface
{
  constructor(private dataSource: DataSource) {
    super(CompanyFeatureFlagEntity, dataSource.createEntityManager());
  }

  async findByCompany(companyId: string): Promise<CompanyFeatureFlag[] | null> {
    const findCompany = await this.find({ where: { companyId } });
    if (!findCompany) {
      return null;
    }

    return findCompany.map((companyFeatureFlag) => {
      return CompanyFeatureFlagMapper.toDomain(companyFeatureFlag);
    });
  }

  async createCompanyFeatureFlag(
    companyFeatureFlag: CompanyFeatureFlag,
  ): Promise<CompanyFeatureFlag> {
    return this.save(companyFeatureFlag);
  }

  async createMany(
    companyFeatureFlags: CompanyFeatureFlag[],
  ): Promise<CompanyFeatureFlag[]> {
    const entities = companyFeatureFlags.map((companyFeatureFlag) => {
      return CompanyFeatureFlagMapper.toPersistence(companyFeatureFlag);
    });

    return this.save(entities);
  }

  async findByCompanyIdAndFeatureFlagId(
    companyId: string,
    featureId: string,
  ): Promise<CompanyFeatureFlag | null> {
    const findOneCompanyFeatureFlag = await this.findOne({
      where: { companyId, featureId },
    });
    if (!findOneCompanyFeatureFlag) {
      return null;
    }

    return CompanyFeatureFlagMapper.toDomain(findOneCompanyFeatureFlag);
  }

  async deleteByFeatureFlagId(featureId: string): Promise<boolean> {
    const result = await this.softDelete({ featureId });
    return result.affected !== 0;
  }
}
