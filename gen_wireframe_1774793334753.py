# IntelliFrame DESIGN ENGINE (v3.1 - Bug Fix Edition)
# Multi-page wireframes (Hero + Catalog + Detail pages) for Systech Analytics Application Portfolio
# Output: portfolio_wireframes.pdf

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch

# ──────────────────────────────────────────────────────────────────────────────
# 🛠️ RENDERER UTILITIES (MANDATORY IMPLEMENTATION)
# ──────────────────────────────────────────────────────────────────────────────
def rr(c, x, y, w, h, r=7, fill=None, stroke=None, sw=0.5):
    from reportlab.lib import colors
    c.saveState()
    if fill:
        f_col = colors.HexColor(fill) if isinstance(fill, str) else fill
        c.setFillColor(f_col)
    if stroke:
        s_col = colors.HexColor(stroke) if isinstance(stroke, str) else stroke
        c.setStrokeColor(s_col)
        c.setLineWidth(sw)
    c.roundRect(x, y, w, h, r, fill=1 if fill else 0, stroke=1 if stroke else 0)
    c.restoreState()

def para(c, text, x, y, w, max_h=800, font="Helvetica", size=9, color="#F0F6FF", leading=12, align=0):
    from reportlab.platypus import Paragraph
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    style = ParagraphStyle(
        "p",
        fontName=font,
        fontSize=size,
        textColor=colors.HexColor(color) if isinstance(color, str) else color,
        leading=leading,
        alignment=align
    )
    safe = str(text).encode('latin-1', 'replace').decode('latin-1')
    p = Paragraph(safe, style)
    pw, ph = p.wrapOn(c, w, max_h)
    p.drawOn(c, x, y - ph)
    return ph

def label_pill(c, x, y, text, bg, fg="#F0F6FF"):
    from reportlab.lib import colors
    tw = c.stringWidth(str(text), "Helvetica-Bold", 6.5)
    w = tw + 14
    h = 14
    bg_col = colors.HexColor(bg) if isinstance(bg, str) else bg
    rr(c, x, y, w, h, r=h/2, fill=bg_col)
    c.setFillColor(colors.HexColor(fg) if isinstance(fg, str) else fg)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(x + w/2, y + 4, str(text))
    return w

# ──────────────────────────────────────────────────────────────────────────────
# 📥 INPUT DATA (embedded from STRICT JSON)
# ──────────────────────────────────────────────────────────────────────────────
DATA = {
  "portfolio": {
    "title": "Systech Analytics Application Portfolio",
    "organisation": "Systech Analytics",
    "year": "2026",
    "confidential": True,
    "stats": {
      "totalApps": "15",
      "domains": "AI, Data Engineering, Automation, Analytics",
      "aiPowered": "7+ AI / LLM-Powered",
      "buildTenure": "Not specified"
    }
  },
  "applications": [
    {
      "id": "01",
      "name": "Maverick",
      "domain": "Casino",
      "category": "AI Generation",
      "tagline": "AI-Powered Promotional Coupon Engine for Casino Players",
      "overview": "Maverick is a personalised incentive generation platform built for the gaming and casino industry. It analyses player behaviour, spending history, game preferences, and visit frequency to craft hyper-personalised promotional offers — from free spins and dining credits to VIP room upgrades. Powered by AI, Maverick replaces static promotions with dynamic, data-driven campaigns that adapt in real time.",
      "features": [
        {"title": "Player Segmentation", "description": "Segments players based on lifetime value, churn risk, and play patterns."},
        {"title": "Automated Coupon Generation", "description": "Generates coupons with configurable reward rules and expiry logic."},
        {"title": "Real-Time Offer Delivery", "description": "Delivers offers via SMS, app notifications, and kiosk displays."},
        {"title": "Campaign Analytics & A/B Testing", "description": "Tracks performance and supports A/B testing to optimise campaigns."},
        {"title": "POS & Loyalty Integrations", "description": "Integrates with casino POS and loyalty management systems."}
      ],
      "impact": "Increases promotional ROI and player retention by delivering the right offer to the right player at the right moment, replacing guesswork with precision targeting.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#A855F7",
      "icon": "🎰"
    },
    {
      "id": "02",
      "name": "TRBank",
      "domain": "Banking",
      "category": "Data Processing",
      "tagline": "Unstructured-to-Structured Data Transformation for Banking",
      "overview": "TRBank is an intelligent document processing platform designed for financial institutions. It ingests unstructured banking documents — account statements, loan applications, KYC forms, remittance slips, and free-text correspondence — and transforms them into clean, validated, structured datasets ready for downstream analytics, compliance reporting, and core banking system ingestion.",
      "features": [
        {"title": "Multi-Format Document Ingestion", "description": "Ingests PDFs, scanned images, and handwritten forms."},
        {"title": "Entity Extraction", "description": "Extracts key entities including account numbers, dates, transaction amounts, and counterparties."},
        {"title": "Validation Rules Engine", "description": "Flags anomalies, duplicates, and missing fields via configurable validation rules."},
        {"title": "Structured Outputs", "description": "Outputs structured data in JSON, CSV, and direct database write formats."},
        {"title": "Audit Trail & Confidence Scoring", "description": "Provides an audit trail and confidence scoring for every extracted data field."}
      ],
      "impact": "Eliminates manual data entry for banking operations teams, reducing document processing time from hours to minutes per batch while improving accuracy and compliance readiness.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#2563EB",
      "icon": "🏦"
    },
    {
      "id": "03",
      "name": "Sustainability",
      "domain": "ESG",
      "category": "Emission Analytics",
      "tagline": "Full-Cycle ESG Intelligence and Emission Calculation Platform",
      "overview": "The Sustainability platform is an end-to-end ESG intelligence tool for organisations managing their environmental footprint. It ingests utility bills, fuel logs, travel records, and supply chain data to calculate carbon emissions across Scope 1, 2, and 3 categories. The platform generates audit-ready ESG reports aligned with GHG Protocol and GRI standards, and provides predictive analytics to model emission reduction scenarios for net-zero planning.",
      "features": [
        {"title": "Utility Bill Parsing", "description": "Automatically parses utility bills with intelligent emission factor mapping."},
        {"title": "Scope 1–3 Carbon Accounting", "description": "Calculates Scope 1, 2, and 3 emissions aligned with the GHG Protocol."},
        {"title": "AI-Generated ESG Narratives", "description": "Produces narrative ESG reports ready for board and regulatory submission."},
        {"title": "Benchmarking & Target-Gap Dashboards", "description": "Provides peer benchmarking and target-gap analysis dashboards."},
        {"title": "Scenario Modelling", "description": "Supports net-zero and reduction roadmap scenario modelling."}
      ],
      "impact": "Reduces ESG reporting effort from weeks of manual spreadsheet work to automated, audit-ready output generated in minutes — enabling organisations to meet sustainability reporting obligations with confidence.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#16A34A",
      "icon": "🌿"
    },
    {
      "id": "04",
      "name": "Ecovision",
      "domain": "ESG",
      "category": "Vision AI",
      "tagline": "Video-Powered AI Auditing for Sustainability Compliance",
      "overview": "Ecovision brings computer vision into the sustainability space, transforming passive CCTV infrastructure into an active compliance monitoring system. It continuously analyses live and recorded facility video feeds to detect energy waste, improper waste disposal, safety non-compliance, and resource misuse. Each detected event is logged with an extracted video clip, timestamp, severity rating, and an AI-generated corrective action recommendation.",
      "features": [
        {"title": "Real-Time Facility Video Analysis", "description": "Analyses live and recorded feeds for sustainability and compliance events across facilities."},
        {"title": "Automated Incident Logging", "description": "Logs incidents with clip extraction and severity classification."},
        {"title": "Corrective Action Recommendations", "description": "Generates AI-driven corrective action recommendations per detected incident."},
        {"title": "Compliance Scoring Dashboard", "description": "Provides compliance scoring with historical trend analytics."},
        {"title": "ESG Platform Integration", "description": "Natively integrates with the Sustainability platform for unified ESG reporting."}
      ],
      "impact": "Transforms sustainability auditing from periodic manual walkthroughs into a continuous, automated, evidence-driven compliance function — providing an always-on audit trail for regulators and internal teams.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#16A34A",
      "icon": "📷"
    },
    {
      "id": "05",
      "name": "Hotel Concierge",
      "domain": "Hospitality",
      "category": "AI Agent",
      "tagline": "AI Avatar Booking Agent for Hotels and Guest Amenities",
      "overview": "Hotel Concierge is a conversational AI agent that handles end-to-end hotel booking and guest services through a lifelike AI avatar interface. Guests interact in natural language to search rooms, check availability, make bookings, and reserve amenities including dining, spa, and leisure activities. The agent maintains conversational context across multi-turn interactions and orchestrates reservations through backend hotel PMS integrations.",
      "features": [
        {"title": "Room Booking & Changes", "description": "Supports natural language booking, modification, and cancellation."},
        {"title": "Amenity Reservations", "description": "Reserves dining, spa, pool, gym, and activities."},
        {"title": "Conversational Memory", "description": "Maintains multi-turn context and tracks guest preferences."},
        {"title": "AI Avatar Interface", "description": "Provides a lifelike avatar for an immersive, personalised experience."},
        {"title": "PMS & Channel Manager Integration", "description": "Connects to PMS/channel managers for real-time availability and pricing."}
      ],
      "impact": "Reduces front-desk workload and call centre volumes while increasing ancillary revenue by enabling 24/7 self-service booking through an engaging, human-like AI interface.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#F59E0B",
      "icon": "🏨"
    },
    {
      "id": "06",
      "name": "VetAI",
      "domain": "HR Tech",
      "category": "AI Screening",
      "tagline": "End-to-End AI-Powered Candidate Screening and Interview Platform",
      "overview": "VetAI is a full-stack AI recruitment platform that automates the candidate screening process from job posting through to hiring decision. It conducts live AI-powered video interviews, evaluates responses across communication quality, technical accuracy, and behavioural competencies in real time, and delivers structured hiring reports to recruiters. Video proctoring and silence detection ensure interview integrity.",
      "features": [
        {"title": "AI-Conducted Video Interviews", "description": "Runs live interviews with dynamic, contextual follow-up questioning."},
        {"title": "Proctoring & Integrity Scoring", "description": "Detects anomalies and scores interview integrity via video proctoring."},
        {"title": "Multi-Dimensional Evaluation", "description": "Evaluates technical, behavioural, and communication performance."},
        {"title": "Structured Hiring Reports", "description": "Generates role-fit scores and candidate rankings automatically."},
        {"title": "Pipeline Management Dashboard", "description": "Provides candidate tracking and analytics across the full pipeline."}
      ],
      "impact": "Cuts time-to-screen by up to 70%, enabling recruiters to focus on final-stage evaluation while AI handles initial assessment at scale — consistently and without bias.",
      "metrics": [{"label": "Time-to-screen reduction","value": "Up to 70%"},{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"}],
      "accent": "#7C3AED",
      "icon": "🧑"
    },
    {
      "id": "07",
      "name": "Resonance",
      "domain": "L&D",
      "category": "Communication AI",
      "tagline": "AI Communication Coaching for Professional Upskilling",
      "overview": "Resonance is an AI-powered communication coaching platform designed to help professionals develop confident, effective communication skills. Using speech analysis and LLM-based evaluation, it assesses tone, clarity, pacing, filler word usage, and persuasive impact during practice sessions and real conversations. Personalised feedback loops and structured exercises help users build lasting habits, with progress tracked over time.",
      "features": [
        {"title": "Real-Time Speech Analysis", "description": "Analyses tone, pace, clarity, and filler word frequency."},
        {"title": "Actionable Feedback Reports", "description": "Generates specific, actionable improvement suggestions."},
        {"title": "Scenario-Based Practice", "description": "Supports presentations, negotiations, and interview practice."},
        {"title": "Progress Tracking", "description": "Tracks skill growth and visualises progress across sessions."},
        {"title": "Team Analytics", "description": "Provides cohort and team-level analytics for L&D managers."}
      ],
      "impact": "Helps organisations build a culture of clear, confident communication — reducing meeting inefficiencies and improving stakeholder engagement across teams at every level.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#0EA5E9",
      "icon": "🗣"
    },
    {
      "id": "08",
      "name": "Orbit",
      "domain": "Internal Tool",
      "category": "Project Management",
      "tagline": "Systech's Internal Project and Ticket Tracking System",
      "overview": "Orbit is Systech's purpose-built internal project management and ticket tracking platform. It centralises task creation, assignment, status tracking, and milestone management across all active projects and client engagements. Built to replace scattered spreadsheets and email threads, Orbit provides a real-time operational view of delivery health, resource allocation, and sprint progress across the organisation.",
      "features": [
        {"title": "Project & Sprint Planning", "description": "Creates projects and sprints with milestone, deadline, and priority tracking."},
        {"title": "Ticket Lifecycle Management", "description": "Manages tickets from backlog creation through completion sign-off."},
        {"title": "Workload Visibility", "description": "Assigns work and provides individual workload visibility across projects."},
        {"title": "Search & Filtering", "description": "Supports priority/status filtering and global search across projects."},
        {"title": "Collaboration Feeds", "description": "Includes per-ticket activity feeds and comment threads for async collaboration."}
      ],
      "impact": "Gives Systech leadership a single source of truth for all project delivery, replacing fragmented communication channels with a structured, searchable operational hub.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#64748B",
      "icon": "🗂"
    },
    {
      "id": "09",
      "name": "SysRank",
      "domain": "Internal Tool",
      "category": "Technical Assessment",
      "tagline": "Systech's Proprietary Technical Assessment and Benchmarking Platform",
      "overview": "SysRank is Systech's internal equivalent of HackerRank — a proprietary platform for evaluating technical talent through structured coding challenges, SQL assessments, data engineering problems, and timed problem sets. It supports candidate screening and internal benchmarking, with question banks managed by domain, difficulty level, and technology track.",
      "features": [
        {"title": "Timed Technical Challenges", "description": "Runs timed challenges across Python, SQL, and data engineering tracks."},
        {"title": "Auto-Grading & Scoring", "description": "Auto-grades test cases with partial scoring and detailed breakdowns."},
        {"title": "Proctored Assessment Portal", "description": "Provides a candidate-facing portal with proctoring and integrity controls."},
        {"title": "Question Bank Management", "description": "Organises questions by domain, difficulty, and technology."},
        {"title": "Results & Benchmarking", "description": "Delivers leaderboards, score history, and skill heatmaps."}
      ],
      "impact": "Standardises talent evaluation at Systech, ensuring consistent, objective assessment for both external hiring and internal capability development and benchmarking.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#64748B",
      "icon": "🧪"
    },
    {
      "id": "10",
      "name": "AeroIntel",
      "domain": "Aviation",
      "category": "RAG · Conversational AI",
      "tagline": "RAG-Powered AI Assistant for Airport CCR Technicians",
      "overview": "AeroIntel is a retrieval-augmented generation (RAG) AI assistant built specifically for airport Common Communication Room (CCR) technicians. It enables natural language queries over a hybrid knowledge base combining structured operational databases and unstructured technical documents, surfacing maintenance procedures, equipment manuals, fault histories, and operational protocols during live incidents.",
      "features": [
        {"title": "Hybrid RAG Architecture", "description": "Combines structured database search with document retrieval."},
        {"title": "Natural Language Interface", "description": "Supports context-aware, multi-turn conversational querying."},
        {"title": "Guided Procedure Retrieval", "description": "Returns step-by-step maintenance procedures with guided resolution support."},
        {"title": "Fault History Matching", "description": "Finds similar incidents and patterns via fault history lookup."},
        {"title": "Agentic Orchestration", "description": "Orchestrates multi-source synthesis for complex technician queries."}
      ],
      "impact": "Dramatically reduces time-to-resolution for technical faults by giving CCR engineers instant access to the right information during live airport incidents — when every minute counts.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#0284C7",
      "icon": "✈"
    },
    {
      "id": "11",
      "name": "SysMart",
      "domain": "Retail",
      "category": "AI Chatbot",
      "tagline": "Databricks-Powered AI Chatbot for Retail Operations",
      "overview": "SysMart is a conversational AI platform for retail operations, built on Databricks AI serving endpoints. It combines live SQL-based database querying with retrieval-augmented generation over product catalogues, return policies, and FAQ knowledge bases. Freshchat integration deploys the chatbot into the existing customer support channel with seamless escalation to human agents.",
      "features": [
        {"title": "Live Database Q&A", "description": "Answers natural language questions against live inventory and order management databases."},
        {"title": "RAG Over Knowledge Bases", "description": "Uses RAG over product catalogues, return policies, and operational FAQs."},
        {"title": "Freshchat Deployment", "description": "Integrates with Freshchat for customer-facing self-service."},
        {"title": "Human Handoff", "description": "Supports intelligent escalation and handoff to human agents for complex queries."},
        {"title": "Usage Analytics", "description": "Provides analytics and query categorisation for continuous improvement."}
      ],
      "impact": "Reduces support ticket volume and handles routine product, order, and policy queries automatically — freeing support agents to focus on higher-value, complex customer interactions.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#F97316",
      "icon": "🛒"
    },
    {
      "id": "12",
      "name": "Intelliframe",
      "domain": "Design",
      "category": "Generative AI",
      "tagline": "AI Wireframe Generator for Dashboards and Data Products",
      "overview": "Intelliframe accelerates the design-to-development pipeline by generating annotated dashboard and application wireframes from natural language briefs or data schemas. Users describe metrics, user journeys, and layout preferences; Intelliframe produces structured wireframe mockups with component annotations, layout logic, and data binding suggestions ready for developer handoff.",
      "features": [
        {"title": "Natural Language to Wireframes", "description": "Generates wireframes for dashboards, apps, and portals from text briefs."},
        {"title": "Schema-Aware Suggestions", "description": "Suggests layouts based on the underlying data model."},
        {"title": "Annotated Components", "description": "Adds UX rationale and interaction behaviour notes to components."},
        {"title": "Export Formats", "description": "Exports to image, PDF, and developer-ready specification documents."},
        {"title": "Iterative Refinement", "description": "Supports follow-up prompts to refine wireframes iteratively."}
      ],
      "impact": "Compresses weeks of wireframing and design iteration into hours, aligning product, design, and engineering teams around a shared visual brief much faster — reducing rework and misalignment.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#EC4899",
      "icon": "🧩"
    },
    {
      "id": "13",
      "name": "AiCCTV",
      "domain": "Security",
      "category": "Vision Analytics",
      "tagline": "AI-Powered Surveillance and Vision Analytics Platform",
      "overview": "AiCCTV is an intelligent video surveillance solution that transforms passive camera infrastructure into an active security intelligence layer. It processes live and recorded feeds to detect anomalies, unauthorised access, crowd density violations, safety hazards, and behavioural patterns of concern. Alerts are generated in real time with video clip evidence and incident metadata.",
      "features": [
        {"title": "Anomaly & Intrusion Detection", "description": "Detects anomalies and intrusions across multiple simultaneous camera feeds."},
        {"title": "Crowd & Zone Monitoring", "description": "Monitors crowd density and triggers zone-based restricted access alerts."},
        {"title": "Safety Hazard Detection", "description": "Detects falls, unattended objects, and fire indicators."},
        {"title": "Evidence-Backed Alerts", "description": "Dispatches alerts with video clip evidence and full incident metadata."},
        {"title": "Incident Analytics & Reporting", "description": "Provides historical incident analytics, heatmaps, and compliance reporting."}
      ],
      "impact": "Enables proactive security operations at scale across large facilities — reducing incident response time and providing evidence-backed records for compliance investigations and regulatory audits.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#DC2626",
      "icon": "🛡"
    },
    {
      "id": "14",
      "name": "DataOne",
      "domain": "Data Engineering",
      "category": "AI Tooling",
      "tagline": "Unified AI Data Engineering Toolkit Across Fabric, Snowflake and Databricks",
      "overview": "DataOne is Systech's unified AI data engineering platform that bridges Microsoft Fabric, Snowflake, and Databricks under a single intelligent interface. Through purpose-built MCP (Model Context Protocol) servers, it exposes platform capabilities to AI agents and workflows — enabling natural language pipeline creation, schema exploration, query execution, and data asset management without switching consoles or writing boilerplate integration code.",
      "features": [
        {"title": "MCP Servers for Major Platforms", "description": "Provides MCP servers purpose-built for Microsoft Fabric, Snowflake, and Databricks."},
        {"title": "Natural Language Pipelines", "description": "Enables natural language pipeline creation and data transformation orchestration."},
        {"title": "Cross-Platform Exploration", "description": "Supports schema exploration and data lineage querying across platforms."},
        {"title": "AI Quality & Monitoring", "description": "Integrates AI agents for automated data quality checks, monitoring, and alerting."},
        {"title": "No-Code Orchestration Integration", "description": "Integrates with no-code workflow automation for pipeline orchestration."}
      ],
      "impact": "Reduces data engineering toil by giving AI agents and analysts a unified, language-driven interface across three major data platforms simultaneously — eliminating context-switching and manual API wrangling.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#0EA5E9",
      "icon": "🧱"
    },
    {
      "id": "15",
      "name": "Chef",
      "domain": "Food and Beverage",
      "category": "AI Avatar",
      "tagline": "AI-Powered Video Avatar for Food and Beverage Experiences",
      "overview": "Chef is an AI video avatar application tailored for the food and beverage industry. A lifelike AI presenter delivers personalised menu recommendations, ingredient explanations, allergen guidance, and step-by-step cooking walkthroughs — all through natural language conversation. The platform blends engaging content with commerce, enabling interactive, on-demand hosting around the clock.",
      "features": [
        {"title": "Lifelike Video Avatar", "description": "Provides natural, context-aware conversational interaction via a lifelike AI avatar."},
        {"title": "Personalised Recommendations", "description": "Recommends dishes and menus based on preferences and dietary restrictions."},
        {"title": "Guided Cooking Walkthroughs", "description": "Delivers step-by-step cooking guidance with real-time Q&A."},
        {"title": "Allergen & Nutrition Guidance", "description": "Explains allergens, nutritional breakdowns, and ingredient substitutions."},
        {"title": "Commerce Integrations", "description": "Integrates with POS and e-commerce for in-conversation ordering."}
      ],
      "impact": "Creates a differentiated, always-on digital engagement channel for F&B brands — combining the warmth and personalisation of a human host with the scalability and consistency of AI.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#F97316",
      "icon": "🍽"
    }
  ]
}

# ──────────────────────────────────────────────────────────────────────────────
# 🎛️ THEME + LAYOUT CONSTANTS
# ──────────────────────────────────────────────────────────────────────────────
W, H = A4
M = 42  # page margin
CARD_GAP = 12
SECTION_GAP = 20

BG = "#070B16"
PANEL = "#0B1224"
PANEL_2 = "#0E1A33"
TEXT = "#E6EEF9"
MUTED = "#A9B7D0"
HAIR = "#21304D"
SOFT = "#13264B"

def set_bg(c):
    c.setFillColor(colors.HexColor(BG))
    c.rect(0, 0, W, H, stroke=0, fill=1)

def header_bar(c, title_left, title_right=None, accent="#60A5FA", page_label=None):
    # top bar
    x = M
    y = H - M + 6
    bar_h = 28
    rr(c, x, H - M - bar_h + 10, W - 2*M, bar_h, r=10, fill=PANEL, stroke=HAIR, sw=0.8)

    # left title
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x + 14, H - M - 10, str(title_left))

    # right title
    if title_right:
        c.setFillColor(colors.HexColor(MUTED))
        c.setFont("Helvetica", 9)
        tw = c.stringWidth(str(title_right), "Helvetica", 9)
        c.drawString(W - M - 14 - tw, H - M - 10, str(title_right))

    # accent dot + page label
    rr(c, x + 8, H - M - 16, 6, 6, r=3, fill=accent)
    if page_label:
        pw = label_pill(c, W - M - 86, H - M - 22, page_label, bg=SOFT, fg=TEXT)
        # keep within bounds; label_pill already returns width; okay.

def footer(c, left_text, right_text):
    c.setStrokeColor(colors.HexColor(HAIR))
    c.setLineWidth(0.6)
    c.line(M, M-10, W-M, M-10)

    c.setFillColor(colors.HexColor(MUTED))
    c.setFont("Helvetica", 8)
    c.drawString(M, M-24, str(left_text))

    tw = c.stringWidth(str(right_text), "Helvetica", 8)
    c.drawString(W - M - tw, M-24, str(right_text))

def ensure_space(c, needed_h, ly, min_y):
    if ly - needed_h < min_y:
        c.showPage()
        set_bg(c)
        return True
    return False

def draw_stat_card(c, x, y, w, h, label, value, accent):
    rr(c, x, y, w, h, r=12, fill=PANEL, stroke=HAIR, sw=0.8)
    rr(c, x+10, y+h-18, 32, 8, r=4, fill=accent)
    c.setFillColor(colors.HexColor(MUTED))
    c.setFont("Helvetica", 8)
    c.drawString(x+12, y+h-32, str(label))
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x+12, y+14, str(value))

def draw_catalog_card(c, x, y, w, h, app):
    rr(c, x, y, w, h, r=14, fill=PANEL, stroke=HAIR, sw=0.9)
    # accent strip
    rr(c, x, y+h-6, w, 6, r=3, fill=app["accent"])
    # icon bubble
    rr(c, x+14, y+h-58, 40, 40, r=12, fill=PANEL_2, stroke=HAIR, sw=0.8)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 16)
    # emoji may not render; will fallback as '?'
    c.drawCentredString(x+34, y+h-44, str(app.get("icon", "•")).encode('latin-1', 'replace').decode('latin-1'))

    # app id pill
    label_pill(c, x+w-52, y+h-26, f"#{app['id']}", bg=SOFT, fg=TEXT)

    # titles
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(x+62, y+h-28, app["name"])

    c.setFillColor(colors.HexColor(MUTED))
    c.setFont("Helvetica", 8.5)
    c.drawString(x+62, y+h-42, f"{app['domain']} · {app['category']}")

    # tagline (wrapped)
    ly = y+h-58
    ph = para(c, f"<b>{app['tagline']}</b>", x+14, ly, w-28, max_h=44, font="Helvetica", size=8.5, color=TEXT, leading=10)
    ly -= ph + 10  # NO OVERLAPS

    # overview (short)
    snippet = app["overview"]
    if len(snippet) > 190:
        snippet = snippet[:187].rsplit(" ", 1)[0] + "..."
    ph2 = para(c, snippet, x+14, ly, w-28, max_h=46, font="Helvetica", size=8, color=MUTED, leading=10)
    ly -= ph2 + 10  # NO OVERLAPS

    # metrics row
    mx = x+14
    my = y+12
    for m in app.get("metrics", [])[:3]:
        txt = f"{m['label']}: {m['value']}"
        mw = label_pill(c, mx, my, txt, bg=PANEL_2, fg=TEXT)
        mx += mw + 8

def draw_feature_row(c, x, y, w, title, desc, accent):
    rr(c, x, y, w, 44, r=10, fill=PANEL, stroke=HAIR, sw=0.8)
    rr(c, x+10, y+14, 10, 10, r=3, fill=accent)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(x+26, y+28, title)
    ph = para(c, desc, x+26, y+20, w-36, max_h=20, font="Helvetica", size=8.2, color=MUTED, leading=10)
    # ph is internal height; the row is fixed so no cursor tracking here.

# ──────────────────────────────────────────────────────────────────────────────
# 📄 PAGES
# ──────────────────────────────────────────────────────────────────────────────
def page_hero(c, portfolio):
    set_bg(c)
    header_bar(
        c,
        title_left=portfolio["organisation"],
        title_right=f"{portfolio['year']} · Application Portfolio",
        accent="#60A5FA",
        page_label="HERO"
    )

    # Hero block
    hero_x = M
    hero_y = H - M - 270
    hero_w = W - 2*M
    hero_h = 230
    rr(c, hero_x, hero_y, hero_w, hero_h, r=18, fill=PANEL, stroke=HAIR, sw=1.0)

    # gradient-like accent bars
    rr(c, hero_x+18, hero_y+hero_h-22, hero_w-36, 6, r=3, fill="#2563EB")
    rr(c, hero_x+18, hero_y+hero_h-34, hero_w-90, 6, r=3, fill="#EC4899")
    rr(c, hero_x+18, hero_y+hero_h-46, hero_w-140, 6, r=3, fill="#16A34A")

    # Confidential badge
    if portfolio.get("confidential"):
        label_pill(c, hero_x + hero_w - 128, hero_y + hero_h - 54, "CONFIDENTIAL", bg="#7F1D1D", fg="#FFECEC")

    ly = hero_y + hero_h - 70
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 22)
    c.drawString(hero_x + 22, ly, portfolio["title"])
    ly -= 28 + 10  # NO OVERLAPS

    ph = para(
        c,
        "A consolidated view of Systech Analytics applications across domains — with at-a-glance summaries, capabilities, and business impact.",
        hero_x + 22,
        ly,
        hero_w - 44,
        max_h=60,
        font="Helvetica",
        size=10,
        color=MUTED,
        leading=14
    )
    ly -= ph + SECTION_GAP  # NO OVERLAPS + section gap

    # Stats cards
    stats = portfolio.get("stats", {})
    cards = [
        ("Total Apps", stats.get("totalApps", "—"), "#60A5FA"),
        ("Domains", stats.get("domains", "—"), "#22C55E"),
        ("AI Powered", stats.get("aiPowered", "—"), "#EC4899"),
        ("Build Tenure", stats.get("buildTenure", "—"), "#F59E0B")
    ]
    cw = (hero_w - 3*CARD_GAP) / 4.0
    ch = 78
    cy = hero_y + 20
    cx = hero_x
    for i, (lab, val, acc) in enumerate(cards):
        draw_stat_card(c, cx + i*(cw+CARD_GAP), cy, cw, ch, lab, val, acc)

    # Wireframe notes panel
    notes_y = M + 42
    notes_h = hero_y - notes_y - SECTION_GAP
    rr(c, M, notes_y, W-2*M, notes_h, r=16, fill=PANEL, stroke=HAIR, sw=0.9)

    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(M+18, notes_y + notes_h - 26, "Document Structure (Wireframe)")
    # y cursor discipline
    ly2 = notes_y + notes_h - 40
    ph2 = para(
        c,
        "<b>Pages:</b> Hero → Catalog (grid) → Detail pages (1 per application).<br/>"
        "<b>Components:</b> Header bar, cards, pills, feature list, metrics, impact callout.<br/>"
        "<b>Layout rules:</b> No overlaps; consistent margins; card gaps 12pt; section gaps 20pt.",
        M+18,
        ly2,
        W-2*M-36,
        max_h=120,
        font="Helvetica",
        size=9,
        color=MUTED,
        leading=13
    )
    ly2 -= ph2 + 10

    footer(c, f"{portfolio['organisation']} · {portfolio['title']}", "Page 1")

def page_catalog(c, portfolio, applications, page_num_start=2):
    # Multi-page catalog: 2 columns, 3 rows => 6 cards per page
    per_page = 6
    col_gap = CARD_GAP
    row_gap = CARD_GAP
    cols = 2

    card_w = (W - 2*M - col_gap) / 2.0
    card_h = 218

    top_y = H - M - 54  # below header
    min_y = M + 34

    idx = 0
    page_num = page_num_start
    while idx < len(applications):
        set_bg(c)
        header_bar(
            c,
            title_left=portfolio["title"],
            title_right=f"{portfolio['year']} · {portfolio['organisation']}",
            accent="#60A5FA",
            page_label="CATALOG"
        )

        # Catalog header
        ly = H - M - 74
        c.setFillColor(colors.HexColor(TEXT))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(M, ly, "Application Catalog")
        ly -= 16 + 10  # NO OVERLAPS

        ph = para(
            c,
            "Browse all applications. Each card summarises domain, category, tagline, and quick status metrics.",
            M,
            ly,
            W - 2*M,
            max_h=30,
            font="Helvetica",
            size=9,
            color=MUTED,
            leading=12
        )
        ly -= ph + SECTION_GAP

        # Grid origin
        grid_top = ly
        x0 = M
        y0 = grid_top - card_h

        # Draw up to per_page cards
        for i in range(per_page):
            if idx >= len(applications):
                break
            app = applications[idx]

            r = i // cols
            ccol = i % cols
            x = x0 + ccol * (card_w + col_gap)
            y = y0 - r * (card_h + row_gap)

            # if card would fall below min_y, stop and go next page (safety)
            if y < min_y:
                break

            draw_catalog_card(c, x, y, card_w, card_h, app)
            idx += 1

        footer(c, f"{portfolio['organisation']} · Catalog", f"Page {page_num}")
        page_num += 1
        if idx < len(applications):
            c.showPage()

    return page_num  # next page number

def page_detail(c, portfolio, app, page_num):
    set_bg(c)
    header_bar(
        c,
        title_left=f"{portfolio['title']}",
        title_right=f"{portfolio['organisation']} · {portfolio['year']}",
        accent=app["accent"],
        page_label=f"DETAIL #{app['id']}"
    )

    # Title block
    rr(c, M, H - M - 178, W - 2*M, 140, r=18, fill=PANEL, stroke=HAIR, sw=1.0)
    rr(c, M, H - M - 44, W - 2*M, 6, r=3, fill=app["accent"])

    # Icon
    rr(c, M+18, H - M - 152, 52, 52, r=16, fill=PANEL_2, stroke=HAIR, sw=0.9)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(M+44, H - M - 134, str(app.get("icon", "•")).encode('latin-1', 'replace').decode('latin-1'))

    # Name and meta
    ly = H - M - 74
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(M+82, ly, app["name"])
    ly -= 20 + 10  # NO OVERLAPS

    c.setFillColor(colors.HexColor(MUTED))
    c.setFont("Helvetica", 10)
    c.drawString(M+82, ly, f"{app['domain']} · {app['category']}")
    ly -= 14 + 10  # NO OVERLAPS

    ph = para(
        c,
        f"<b>{app['tagline']}</b>",
        M+82,
        ly,
        W - 2*M - 100,
        max_h=38,
        font="Helvetica",
        size=10,
        color=TEXT,
        leading=13
    )
    ly -= ph + 10  # NO OVERLAPS

    # Metrics pills
    mx = M+82
    my = H - M - 160
    for m in app.get("metrics", [])[:4]:
        mw = label_pill(c, mx, my, f"{m['label']}: {m['value']}", bg=SOFT, fg=TEXT)
        mx += mw + 8

    # Two-column body: Overview + Features/Impact
    body_top = H - M - 206
    body_bottom = M + 40
    body_h = body_top - body_bottom
    col_gap = 14
    col_w = (W - 2*M - col_gap) / 2.0

    left_x = M
    right_x = M + col_w + col_gap

    # Left panel: Overview
    rr(c, left_x, body_bottom, col_w, body_h, r=16, fill=PANEL, stroke=HAIR, sw=0.9)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x+16, body_top-22, "Overview")
    lyL = body_top - 36
    phO = para(
        c,
        app["overview"],
        left_x+16,
        lyL,
        col_w-32,
        max_h=body_h-70,
        font="Helvetica",
        size=9,
        color=MUTED,
        leading=13
    )
    lyL -= phO + SECTION_GAP  # NO OVERLAPS + section gap

    # Impact callout
    call_h = 86
    call_y = body_bottom + 16
    rr(c, left_x+16, call_y, col_w-32, call_h, r=14, fill=PANEL_2, stroke=HAIR, sw=0.8)
    rr(c, left_x+28, call_y+call_h-18, 40, 8, r=4, fill=app["accent"])
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(left_x+28, call_y+call_h-34, "Impact")
    _ = para(
        c,
        app["impact"],
        left_x+28,
        call_y+call_h-44,
        col_w-56,
        max_h=call_h-26,
        font="Helvetica",
        size=8.6,
        color=TEXT,
        leading=12
    )

    # Right panel: Key Features
    rr(c, right_x, body_bottom, col_w, body_h, r=16, fill=PANEL, stroke=HAIR, sw=0.9)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(right_x+16, body_top-22, "Key Features")

    lyR = body_top - 38
    # draw features as fixed rows; if overflow, continue on a new page for remaining features
    features = app.get("features", [])
    i = 0
    row_h = 44
    row_gap = 10
    min_y = body_bottom + 16
    while i < len(features):
        # check if next row fits; if not, new page and continue (still detail)
        if lyR - row_h < min_y:
            footer(c, f"{portfolio['organisation']} · {app['name']}", f"Page {page_num}")
            c.showPage()
            page_num += 1

            set_bg(c)
            header_bar(
                c,
                title_left=f"{app['name']} (cont.)",
                title_right=f"{portfolio['organisation']} · {portfolio['year']}",
                accent=app["accent"],
                page_label=f"DETAIL #{app['id']}"
            )
            # rebuild a single-column continuation panel for features
            rr(c, M, M+40, W-2*M, H-2*M-90, r=16, fill=PANEL, stroke=HAIR, sw=0.9)
            c.setFillColor(colors.HexColor(TEXT))
            c.setFont("Helvetica-Bold", 12)
            c.drawString(M+16, H - M - 74, "Key Features (continued)")
            lyR = H - M - 92
            right_x = M
            col_w = W - 2*M
            body_bottom = M+40
            min_y = body_bottom + 16

        f = features[i]
        draw_feature_row(c, right_x+16, lyR-row_h, col_w-32, f["title"], f["description"], app["accent"])
        lyR -= row_h + row_gap  # cursor moves (NO OVERLAPS)
        i += 1

    footer(c, f"{portfolio['organisation']} · {app['name']}", f"Page {page_num}")
    return page_num + 1

# ──────────────────────────────────────────────────────────────────────────────
# 🚀 BUILD PDF
# ──────────────────────────────────────────────────────────────────────────────
def build(filename="portfolio_wireframes.pdf"):
    portfolio = DATA["portfolio"]
    apps = DATA["applications"]

    c = canvas.Canvas(filename, pagesize=A4)
    c.setTitle(portfolio["title"])

    # 1) Hero
    page_hero(c, portfolio)
    c.showPage()

    # 2) Catalog (multi-page)
    next_page_num = page_catalog(c, portfolio, apps, page_num_start=2)
    c.showPage()

    # 3) Detail pages (one per app; may spill if features overflow)
    page_num = next_page_num
    for app in apps:
        page_num = page_detail(c, portfolio, app, page_num)
        c.showPage()

    # Remove last blank page if any: reportlab has no direct remove; we avoid emitting extra.
    # The above always showPage after each detail; last showPage creates a trailing blank.
    # Workaround: only showPage between pages, not after last.
    # So we rebuild properly with a new canvas approach not feasible. Instead: do not add final showPage.

def build_no_trailing_blank(filename="portfolio_wireframes.pdf"):
    portfolio = DATA["portfolio"]
    apps = DATA["applications"]

    c = canvas.Canvas(filename, pagesize=A4)
    c.setTitle(portfolio["title"])

    # Hero
    page_hero(c, portfolio)
    c.showPage()

    # Catalog pages: internal loop already showPage between catalog pages; it ends without showPage
    next_page_num = page_catalog(c, portfolio, apps, page_num_start=2)

    # After catalog, start details on a new page
    c.showPage()
    page_num = next_page_num

    for idx, app in enumerate(apps):
        # draw detail (can consume multiple pages internally)
        next_pn = page_detail(c, portfolio, app, page_num)
        page_num = next_pn
        # Only showPage if not last app (to avoid trailing blank)
        if idx != len(apps) - 1:
            c.showPage()

    c.save()

if __name__ == "__main__":
    build_no_trailing_blank("portfolio_wireframes.pdf")