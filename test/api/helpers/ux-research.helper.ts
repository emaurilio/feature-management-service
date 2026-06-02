import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { HashUXResearchService } from 'src/modules/ux-research/application/services/hash-ux-research.service';
import { defaultUserData } from './feature-flag.helper';

export function createUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  params: {
    name: string;
    type: UXResearchType;
    percentage?: number;
    featureFlagName?: string;
    startDate?: Date;
    endDate?: Date;
  },
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/create')
    .set('Authorization', apiKey)
    .send({
      name: params.name,
      type: params.type,
      percentage: params.percentage,
      feature_flag_name: params.featureFlagName,
      start_date: params.startDate,
      end_date: params.endDate,
      user_data: defaultUserData,
    });
}

export function importUxUsersViaSts(
  app: INestApplication,
  apiKey: string,
  uxResearchName: string,
  usersIds: string[],
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/import-users-ids')
    .set('Authorization', apiKey)
    .send({
      ux_research_name: uxResearchName,
      users_ids: usersIds,
      user_data: defaultUserData,
    });
}

export function importUxCompaniesViaSts(
  app: INestApplication,
  apiKey: string,
  uxResearchName: string,
  companiesIds: string[],
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/import-companies-ids')
    .set('Authorization', apiKey)
    .send({
      ux_research_name: uxResearchName,
      companies_ids: companiesIds,
      user_data: defaultUserData,
    });
}

export function disableUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .patch('/v1/sts/ux-research/disable')
    .set('Authorization', apiKey)
    .send({
      ux_research_name: name,
      user_data: defaultUserData,
    });
}

export function activeUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .patch('/v1/sts/ux-research/active')
    .set('Authorization', apiKey)
    .send({
      ux_research_name: name,
      user_data: defaultUserData,
    });
}

export function deleteUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
) {
  return request(app.getHttpServer())
    .delete('/v1/sts/ux-research/delete')
    .set('Authorization', apiKey)
    .send({
      name,
      user_data: defaultUserData,
    });
}

export function searchUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
  page = 1,
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/search')
    .set('Authorization', apiKey)
    .send({
      name,
      page,
      user_data: defaultUserData,
    });
}

export function checkUxResearchViaSts(
  app: INestApplication,
  apiKey: string,
  params: { name: string; userId?: string; companyId?: string },
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/check-ux-research')
    .set('Authorization', apiKey)
    .send({
      name: params.name,
      user_id: params.userId,
      company_id: params.companyId,
    });
}

export function createUxResearchResponseViaSts(
  app: INestApplication,
  apiKey: string,
  params: {
    uxResearchName: string;
    userId: string;
    responseData: string;
    responseDate: Date;
  },
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/create-ux-research-response')
    .set('Authorization', apiKey)
    .send({
      ux_research_name: params.uxResearchName,
      user_id: params.userId,
      response_data: params.responseData,
      response_date: params.responseDate,
      user_data: defaultUserData,
    });
}

export function deleteUxResearchResponseViaSts(
  app: INestApplication,
  apiKey: string,
  uxResponseId: string,
) {
  return request(app.getHttpServer())
    .delete('/v1/sts/ux-research/delete-ux-research-response')
    .set('Authorization', apiKey)
    .send({
      ux_research_response_id: uxResponseId,
      user_data: defaultUserData,
    });
}

export function getUxResearchResponsesViaSts(
  app: INestApplication,
  apiKey: string,
  name: string,
  page = 1,
) {
  return request(app.getHttpServer())
    .post('/v1/sts/ux-research/get-responses')
    .set('Authorization', apiKey)
    .send({
      name,
      page,
      user_data: defaultUserData,
    });
}

export function expectedUxPercentageResult(
  entityId: string,
  uxResearchName: string,
  version: number,
  percentage: number,
): boolean {
  const hashService = new HashUXResearchService();
  const hashName = `${entityId}-${uxResearchName}-${version}`;
  return hashService.calculateHash(hashName) < percentage;
}
