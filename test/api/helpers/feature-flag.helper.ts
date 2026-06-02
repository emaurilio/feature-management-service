import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { HashFeatureFlagService } from 'src/modules/feature-flag/application/services/hash-feature-flag.service';

export const defaultUserData = {
  userId: 'admin-user',
  email: 'admin@test.com',
  name: 'Admin Test',
};

export function createFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  params: {
    name: string;
    type: FeatureFlagType;
    percentage?: number;
  },
) {
  return request(app.getHttpServer())
    .post('/v1/sts/feature-flag/create')
    .set('Authorization', apiKey)
    .send({
      name: params.name,
      type: params.type,
      percentage: params.percentage,
      user_data: defaultUserData,
    });
}

export function importUsersViaSts(
  app: INestApplication,
  apiKey: string,
  featureFlagName: string,
  usersIds: string[],
) {
  return request(app.getHttpServer())
    .post('/v1/sts/feature-flag/import-users-ids')
    .set('Authorization', apiKey)
    .send({
      feature_flag_name: featureFlagName,
      users_ids: usersIds,
      user_data: defaultUserData,
    });
}

export function importCompaniesViaSts(
  app: INestApplication,
  apiKey: string,
  featureFlagName: string,
  companiesIds: string[],
) {
  return request(app.getHttpServer())
    .post('/v1/sts/feature-flag/import-companies-ids')
    .set('Authorization', apiKey)
    .send({
      feature_flag_name: featureFlagName,
      companies_ids: companiesIds,
      user_data: defaultUserData,
    });
}

export function disableFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .patch('/v1/sts/feature-flag/disable')
    .set('Authorization', apiKey)
    .send({
      feature_flag_name: name,
      user_data: defaultUserData,
    });
}

export function activeFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .patch('/v1/sts/feature-flag/active')
    .set('Authorization', apiKey)
    .send({
      feature_flag_name: name,
      user_data: defaultUserData,
    });
}

export function deleteFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .delete('/v1/sts/feature-flag/delete')
    .set('Authorization', apiKey)
    .send({
      name,
      user_data: defaultUserData,
    });
}

export function searchFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
  page = 1,
) {
  return request(app.getHttpServer())
    .post('/v1/sts/feature-flag/search')
    .set('Authorization', apiKey)
    .send({
      name,
      page,
      user_data: defaultUserData,
    });
}

export function checkFeatureFlagViaSts(
  app: INestApplication,
  apiKey: string,
  params: { name: string; userId?: string; companyId?: string },
) {
  return request(app.getHttpServer())
    .post('/v1/sts/feature-flag/check-feature-flag')
    .set('Authorization', apiKey)
    .send({
      name: params.name,
      user_id: params.userId,
      company_id: params.companyId,
    });
}

export function expectedPercentageResult(
  entityId: string,
  featureName: string,
  version: number,
  percentage: number,
): boolean {
  const hashService = new HashFeatureFlagService();
  const hashName = `${entityId}-${featureName}-${version}`;
  return hashService.calculateHash(hashName) < percentage;
}
