import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeatureFlagRelations1777183886760 implements MigrationInterface {
    name = 'AddFeatureFlagRelations1777183886760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ux_research\` (\`id\` varchar(36) NOT NULL, \`nameVersion\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`featureFlagName\` varchar(255) NULL, \`enable\` tinyint NOT NULL DEFAULT 1, \`percentage\` int NOT NULL DEFAULT '0', \`version\` int NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`type\` varchar(255) NOT NULL DEFAULT 'percentage', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, INDEX \`IDX_edaa673d8ce58213f1c33c5651\` (\`name\`), INDEX \`IDX_bf217109119d3f8c53cdb62f3c\` (\`isActive\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`companies_ux_research\` (\`id\` varchar(36) NOT NULL, \`uxResearchId\` varchar(255) NOT NULL, \`companyId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_91f9e3198d33bf5c427891e14e\` (\`companyId\`, \`uxResearchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users_ux_research\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`uxResearchId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_173fb64d74898cd92868b908a3\` (\`userId\`, \`uxResearchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feature_flags_users\` (\`id\` varchar(36) NOT NULL, \`featureId\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_ca745929e9dfc6895563fced98\` (\`featureId\`, \`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feature_flags_companies\` (\`id\` varchar(36) NOT NULL, \`featureId\` varchar(255) NOT NULL, \`companyId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_0426954b3b87f38516dc3ab16a\` (\`featureId\`, \`companyId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`DROP INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` DROP COLUMN \`featureId\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` ADD \`featureId\` varchar(255) NOT NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` DROP COLUMN \`featureId\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` ADD \`featureId\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\` (\`featureId\`, \`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\` (\`featureId\`, \`companyId\`)`);
        await queryRunner.query(`ALTER TABLE \`ux_research\` ADD CONSTRAINT \`FK_cec53231249323df0566bdfc44e\` FOREIGN KEY (\`featureFlagName\`) REFERENCES \`feature_flags\`(\`name\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`companies_ux_research\` ADD CONSTRAINT \`FK_3ebff3b657afad54b8b1490f25b\` FOREIGN KEY (\`uxResearchId\`) REFERENCES \`ux_research\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users_ux_research\` ADD CONSTRAINT \`FK_7f3ddcff7a1e5348969807ebacc\` FOREIGN KEY (\`uxResearchId\`) REFERENCES \`ux_research\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` ADD CONSTRAINT \`FK_8eba987eaabd401acf67df5b2c5\` FOREIGN KEY (\`featureId\`) REFERENCES \`feature_flags\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` ADD CONSTRAINT \`FK_375ee149afc77e98b153e822953\` FOREIGN KEY (\`featureId\`) REFERENCES \`feature_flags\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` DROP FOREIGN KEY \`FK_375ee149afc77e98b153e822953\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` DROP FOREIGN KEY \`FK_8eba987eaabd401acf67df5b2c5\``);
        await queryRunner.query(`ALTER TABLE \`users_ux_research\` DROP FOREIGN KEY \`FK_7f3ddcff7a1e5348969807ebacc\``);
        await queryRunner.query(`ALTER TABLE \`companies_ux_research\` DROP FOREIGN KEY \`FK_3ebff3b657afad54b8b1490f25b\``);
        await queryRunner.query(`ALTER TABLE \`ux_research\` DROP FOREIGN KEY \`FK_cec53231249323df0566bdfc44e\``);
        await queryRunner.query(`DROP INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` DROP COLUMN \`featureId\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_companies\` ADD \`featureId\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\` (\`featureId\`, \`companyId\`)`);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` DROP COLUMN \`featureId\``);
        await queryRunner.query(`ALTER TABLE \`feature_flags_users\` ADD \`featureId\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\` (\`featureId\`, \`userId\`)`);
        await queryRunner.query(`DROP INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\``);
        await queryRunner.query(`DROP TABLE \`feature_flags_companies\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\``);
        await queryRunner.query(`DROP TABLE \`feature_flags_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_173fb64d74898cd92868b908a3\` ON \`users_ux_research\``);
        await queryRunner.query(`DROP TABLE \`users_ux_research\``);
        await queryRunner.query(`DROP INDEX \`IDX_91f9e3198d33bf5c427891e14e\` ON \`companies_ux_research\``);
        await queryRunner.query(`DROP TABLE \`companies_ux_research\``);
        await queryRunner.query(`DROP INDEX \`IDX_bf217109119d3f8c53cdb62f3c\` ON \`ux_research\``);
        await queryRunner.query(`DROP INDEX \`IDX_edaa673d8ce58213f1c33c5651\` ON \`ux_research\``);
        await queryRunner.query(`DROP TABLE \`ux_research\``);
    }

}
