import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

// Environment-based database configuration
// Production: PostgreSQL (via DATABASE_URL from Render)
// Development: SQLite in-memory for quick local testing
const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DB_DIALECT === 'postgres' || isProduction;

export const sequelize = usePostgres
    ? new Sequelize(process.env.DATABASE_URL!, {
        dialect: 'postgres',
        dialectOptions: {
            ssl:
                process.env.DB_SSL === 'true'
                    ? {
                        require: true,
                        rejectUnauthorized: false,
                    }
                    : false,
        },
        logging: false,
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
    });

export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ Database connection established successfully (${sequelize.getDialect()}).`);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};
