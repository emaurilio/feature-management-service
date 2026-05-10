export class UXResearchResponse {
    constructor(
        public readonly response: any,
        public readonly responseDate: Date,
        public readonly uxResearchId: string,
        public readonly userId?: string,
        public readonly companyId?: string,
        public readonly id?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
        public readonly deletedAt?: Date,
    ) {
        this.response = response;
        this.responseDate = responseDate;
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.uxResearchId = uxResearchId;
        this.userId = userId;
        this.companyId = companyId;
    }
}