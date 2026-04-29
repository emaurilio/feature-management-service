import { CompanyUXResearch } from "../../entites/CompanyUXResearch";

export interface CompanyUXResearchRepositoryInterface {
  findByCompanyId(companyId: string): Promise<CompanyUXResearch[] | null>;

  findByCompanyIdAndUXResearchId(
    companyId: string,
    uxResearchId: string,
  ): Promise<CompanyUXResearch | null>;

  createMany(
    companyUXResearchs: CompanyUXResearch[],
  ): Promise<CompanyUXResearch[]>;

  deleteByUXResearchId(uxResearchId: string): Promise<boolean>;
}
