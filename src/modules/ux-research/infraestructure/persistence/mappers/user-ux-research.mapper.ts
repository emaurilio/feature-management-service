import { UserUXResearch } from '../../../domain/entites/UserUXResearch';
import { UserUXResearchEntity } from '../entities/user-ux-resarch.entity';

export class UserUXResearchMapper {
  static toDomain(entity: UserUXResearchEntity): UserUXResearch {
    return new UserUXResearch(
      entity.uxResearchId,
      entity.userId,
      entity.id,
    );
  }

  static toPersistence(
    domain: UserUXResearch,
  ): Partial<UserUXResearchEntity> {
    return {
      id: domain.id,
      uxResearchId: domain.uxResearchId,
      userId: domain.userId,
    };
  }
}
