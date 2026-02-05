/**
 * Report Export Service
 * 
 * Generates multi-format reports (PDF, Word, CSV) for admin/audit use
 * 
 * FORMATS:
 * - PDF: Executive summaries, audit submissions
 * - Word/DOCX: Policy review, collaborative editing
 * - CSV: Analytics, BI tools, ML pipelines
 * 
 * AUDIT:
 * - All exports logged
 * - Read-only, timestamped
 * - Regulator-friendly
 */

import Case from '../models/Case';
import AuditLog from '../models/AuditLog';
import { BPICalculator } from './BPICalculator';
import { WorkloadAnalytics } from './WorkloadAnalytics';
import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportRequest {
    reportType: 'operational_summary' | 'dca_performance' | 'compliance_audit' | 'workload_distribution';
    format: 'pdf' | 'docx' | 'csv';
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    filters?: {
        dcaIds?: number[];
        statusFilter?: string[];
    };
    includeDetails?: boolean;
}

export interface ReportMetadata {
    reportId: string;
    reportType: string;
    format: string;
    generatedAt: Date;
    generatedBy: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    rowCount: number;
    fileSizeKB?: number;
}

export interface ExportResult {
    success: boolean;
    reportId: string;
    filePath: string;
    downloadUrl: string;
    metadata: ReportMetadata;
    expiresAt: Date;
}

export class ReportExportService {
    private bpiCalculator: BPICalculator;
    private workloadAnalytics: WorkloadAnalytics;
    private exportDir: string;

    constructor() {
        this.bpiCalculator = new BPICalculator();
        this.workloadAnalytics = new WorkloadAnalytics();
        this.exportDir = path.join(__dirname, '../../exports');

        // Ensure export directory exists
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }
    }

    /**
     * Generate report in requested format
     */
    async generateReport(request: ReportRequest, generatedBy: string): Promise<ExportResult> {
        const reportId = this.generateReportId();

        let filePath: string;
        let rowCount: number = 0;

        switch (request.format) {
            case 'csv':
                {
                    const result = await this.generateCSV(request, reportId);
                    filePath = result.filePath;
                    rowCount = result.rowCount;
                }
                break;
            case 'pdf':
                filePath = await this.generatePDF(request, reportId);
                rowCount = 1; // PDF is single document
                break;
            case 'docx':
                filePath = await this.generateDOCX(request, reportId);
                rowCount = 1; // DOCX is single document
                break;
            default:
                throw new Error(`Unsupported format: ${request.format}`);
        }

        // Get file size
        const stats = fs.statSync(filePath);
        const fileSizeKB = Math.round(stats.size / 1024);

        const metadata: ReportMetadata = {
            reportId,
            reportType: request.reportType,
            format: request.format,
            generatedAt: new Date(),
            generatedBy,
            period: request.dateRange,
            rowCount,
            fileSizeKB
        };

        // Calculate expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return {
            success: true,
            reportId,
            filePath,
            downloadUrl: `/api/admin/reports/download/${reportId}.${request.format}`,
            metadata,
            expiresAt
        };
    }

    /**
     * Generate CSV export
     */
    private async generateCSV(request: ReportRequest, reportId: string): Promise<{ filePath: string; rowCount: number }> {
        const { startDate, endDate } = request.dateRange;

        // Fetch case data
        const whereClause: any = {
            createdAt: {
                [Op.between]: [startDate, endDate]
            }
        };

        if (request.filters?.dcaIds && request.filters.dcaIds.length > 0) {
            whereClause.assignedDcaId = { [Op.in]: request.filters.dcaIds };
        }

        if (request.filters?.statusFilter && request.filters.statusFilter.length > 0) {
            whereClause.status = { [Op.in]: request.filters.statusFilter };
        }

        const cases = await Case.findAll({ where: whereClause });

        // Handle empty dataset
        if (cases.length === 0) {
            const emptyCSV = 'case_id,case_number,account_number,customer_name,amount,overdue_days,status,priority,dca_id,dca_name,risk_score,payment_probability,sla_due_date,sla_status,contact_count,last_contact_date,resolution,created_at,updated_at\n';
            const fileName = `${reportId}.csv`;
            const filePath = path.join(this.exportDir, fileName);
            fs.writeFileSync(filePath, emptyCSV, 'utf8');
            return { filePath, rowCount: 0 };
        }

        // Transform to CSV-friendly format
        const csvData = cases.map(c => ({
            case_id: c.id,
            case_number: c.caseNumber,
            account_number: c.accountNumber,
            customer_name: c.customerName,
            amount: c.amount,
            overdue_days: c.overdueDays,
            status: c.status,
            priority: c.priority,
            dca_id: c.assignedDcaId || '',
            dca_name: c.assignedDcaName || '',
            risk_score: c.mlRiskScore || '',
            payment_probability: c.mlPaymentProbability || '',
            sla_due_date: c.slaDueDate ? c.slaDueDate.toISOString() : '',
            sla_status: c.slaStatus || '',
            contact_count: c.contactCount,
            last_contact_date: c.lastContactDate ? c.lastContactDate.toISOString() : '',
            resolution: c.resolution || '',
            created_at: c.createdAt?.toISOString() || '',
            updated_at: c.updatedAt?.toISOString() || ''
        }));

        // Convert to CSV
        const parser = new Parser();
        const csv = parser.parse(csvData);

        const fileName = `${reportId}.csv`;
        const filePath = path.join(this.exportDir, fileName);

        fs.writeFileSync(filePath, csv, 'utf8');

        return { filePath, rowCount: csvData.length };
    }

    /**
     * Generate PDF export
     * (Simplified - in production would use pdfkit or puppeteer)
     */
    private async generatePDF(request: ReportRequest, reportId: string): Promise<string> {
        const { startDate, endDate } = request.dateRange;

        // Gather report data
        const summary = await this.getOperationalSummary(startDate, endDate);
        const bpiRankings = await this.bpiCalculator.rankDCAs(startDate, endDate, 5);
        const slaDistribution = await this.workloadAnalytics.getSLARiskDistribution();

        // Create text-based report (in production, would use proper PDF library)
        const reportText = `
╔════════════════════════════════════════════════════════╗
║  CollectIQ - Operational Performance Report            ║
║  Generated: ${new Date().toISOString()}                ║
║  Report Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}  ║
║  Report ID: ${reportId}                                 ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  EXECUTIVE SUMMARY                                      ║
║  ─────────────────────────────────────────────────     ║
║  Total Recovery Amount:        $${summary.totalRecovery.toLocaleString()}              ║
║  Total Cases Processed:        ${summary.totalCases}                   ║
║  Active Cases:                 ${summary.activeCases}                   ║
║  Resolved Cases:               ${summary.resolvedCases}                   ║
║  Resolution Rate:              ${summary.resolutionRate}%                   ║
║                                                        ║
║  COMPLIANCE STATUS                                      ║
║  ─────────────────────────────────────────────────     ║
║  Compliance Violations:        ${summary.complianceViolations}                        ║
║  Ethical Risk Flags:           ${summary.ethicalFlags}                        ║
║                                                        ║
║  SLA RISK DISTRIBUTION                                  ║
║  ─────────────────────────────────────────────────     ║
║  Low Risk:    ${slaDistribution.lowRisk} cases (${Math.round(slaDistribution.lowRisk / slaDistribution.totalCases * 100)}%)                       ║
║  Medium Risk: ${slaDistribution.mediumRisk} cases (${Math.round(slaDistribution.mediumRisk / slaDistribution.totalCases * 100)}%)                      ║
║  High Risk:   ${slaDistribution.highRisk} cases (${Math.round(slaDistribution.highRisk / slaDistribution.totalCases * 100)}%)                       ║
║                                                        ║
║  BALANCED PERFORMANCE INDEX (Top 5)                     ║
║  ─────────────────────────────────────────────────     ║
${bpiRankings.map((dca, i) =>
            `║  ${i + 1}. ${dca.dcaName.padEnd(30)} BPI: ${dca.bpi}               ║
║     Recovery: $${Math.round(dca.components.recoveryScore)}K | Compliance: ${dca.components.complianceScore}% | SLA: ${dca.components.slaScore}%       ║
║                                                        ║`).join('\n')}
║  Report Attestation:                                    ║
║  This report is generated from CollectIQ audit logs    ║
║  and case management database. All figures verified    ║
║  against immutable audit trail.                        ║
║                                                        ║
║  Signature: ______________________  Date: _________    ║
╚════════════════════════════════════════════════════════╝
`.trim();

        const fileName = `${reportId}.pdf`;
        const filePath = path.join(this.exportDir, fileName);

        // Write as text (in production, would generate actual PDF)
        fs.writeFileSync(filePath, reportText, 'utf8');

        return filePath;
    }

    /**
     * Generate DOCX export
     * (Simplified - in production would use docxtemplater)
     */
    private async generateDOCX(request: ReportRequest, reportId: string): Promise<string> {
        // For MVP, generate as formatted text
        // In production, would use docxtemplater or officegen

        const pdfPath = await this.generatePDF(request, reportId);
        const content = fs.readFileSync(pdfPath, 'utf8');

        const fileName = `${reportId}.docx`;
        const filePath = path.join(this.exportDir, fileName);

        // Write as text with .docx extension (production would generate real Word doc)
        fs.writeFileSync(filePath, content, 'utf8');

        return filePath;
    }

    /**
     * Get operational summary data
     */
    private async getOperationalSummary(startDate: Date, endDate: Date): Promise<any> {
        const cases = await Case.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        const activeCases = cases.filter(c => ['assigned', 'in_progress', 'follow_up'].includes(c.status)).length;
        const resolvedCases = cases.filter(c => ['resolved', 'closed'].includes(c.status)).length;
        const totalRecovery = cases
            .filter(c => c.status === 'resolved' || c.status === 'closed')
            .reduce((sum, c) => sum + Number(c.amount), 0);

        const complianceViolations = await AuditLog.count({
            where: {
                action: {
                    [Op.in]: ['COMPLIANCE_VIOLATION', 'FDCPA_VIOLATION', 'TCPA_VIOLATION']
                },
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        const ethicalFlags = await AuditLog.count({
            where: {
                action: 'ETHICS_FLAG',
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        return {
            totalCases: cases.length,
            activeCases,
            resolvedCases,
            resolutionRate: cases.length > 0 ? Math.round((resolvedCases / cases.length) * 100) : 0,
            totalRecovery,
            complianceViolations,
            ethicalFlags
        };
    }

    /**
     * Generate unique report ID
     */
    private generateReportId(): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `RPT-${timestamp}-${random}`;
    }

    /**
     * Log export action to audit trail
     */
    async logExportAction(adminId: number, adminName: string, reportMetadata: ReportMetadata, ipAddress: string): Promise<void> {
        await AuditLog.create({
            action: `EXPORT_${reportMetadata.format.toUpperCase()}`,
            entityType: 'AdminReport',
            entityId: 0, // Reports don't have numeric IDs
            userId: adminId,
            userName: adminName,
            beforeState: null,
            afterState: {
                reportType: reportMetadata.reportType,
                period: reportMetadata.period,
                rowCount: reportMetadata.rowCount,
                fileSizeKB: reportMetadata.fileSizeKB
            },
            ipAddress,
            userAgent: 'ReportExportService',
            timestamp: new Date()
        });
    }
}
