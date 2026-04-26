import { UserUXResearch } from "../../entites/UserUXResearch";

export interface UserUXResearchRepositoryInterface {
  findByUserId(userId: string): Promise<UserUXResearch[] | null>;

  findByUserIdAndUXResearchId(
    userId: string,
    uxResearchId: string,
  ): Promise<UserUXResearch | null>;

  createMany(userUXResearches: UserUXResearch[]): Promise<UserUXResearch[]>;

  deleteByUXResearchId(uxResearchId: string): Promise<boolean>;
}
