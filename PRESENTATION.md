SLIDE 1: CollectIQ - Compliance-First Recovery Engine
- Team Name: [Your Team Name]
- Hackathon: FedEx SMART Hackathon | Shaastra 2026 | IIT Madras
- GitHub Repository: [Your GitHub Link]
- Domain: Data Science / Enterprise Automation
- Tagline: Guardrails vs. Guidelines™

SPEAKER NOTES:
- Introducing CollectIQ, an enterprise-grade debt collection platform designed specifically for FedEx logistics.
- Unlike traditional solutions, we treat compliance as an engineering problem, enforcing SOPs through code, not just policy.
- The solution is fully containerized, production-ready, and powered by explainable AI models.

SLIDE 2: Business Context & Problem Framing
- Current State: Disjointed tracking via Excel sheets and email threads
- Scalability Risk: Manual follow-ups fail as case volumes spike
- Compliance Gap: Lack of real-time governance creates FDCPA/TCPA liability
- Visibility: No centralized view of DCA performance or recovery rates
- Financial Impact: Delayed intervention leads to increased bad debt write-offs

SPEAKER NOTES:
- FedEx manages massive transaction volumes; manual recovery processes simply cannot scale.
- The biggest risk isn't just lost revenue—it's the compliance liability from unmonitored 3rd party agencies.
- We address the lack of "Control Tower" visibility that prevents proactive decision-making.

SLIDE 3: Solution Overview (What We Built)
- Platform: Centralized, auditable DCA management system
- Core Module: AI-driven Case Management & Prioritization
- Core Module: DCA Collaboration Portal with Role-Based Access
- Governance: Code-Enforced SOP Automation (Finite State Machine)
- Users: Enterprise Admins (FedEx), DCA Agents, Finance, Auditors

SPEAKER NOTES:
- We built a unified platform that connects FedEx operations with external agencies.
- It digitizes the entire lifecycle: from case ingestion to final settlement.
- Key differentiator is our "Guardrails" engine that makes non-compliant actions technically impossible.

SLIDE 4: System Architecture
- Backend Components: Node.js + Express (REST API) with JWT Security
- Frontend Components: React 18 + TypeScript + Vite (SPA)
- AI/ML Services: Python 3.10 + Flask + Scikit-Learn
- Data Storage: PostgreSQL (Relational) + Redis (Caching)
- Infrastructure: Docker Containerized (5-service orchestration)

SPEAKER NOTES:
- Architecture follows a modern microservices approach to ensure scalability.
- The Frontend is a responsive SPA, decoupled from the Node.js backend.
- Crucially, we use a dedicated Python service for ML to leverage actual data science libraries, not just basic logic.

SLIDE 5: End-to-End Process Flow
- Ingestion: Case data import and validation
- Intelligence: AI Risk Scoring & Payment Probability Prediction
- Assignment: Smart Allocation to DCAs based on BPI (Performance)
- Action: DCA executes workflow (Contact -> Follow-up -> Close)
- Governance: Real-time SLA monitoring and Audit Logging

SPEAKER NOTES:
- The flow starts with intelligent ingestion, where every case is immediately scored for risk.
- Smart Allocation automatically routes high-value cases to the best-performing agencies.
- The entire lifecycle is tracked, ensuring no case falls through the cracks.

SLIDE 6: AI / ML Intelligence
- Models Used: Random Forest Classifier (Scikit-Learn)
- Input Features: Overdue Days, Amount, Payment History, Contact Frequency
- Output: Payment Probability %, Risk Score (0-100), Priority Level
- Explainability: Factor-level impact analysis (Why this score?)
- Fallback: Robust rule-based logic if model service is unavailable

SPEAKER NOTES:
- We use a real Random Forest model, not a mock-up.
- It provides a granular "Payment Probability" score to prioritize work.
- Critically, it includes "Explainable AI"—telling the agent *why* a case is high priority (e.g., "Frequent contact but no payment").

SLIDE 7: Automation & Workflow Engine
- Logic: Finite State Machine enforces valid transitions
- Guardrails: Prevents skipping mandatory steps (e.g., must "Contact" before "Close")
- SLA Tracking: Auto-monitors 48h contact windows
- Escalations: Auto-trigger on SLA breach or High-Risk signals
- Compliance: Pre-action checks for FDCPA limits (frequency/timing)

SPEAKER NOTES:
- This is our strongest governance feature.
- We don't just ask agents to follow rules; the code enforces the workflow.
- You literally cannot close a case without logging a contact attempt first.

SLIDE 8: DCA Portal & Collaboration
- What DCAs See: Secure, individual logins for agents
- Actions: Log calls, emails, and notes in real-time
- AI Assistant: "Next Best Action" recommendations displayed on case view
- Bulk Tools: CSV upload/export for high-volume updates
- Transparency: Agents see their own performance metrics

SPEAKER NOTES:
- DCAs get a dedicated, secure portal—no more emailing spreadsheets.
- They see exactly what they need to work on, prioritized by our AI.
- All their actions are immediately visible to FedEx admins.

SLIDE 9: Dashboards & Analytics
- Metrics Available: Real-time recovery rates and open case counts
- Performance: BPI Leaderboard ranks DCAs by Recovery, Compliance, SLA
- Visuals: Trend Analysis (7-day moving average) and Workload Distribution
- Reporting: Exportable CSV/PDF summaries for offline review
- Aging: Visual breakdown of portfolio by days overdue

SPEAKER NOTES:
- The dashboard replaces the "Monday Morning Report".
- Managers can see in real-time which agencies are performing and which are lagging.
- The "Balanced Performance Index" (BPI) ensures we reward compliance, not just collections.

SLIDE 10: KPIs & Measurable Impact
- Recovery Rate: Targeted prioritization increases yield on fresh debt
- Ageing Reduction: Automated follow-ups prevent cases from going stale
- SLA Compliance: Real-time alerts reduce breach incidents
- Operational Cost: Eliminates manual data aggregation time
- Audit Readiness: 100% of actions logged for immediate compliance retrieval

SPEAKER NOTES:
- By prioritizing the right cases, we expect a significant reduction in average days sales outstanding (DSO).
- Operational efficiency improves as admins stop chasing status updates and start managing exceptions.

SLIDE 11: Security, Compliance & Scalability
- Authentication: Stateless JWT implementation with secure headers
- Access Control: Strict RBAC (Enterprise Admin vs. DCA User)
- Audit Trail: Immutable logs of every Create, Read, Update, Delete action
- Data Isolation: Agencies only see their assigned cases
- Scalability: Docker Compose ready; stateless backend allows horizontal scaling

SPEAKER NOTES:
- Security is built-in, not bolted on.
- We use industry-standard JWT for auth and strict role separation.
- The immutable audit trail is the "black box" recorder for all system activity.

SLIDE 12: Demo Walkthrough (Offline Explanation)
- Step 1: Admin logs in, views "Control Tower" dashboard
- Step 2: Uploads new case batch; watches AI assign Priority scores
- Step 3: "Smart Assigns" cases to top-ranked DCA
- Step 4: Switches to DCA view; agent sees prioritized worklist
- Step 5: Agent attempts to "Close" without contact -> Blocked by System (SOP Check)
- Step 6: Agent logs contact, then Closes. Admin sees Audit Log update.

SPEAKER NOTES:
- I will demonstrate the "Happy Path" of a case, but also the "Guardrails".
- You will see the system actively block a non-compliant action.
- We will conclude by showing the "Why?" explanation behind an AI risk score.

SLIDE 13: Innovation & Differentiation
- "Guardrails vs. Guidelines": Technical enforcement vs. policy manuals
- Transparent AI: Decision explainability builds user trust
- Balanced Performance Index: Fair, multi-factor agency evaluation
- Production Grade: Fully typed TypeScript & Modular Architecture
- Real-Time Governance: Immediate visibility vs. retrospective reporting

SPEAKER NOTES:
- Our core innovation is shifting compliance from a "training issue" to a "software guarantee".
- We combine this control with transparent AI that empowers, rather than replaces, the human agent.

SLIDE 14: Future Enhancements (Planned)
- GenAI Integration: Auto-summarization of case notes & call logs (Planned)
- Predictive Escalations: Early warning system for disputes (Planned)
- ERP Connectors: Direct API integration with SAP/Oracle Finance (Planned)
- Omni-Channel: Integrated WhatsApp/Chatbot communication (Planned)
- Sentiment Analysis: NLP on communication logs (Planned)

SPEAKER NOTES:
- While the current system is feature-complete for core ops, we see huge potential in GenAI.
- Future versions will auto-summarize case history to save agents even more time.

SLIDE 15: Final Value Proposition
- Value: Maximized recovery + Minimized compliance risk
- Readiness: 100% Feature Complete, Dockerized, Documented
- Vision: Transforming Debt Collection from "Chase" to "Strategy"
- Request: Pilot opportunity to validate recovery uplift
- Thank You

SPEAKER NOTES:
- CollectIQ offers FedEx a way to scale recovery operations without scaling risk.
- The code is ready, the models are trained, and the governance is built-in.
- Thank you for your time.
