import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUxResearchResponsesTable1779048960807 implements MigrationInterface {
    name = 'AddUxResearchResponsesTable1779048960807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ux_research\` DROP FOREIGN KEY \`FK_cec53231249323df0566bdfc44e\``);
        await queryRunner.query(`CREATE TABLE \`ux_researches_responses\` (\`id\` varchar(36) NOT NULL, \`uxResearchId\` varchar(255) NOT NULL, \`userId\` varchar(255) NULL, \`companyId\` varchar(255) NULL, \`response\` json NOT NULL, \`responseDate\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, INDEX \`IDX_21ec9d6d44a5c0c886df8561ad\` (\`uxResearchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ux_research\` ADD \`startDate\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`ux_research\` ADD \`endDate\` date NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ux_research\` DROP COLUMN \`endDate\``);
        await queryRunner.query(`ALTER TABLE \`ux_research\` DROP COLUMN \`startDate\``);
        await queryRunner.query(`DROP INDEX \`IDX_21ec9d6d44a5c0c886df8561ad\` ON \`ux_researches_responses\``);
        await queryRunner.query(`DROP TABLE \`ux_researches_responses\``);
        await queryRunner.query(`ALTER TABLE \`ux_research\` ADD CONSTRAINT \`FK_cec53231249323df0566bdfc44e\` FOREIGN KEY (\`featureFlagName\`) REFERENCES \`feature_flags\`(\`name\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
