/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeatureFlagsTable1775178524735 implements MigrationInterface {
    name = 'CreateFeatureFlagsTable1775178524735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`feature_flags\` (\`id\` varchar(36) NOT NULL, \`nameVersion\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`enable\` tinyint NOT NULL DEFAULT 1, \`percentage\` int NOT NULL DEFAULT '0', \`version\` int NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`type\` varchar(255) NOT NULL DEFAULT 'percentage', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, INDEX \`IDX_d5a8bb2df6ade7ced134d95796\` (\`name\`), INDEX \`IDX_bfd7aaa3936170819a3c6c169b\` (\`isActive\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_bfd7aaa3936170819a3c6c169b\` ON \`feature_flags\``);
        await queryRunner.query(`DROP INDEX \`IDX_d5a8bb2df6ade7ced134d95796\` ON \`feature_flags\``);
        await queryRunner.query(`DROP TABLE \`feature_flags\``);
    }

}
