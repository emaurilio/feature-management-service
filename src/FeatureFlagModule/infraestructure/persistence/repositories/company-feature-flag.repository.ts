import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CompanyFeatureFlagEntity } from '../entities/CompanyFeatureFlag.entity';

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
}
