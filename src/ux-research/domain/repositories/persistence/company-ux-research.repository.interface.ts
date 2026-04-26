import { CompanyUXResearch } from "../../entites/CompanyUXResearch";

export interface CompanyUXResearchRepositoryInterface {
  findByCompanyId(companyId: string): Promise<CompanyUXResearch[] | null>;

  createCompanyUXResearch(
    companyUXResearch: CompanyUXResearch,
  ): Promise<CompanyUXResearch>;

  findByCompanyIdAndUXResearchId(
    companyId: string,
    uxResearchId: string,
  ): Promise<CompanyUXResearch | null>;

  createMany(
    companyUXResearchs: CompanyUXResearch[],
  ): Promise<CompanyUXResearch[]>;

  deleteByUXResearchId(uxResearchId: string): Promise<boolean>;
}
