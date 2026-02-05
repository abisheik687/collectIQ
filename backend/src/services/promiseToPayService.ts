import { PromiseToPay, Case, User } from '../models';

export class PromiseToPayService {
    /**
     * Create a promise to pay
     */
    async createPromise(promiseData: {
        caseId: number;
        promisedAmount: number;
        promisedDate: Date;
        createdBy: number;
        customerRemarks?: string;
    }) {
        const caseRecord = await Case.findByPk(promiseData.caseId);
        if (!caseRecord) {
            throw new Error('Case not found');
        }

        const promise = await PromiseToPay.create({
            ...promiseData,
            status: 'pending',
        });

        // Update case status
        await caseRecord.update({
            status: 'promise_to_pay',
        });

        return promise;
    }

    /**
     * Get promises with filters
     */
    async getPromises(filters?: {
        caseId?: number;
        status?: string;
    }) {
        const where: any = {};

        if (filters?.caseId) where.caseId = filters.caseId;
        if (filters?.status) where.status = filters.status;

        return await PromiseToPay.findAll({
            where,
            include: [
                { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'accountNumber', 'customerName'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            ],
            order: [['promisedDate', 'ASC']],
        });
    }

    /**
     * Get promise by ID
     */
    async getPromiseById(id: number) {
        return await PromiseToPay.findByPk(id, {
            include: [
                { model: Case, as: 'case' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            ],
        });
    }

    /**
     * Update promise status
     */
    async updatePromise(id: number, status: 'pending' | 'fulfilled' | 'broken' | 'partial') {
        const promise = await PromiseToPay.findByPk(id);
        if (!promise) {
            throw new Error('Promise not found');
        }

        await promise.update({ status });
        return promise;
    }

    /**
     * Get broken promises
     */
    async getBrokenPromises() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await PromiseToPay.findAll({
            where: {
                status: 'pending',
                promisedDate: { $lt: today },
            },
            include: [
                { model: Case, as: 'case' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            ],
        });
    }
}

export default new PromiseToPayService();
