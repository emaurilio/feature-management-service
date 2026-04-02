/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775173501980 implements MigrationInterface {
    name = 'Migrations1775173501980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`feature_flags_users\` (\`id\` varchar(36) NOT NULL, \`featureId\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_ca745929e9dfc6895563fced98\` (\`featureId\`, \`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feature_flags_companies\` (\`id\` varchar(36) NOT NULL, \`featureId\` varchar(255) NOT NULL, \`companyId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_0426954b3b87f38516dc3ab16a\` (\`featureId\`, \`companyId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_0426954b3b87f38516dc3ab16a\` ON \`feature_flags_companies\``);
        await queryRunner.query(`DROP TABLE \`feature_flags_companies\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca745929e9dfc6895563fced98\` ON \`feature_flags_users\``);
        await queryRunner.query(`DROP TABLE \`feature_flags_users\``);
    }

}
