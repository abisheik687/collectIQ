import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

// Use SQLite in-memory for maximum reliability during demo
export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false, // Reduce noise
});

export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};
