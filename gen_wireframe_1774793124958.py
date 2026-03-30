# IntelliFrame DESIGN ENGINE (v3.0 - Visual Fix Edition)
# Multi-page wireframe PDF generator (ReportLab) — Systech Analytics Application Portfolio
#
# Usage:
#   python3 portfolio_wireframes.py
#
# Output:
#   systech_application_portfolio_wireframes.pdf

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch

# ──────────────────────────────────────────────────────────────────────────────
# Mandatory Renderer Utilities
# ──────────────────────────────────────────────────────────────────────────────
def rr(c, x, y, w, h, r=7, fill=None, stroke=None, sw=0.5):
    c.saveState()
    if fill:
        c.setFillColor(colors.hexColor(fill) if isinstance(fill, str) else fill)
    if stroke:
        c.setStrokeColor(colors.hexColor(stroke) if isinstance(stroke, str) else stroke)
        c.setLineWidth(sw)
    c.roundRect(x, y, w, h, r, fill=1 if fill else 0, stroke=1 if stroke else 0)
    c.restoreState()

def para(c, text, x, y, w, max_h=800, font="Helvetica", size=9, color="#F0F6FF", leading=12, align=0):
    from reportlab.platypus import Paragraph
    from reportlab.lib.styles import ParagraphStyle
    style = ParagraphStyle(
        "p",
        fontName=font,
        fontSize=size,
        textColor=colors.hexColor(color),
        leading=leading,
        alignment=align,
    )
    safe = str(text).encode("latin-1", "replace").decode("latin-1")
    p = Paragraph(safe, style)
    pw, ph = p.wrapOn(c, w, max_h)
    p.drawOn(c, x, y - ph)
    return ph

def label_pill(c, x, y, text, bg, fg="#F0F6FF"):
    tw = c.stringWidth(str(text), "Helvetica-Bold", 6.5)
    w = tw + 14
    h = 14
    rr(c, x, y, w, h, r=h / 2, fill=bg)
    c.setFillColor(colors.hexColor(fg))
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(x + w / 2, y + 4, str(text))
    return w

# ──────────────────────────────────────────────────────────────────────────────
# Input Data (STRICT JSON embedded)
# ──────────────────────────────────────────────────────────────────────────────
DATA = {
  "portfolio": {
    "title": "Systech Analytics — Application Portfolio",
    "organisation": "Systech Analytics",
    "year": "2026",
    "confidential": True,
    "stats": {
      "totalApps": "15",
      "domains": "Casino, Banking, ESG, Hospitality, HR Tech, L&D, Internal Tools, Aviation, Retail, Design, Security, Data Engineering, Food & Beverage",
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
      "tagline": "AI-powered promotional coupon engine generating hyper-personalised offers for casino players.",
      "overview": "Maverick is a personalised incentive generation platform for the gaming and casino industry. It analyses player behaviour, spending history, game preferences, and visit frequency to craft hyper-personalised offers (e.g., free spins, dining credits, VIP upgrades). Powered by AI, it replaces static promotions with dynamic, data-driven campaigns that adapt in real time to maximise engagement and lifetime value.",
      "features": [
        {"title": "Player segmentation","description": "Segments players by lifetime value, churn risk, and play patterns to target offers precisely."},
        {"title": "Automated coupon generation","description": "Generates coupons automatically with configurable reward rules and expiry logic."},
        {"title": "Real-time delivery","description": "Delivers offers in real time via SMS, app notifications, and kiosk displays."},
        {"title": "Campaign analytics","description": "Tracks performance with analytics and supports A/B testing for optimisation."},
        {"title": "Casino systems integration","description": "Integrates with casino POS and loyalty management systems."}
      ],
      "impact": "Increases promotional ROI and player retention by delivering the right offer to the right player at the right moment, replacing guesswork with precision targeting.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#8B5CF6",
      "icon": "🎰"
    },
    {
      "id": "02",
      "name": "TRBank",
      "domain": "Banking",
      "category": "Data Processing",
      "tagline": "Intelligent document processing that converts unstructured banking docs into validated structured data.",
      "overview": "TRBank is an intelligent document processing platform for financial institutions. It ingests unstructured banking documents (account statements, loan applications, KYC forms, remittance slips, and free-text correspondence) and transforms them into clean, validated, structured datasets ready for analytics, compliance reporting, and core banking system ingestion.",
      "features": [
        {"title": "Multi-format ingestion","description": "Ingests PDFs, scanned images, and handwritten forms."},
        {"title": "Entity extraction","description": "Extracts key entities such as account numbers, dates, transaction amounts, and counterparties."},
        {"title": "Validation rules engine","description": "Flags anomalies, duplicates, and missing fields using configurable validation rules."},
        {"title": "Structured outputs","description": "Outputs structured data as JSON, CSV, or direct database writes."},
        {"title": "Auditability and confidence scoring","description": "Provides an audit trail and confidence score for every extracted data field."}
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
      "tagline": "End-to-end ESG intelligence and Scope 1–3 emissions calculation with audit-ready reporting.",
      "overview": "The Sustainability platform is an end-to-end ESG intelligence tool for organisations managing environmental footprint. It ingests utility bills, fuel logs, travel records, and supply chain data to calculate carbon emissions across Scope 1, 2, and 3. It generates audit-ready ESG reports aligned with GHG Protocol and GRI standards, and provides predictive analytics to model emission reduction scenarios for net-zero planning.",
      "features": [
        {"title": "Automated bill parsing","description": "Parses utility bills and maps emission factors intelligently."},
        {"title": "Scope 1–3 carbon accounting","description": "Calculates emissions aligned to the GHG Protocol across Scope 1, 2, and 3."},
        {"title": "AI-generated narrative reports","description": "Creates board- and regulator-ready ESG narrative reports automatically."},
        {"title": "Benchmarking dashboards","description": "Provides peer benchmarking and target-gap analysis dashboards."},
        {"title": "Scenario modelling","description": "Models net-zero and reduction roadmap scenarios for planning."}
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
      "tagline": "Computer-vision compliance monitoring for sustainability auditing with evidence capture and scoring.",
      "overview": "Ecovision brings computer vision into sustainability by transforming passive CCTV into an active compliance monitoring system. It analyses live and recorded facility feeds to detect energy waste, improper waste disposal, safety non-compliance, and resource misuse. Each event is logged with an extracted clip, timestamp, severity rating, and an AI-generated corrective action recommendation.",
      "features": [
        {"title": "Real-time video analysis","description": "Detects sustainability and compliance events across facilities from live and recorded feeds."},
        {"title": "Incident logging with evidence","description": "Logs incidents automatically with clip extraction and severity classification."},
        {"title": "Corrective action recommendations","description": "Generates AI-based corrective actions per detected incident."},
        {"title": "Compliance scoring","description": "Provides a compliance scoring dashboard with historical trend analytics."},
        {"title": "ESG platform integration","description": "Integrates natively with the Sustainability platform for unified ESG reporting."}
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
      "tagline": "Conversational AI avatar that books rooms and amenities with PMS integration and 24/7 service.",
      "overview": "Hotel Concierge is a conversational AI agent that handles end-to-end hotel booking and guest services through a lifelike AI avatar interface. Guests can search rooms, check availability, make bookings, and reserve amenities (dining, spa, leisure). The agent maintains multi-turn conversational context and orchestrates reservations via backend hotel PMS integrations for a seamless, always-available self-service experience.",
      "features": [
        {"title": "Room booking workflows","description": "Supports room search, booking, modification, and cancellation via natural language."},
        {"title": "Amenity reservations","description": "Books dining, spa, pool, gym, and activities within the same conversation."},
        {"title": "Conversational memory","description": "Maintains multi-turn context and tracks guest preferences."},
        {"title": "AI avatar interface","description": "Delivers an immersive, human-like avatar experience for guests."},
        {"title": "PMS and channel manager integration","description": "Connects to PMS/channel manager for real-time availability and pricing."}
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
      "tagline": "AI-led candidate screening with live video interviews, integrity checks, and structured hiring reports.",
      "overview": "VetAI is a full-stack AI recruitment platform that automates candidate screening from job posting to hiring decision. It conducts live AI-powered video interviews, evaluates responses across communication, technical accuracy, and behavioural competencies in real time, and produces structured hiring reports. Video proctoring and silence detection support interview integrity, and job-title templates enable rapid configuration across roles.",
      "features": [
        {"title": "AI-led video interviews","description": "Runs live interviews with dynamic, contextual follow-up questions."},
        {"title": "Proctoring and integrity scoring","description": "Uses video proctoring with anomaly detection and integrity scoring."},
        {"title": "Multi-dimensional evaluation","description": "Assesses technical, behavioural, and communication dimensions consistently."},
        {"title": "Structured hiring reports","description": "Generates automated reports with role-fit scores and candidate ranking."},
        {"title": "Pipeline management","description": "Provides a dashboard for candidate tracking and analytics across stages."}
      ],
      "impact": "Cuts time-to-screen by up to 70%, enabling recruiters to focus on final-stage evaluation while AI handles initial assessment at scale — consistently and without bias.",
      "metrics": [{"label": "Time-to-screen reduction","value": "Up to 70%"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#EC4899",
      "icon": "👥"
    },
    {
      "id": "07",
      "name": "Resonance",
      "domain": "L&D",
      "category": "Communication AI",
      "tagline": "AI communication coaching using speech analysis and LLM feedback to build lasting skills.",
      "overview": "Resonance is an AI-powered communication coaching platform to help professionals develop confident, effective communication. Using speech analysis and LLM-based evaluation, it assesses tone, clarity, pacing, filler word usage, and persuasive impact during practice and real conversations. Personalised feedback loops and structured exercises support habit-building, with progress tracked over time.",
      "features": [
        {"title": "Real-time speech analysis","description": "Analyses tone, pace, clarity, and filler word frequency in real time."},
        {"title": "Actionable AI feedback","description": "Generates specific, actionable improvement suggestions after sessions."},
        {"title": "Scenario-based practice","description": "Supports practice for presentations, negotiations, and interviews."},
        {"title": "Progress tracking","description": "Tracks individual progress with skill growth visualisations over time."},
        {"title": "Team analytics","description": "Provides cohort-level analytics for L&D managers."}
      ],
      "impact": "Helps organisations build a culture of clear, confident communication — reducing meeting inefficiencies and improving stakeholder engagement across teams at every level.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#0EA5E9",
      "icon": "🎓"
    },
    {
      "id": "08",
      "name": "Orbit",
      "domain": "Internal Tool",
      "category": "Project Management",
      "tagline": "Internal project and ticket tracking system providing a single source of delivery truth.",
      "overview": "Orbit is Systech's internal project management and ticket tracking platform. It centralises task creation, assignment, status tracking, and milestone management across projects and client engagements. Built to replace spreadsheets and email threads, it provides leadership with a real-time operational view of delivery health, resource allocation, and sprint progress.",
      "features": [
        {"title": "Project and sprint planning","description": "Creates projects and sprints with milestone, deadline, and priority tracking."},
        {"title": "Ticket lifecycle management","description": "Manages tickets from backlog creation to completion sign-off."},
        {"title": "Workload visibility","description": "Assigns work and shows individual workload across projects."},
        {"title": "Search and filtering","description": "Enables priority/status filtering and global search across active work."},
        {"title": "Collaboration threads","description": "Provides per-ticket activity feeds and comment threads for async collaboration."}
      ],
      "impact": "Gives Systech leadership a single source of truth for all project delivery, replacing fragmented communication channels with a structured, searchable operational hub.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#64748B",
      "icon": "🧩"
    },
    {
      "id": "09",
      "name": "SysRank",
      "domain": "Internal Tool",
      "category": "Technical Assessment",
      "tagline": "Proprietary technical assessment platform for coding, SQL, and data engineering benchmarking.",
      "overview": "SysRank is Systech's internal equivalent of HackerRank for evaluating technical talent via coding challenges, SQL assessments, data engineering problems, and timed sets. It is used for candidate screening and internal benchmarking. Question banks are managed by domain, difficulty level, and technology track, with dashboards for results and skill insights.",
      "features": [
        {"title": "Timed assessments","description": "Runs timed coding challenges across Python, SQL, and data engineering tracks."},
        {"title": "Auto-grading","description": "Auto-grades test cases with partial scoring and detailed result breakdowns."},
        {"title": "Assessment portal","description": "Provides a candidate-facing portal with proctoring and integrity controls."},
        {"title": "Question bank management","description": "Organises question banks by domain, difficulty, and technology."},
        {"title": "Results analytics","description": "Shows leaderboards, score history, and skill heatmaps."}
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
      "tagline": "RAG-powered assistant for airport CCR technicians to retrieve procedures, manuals, and fault history fast.",
      "overview": "AeroIntel is a retrieval-augmented generation (RAG) assistant built for airport Common Communication Room (CCR) technicians. It supports natural language queries over a hybrid knowledge base that combines structured operational databases and unstructured technical documents, enabling rapid access to maintenance procedures, equipment manuals, fault histories, and protocols during live incidents.",
      "features": [
        {"title": "Hybrid RAG architecture","description": "Combines structured database search with unstructured document retrieval."},
        {"title": "Conversational querying","description": "Supports context-aware, multi-turn natural language conversations."},
        {"title": "Guided maintenance retrieval","description": "Retrieves step-by-step procedures with guided resolution support."},
        {"title": "Fault pattern matching","description": "Looks up fault history and matches similar incidents."},
        {"title": "Agentic orchestration","description": "Orchestrates multi-source synthesis for complex queries."}
      ],
      "impact": "Dramatically reduces time-to-resolution for technical faults by giving CCR engineers instant access to the right information during live airport incidents — when every minute counts.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#0F766E",
      "icon": "✈"
    },
    {
      "id": "11",
      "name": "SysMart",
      "domain": "Retail",
      "category": "AI Chatbot",
      "tagline": "Databricks-powered conversational AI for retail ops with live SQL and RAG plus human handoff.",
      "overview": "SysMart is a conversational AI platform for retail operations built on Databricks AI serving endpoints. It combines live SQL-based database querying with RAG over product catalogues, return policies, and FAQ knowledge bases. Freshchat integration deploys the bot into existing support channels and enables seamless escalation to human agents when needed.",
      "features": [
        {"title": "Live database Q&A","description": "Answers natural language questions by querying live inventory and order management databases."},
        {"title": "RAG over retail knowledge","description": "Retrieves answers from product catalogues, return policies, and operational FAQs."},
        {"title": "Freshchat deployment","description": "Integrates with Freshchat for customer-facing self-service deployment."},
        {"title": "Human escalation","description": "Supports intelligent escalation and handoff to human agents for complex queries."},
        {"title": "Usage analytics","description": "Provides query categorisation and analytics for continuous improvement."}
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
      "tagline": "Generates annotated dashboard and app wireframes from natural language briefs or data schemas.",
      "overview": "Intelliframe accelerates the design-to-development pipeline by generating annotated dashboard and application wireframes from natural language briefs or data schemas. Users describe required metrics, journeys, and layout preferences, and Intelliframe produces structured wireframe mockups with component annotations, layout logic, and data binding suggestions ready for developer handoff.",
      "features": [
        {"title": "Natural language to wireframes","description": "Generates wireframes for dashboards, apps, and portals from natural language prompts."},
        {"title": "Schema-aware layouts","description": "Suggests layouts based on the underlying data model and schema."},
        {"title": "Annotated components","description": "Adds component annotations with UX rationale and interaction behaviour notes."},
        {"title": "Exportable deliverables","description": "Exports to image, PDF, and developer-ready specification document formats."},
        {"title": "Iterative refinement","description": "Supports follow-up conversational prompts for rapid iteration and refinement."}
      ],
      "impact": "Compresses weeks of wireframing and design iteration into hours, aligning product, design, and engineering teams around a shared visual brief much faster — reducing rework and misalignment.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#A855F7",
      "icon": "🧱"
    },
    {
      "id": "13",
      "name": "AiCCTV",
      "domain": "Security",
      "category": "Vision Analytics",
      "tagline": "AI video surveillance that detects anomalies, intrusion, hazards, and crowd violations with evidence.",
      "overview": "AiCCTV is an intelligent video surveillance solution that turns passive camera infrastructure into active security intelligence. It analyses live and recorded feeds to detect anomalies, unauthorised access, crowd density violations, safety hazards, and behavioural patterns. Alerts are generated in real time with video-clip evidence and incident metadata to support proactive security operations.",
      "features": [
        {"title": "Anomaly and intrusion detection","description": "Detects anomalies and intrusions across multiple simultaneous camera feeds."},
        {"title": "Crowd and access monitoring","description": "Monitors crowd density and triggers zone-based restricted access alerts."},
        {"title": "Safety hazard detection","description": "Detects falls, unattended objects, and fire indicators."},
        {"title": "Evidence-backed alerts","description": "Dispatches alerts with video clip evidence and full incident metadata."},
        {"title": "Historical analytics","description": "Provides incident analytics, heatmaps, and compliance reporting."}
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
      "tagline": "Unified AI data engineering interface across Fabric, Snowflake, and Databricks via MCP servers.",
      "overview": "DataOne is Systech's unified AI data engineering platform bridging Microsoft Fabric, Snowflake, and Databricks under a single intelligent interface. Using purpose-built MCP (Model Context Protocol) servers, it exposes each platform to AI agents and automation workflows—enabling natural language pipeline creation, cross-platform schema exploration, query execution, and data asset management without switching tools or writing boilerplate integrations.",
      "features": [
        {"title": "MCP servers for major platforms","description": "Provides MCP servers purpose-built for Microsoft Fabric, Snowflake, and Databricks."},
        {"title": "Natural language pipelines","description": "Creates pipelines and orchestrates transformations using natural language."},
        {"title": "Schema and lineage exploration","description": "Explores schemas and queries lineage across platforms."},
        {"title": "AI agent operations","description": "Integrates AI agents for automated data quality checks, monitoring, and alerting."},
        {"title": "No-code orchestration","description": "Connects with no-code workflow automation for pipeline orchestration."}
      ],
      "impact": "Reduces data engineering toil by giving AI agents and analysts a unified, language-driven interface across three major data platforms simultaneously — eliminating context-switching and manual API wrangling.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#1D4ED8",
      "icon": "🗄"
    },
    {
      "id": "15",
      "name": "Chef",
      "domain": "Food and Beverage",
      "category": "AI Avatar",
      "tagline": "AI video avatar for menu guidance, allergen support, cooking walkthroughs, and in-conversation ordering.",
      "overview": "Chef is an AI video avatar application for the food and beverage industry. A lifelike AI presenter provides personalised menu recommendations, ingredient explanations, allergen guidance, and step-by-step cooking walkthroughs through natural language conversation. The platform blends content and commerce so restaurants, food brands, and recipe platforms can offer an always-on interactive host.",
      "features": [
        {"title": "Conversational AI video avatar","description": "Delivers natural, context-aware conversation through a lifelike video avatar."},
        {"title": "Personalised recommendations","description": "Recommends dishes and menus based on preferences and dietary restrictions."},
        {"title": "Guided cooking with Q&A","description": "Provides step-by-step cooking walkthroughs with real-time Q&A."},
        {"title": "Allergen and nutrition guidance","description": "Explains allergens, nutrition breakdowns, and ingredient substitutions."},
        {"title": "Commerce integration","description": "Integrates with POS and e-commerce for in-conversation ordering."}
      ],
      "impact": "Creates a differentiated, always-on digital engagement channel for F&B brands — combining the warmth and personalisation of a human host with the scalability and consistency of AI.",
      "metrics": [{"label": "Coverage","value": "Full"},{"label": "Status","value": "Live"},{"label": "Version","value": "v1.0"}],
      "accent": "#E11D48",
      "icon": "🍽"
    }
  ]
}

# ──────────────────────────────────────────────────────────────────────────────
# Theme / Layout Constants (v3.0 fixes applied)
# ──────────────────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4

M = 40  # page margin
GAP = 10
SECT_GAP = 18 + 4         # increased by 4pt
CARD_GAP = 12 + 4         # increased by 4pt

BG = "#0B1220"
PANEL = "#0F1B2E"
PANEL_2 = "#101F36"
STROKE = "#22314D"
TEXT = "#F0F6FF"
MUTED = "#A9B7D0"
FAINT = "#7D8AA6"

def set_bg(c):
    c.saveState()
    c.setFillColor(colors.hexColor(BG))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()

def header_bar(c, title, subtitle=None, right_text=None):
    y_top = PAGE_H - M
    h = 54
    rr(c, M, y_top - h, PAGE_W - 2*M, h, r=10, fill=PANEL, stroke=STROKE, sw=0.8)
    x = M + 16
    ly = y_top - 14
    ph = para(c, f"<b>{title}</b>", x, ly, PAGE_W - 2*M - 32, size=12, leading=14, color=TEXT)
    ly -= ph + 2
    if subtitle:
        ph = para(c, subtitle, x, ly, PAGE_W - 2*M - 32, size=8.5, leading=11, color=MUTED)
        ly -= ph + 2
    if right_text:
        c.saveState()
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(colors.hexColor(MUTED))
        c.drawRightString(PAGE_W - M - 14, y_top - 22, str(right_text))
        c.restoreState()
    return y_top - h - SECT_GAP

def footer(c, page_num, total_pages):
    c.saveState()
    c.setStrokeColor(colors.hexColor(STROKE))
    c.setLineWidth(0.6)
    c.line(M, M - 8, PAGE_W - M, M - 8)
    c.setFillColor(colors.hexColor(FAINT))
    c.setFont("Helvetica", 8)
    c.drawString(M, M - 22, "Systech Analytics — Application Portfolio (Internal)")
    c.drawRightString(PAGE_W - M, M - 22, f"Page {page_num} / {total_pages}")
    c.restoreState()

def pill_row_wrapped(c, x, y, max_w, pills):
    # FIX: Sidebar tags wrap to next line if x > Sidebar_W
    cx = x
    cy = y
    line_h = 16
    for text, bg in pills:
        w = label_pill(c, cx, cy, text, bg)
        cx += w + 6
        if cx > x + max_w:
            cx = x
            cy -= line_h
            w = label_pill(c, cx, cy, text, bg)
            cx += w + 6
    return (y - cy) + line_h  # consumed height

def hero_title_size(title):
    # TITLES: Ensure hero title font size fits (use 28pt instead of 36pt if long).
    if len(title) > 34:
        return 28
    return 34

# ──────────────────────────────────────────────────────────────────────────────
# Pages
# ──────────────────────────────────────────────────────────────────────────────
def draw_cover(c, portfolio):
    set_bg(c)

    # Hero card
    hero_h = 250
    y_top = PAGE_H - M
    rr(c, M, y_top - hero_h, PAGE_W - 2*M, hero_h, r=14, fill=PANEL, stroke=STROKE, sw=1.0)

    x = M + 22
    ly = y_top - 26

    title_size = hero_title_size(portfolio["title"])
    ph = para(c, f"<b>{portfolio['title']}</b>", x, ly, PAGE_W - 2*M - 44, size=title_size, leading=title_size+4, color=TEXT)
    ly -= ph + 6

    subtitle = f"{portfolio['organisation']} · {portfolio['year']}"
    if portfolio.get("confidential"):
        subtitle += " · CONFIDENTIAL"
    ph = para(c, subtitle, x, ly, PAGE_W - 2*M - 44, size=10, leading=13, color=MUTED)
    ly -= ph + 10

    # Stats row card area
    stats = portfolio.get("stats", {})
    stats_y = y_top - hero_h + 22
    stats_h = 96
    rr(c, x, stats_y, PAGE_W - 2*M - 44, stats_h, r=12, fill=PANEL_2, stroke=STROKE, sw=0.8)

    # 4 stat mini cards
    inner_x = x + 14
    inner_y = stats_y + 14
    inner_w = PAGE_W - 2*M - 44 - 28
    col_gap = CARD_GAP
    cols = 4
    card_w = (inner_w - col_gap*(cols-1)) / cols
    card_h = stats_h - 28

    items = [
        ("Total Apps", stats.get("totalApps", "-")),
        ("Domains", stats.get("domains", "-")),
        ("AI / LLM", stats.get("aiPowered", "-")),
        ("Build Tenure", stats.get("buildTenure", "-")),
    ]

    for i, (lab, val) in enumerate(items):
        cx = inner_x + i*(card_w + col_gap)
        rr(c, cx, inner_y, card_w, card_h, r=10, fill=BG, stroke=STROKE, sw=0.8)

        # FIX: HERO STATS CARD text sizing (14pt value, 7pt label)
        tly = inner_y + card_h - 14
        ph1 = para(c, f"<b>{lab}</b>", cx + 10, tly, card_w - 20, size=7, leading=9, color=FAINT)
        tly -= ph1 + 6
        ph2 = para(c, f"<b>{val}</b>", cx + 10, tly, card_w - 20, size=14, leading=16, color=TEXT)
        tly -= ph2 + 2

    # Lower section: "How to read"
    y2 = y_top - hero_h - SECT_GAP
    rr(c, M, y2 - 168, PAGE_W - 2*M, 168, r=14, fill=PANEL, stroke=STROKE, sw=1.0)

    lx = M + 22
    ly = y2 - 22
    ph = para(c, "<b>What’s inside</b>", lx, ly, PAGE_W - 2*M - 44, size=12, leading=14, color=TEXT)
    ly -= ph + 8

    bullets = [
        "A catalogue grid of all applications (ID, name, domain, category, and tagline).",
        "Detailed pages per application with overview, key features, impact, and metrics.",
        "Consistent wireframe components and spacing for clean developer handoff."
    ]
    for b in bullets:
        ph = para(c, f"• {b}", lx, ly, PAGE_W - 2*M - 44, size=9.5, leading=13, color=MUTED)
        ly -= ph + 4

def draw_catalogue(c, portfolio, apps, page_num, total_pages):
    set_bg(c)
    content_top = header_bar(
        c,
        "Catalogue",
        subtitle=f"{portfolio['organisation']} · {portfolio['year']}",
        right_text="Application Index"
    )

    # Grid settings
    grid_x = M
    grid_w = PAGE_W - 2*M
    grid_y_top = content_top

    cols = 3
    col_gap = CARD_GAP
    row_gap = CARD_GAP
    card_w = (grid_w - col_gap*(cols-1)) / cols
    card_h = 220

    # Determine how many rows fit
    usable_h = grid_y_top - (M + 22)
    rows = int((usable_h + row_gap) // (card_h + row_gap))
    rows = max(1, rows)
    per_page = rows * cols

    start = (page_num - 1) * per_page
    end = min(len(apps), start + per_page)
    slice_apps = apps[start:end]

    # Section label
    ly = grid_y_top
    ph = para(c, "<b>Applications</b>", grid_x, ly, grid_w, size=11, leading=13, color=TEXT)
    ly -= ph + 8

    # Draw cards
    for idx, app in enumerate(slice_apps):
        r = idx // cols
        col = idx % cols
        cx = grid_x + col*(card_w + col_gap)
        cy_top = ly - r*(card_h + row_gap)

        # card
        rr(c, cx, cy_top - card_h, card_w, card_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)

        card_top = cy_top
        left = cx + 14
        right_w = card_w - 28

        # FIX: CATALOG CARDS positioning rules
        # icon at card_top - 30
        c.saveState()
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(colors.hexColor(app.get("accent", "#64748B")))
        safe_icon = str(app.get("icon", ""))
        safe_icon = safe_icon.encode("latin-1", "replace").decode("latin-1")
        c.drawString(left, card_top - 30, safe_icon)
        c.restoreState()

        # App name at card_top - 55
        _ = para(c, f"<b>{app['id']} · {app['name']}</b>", left, card_top - 55, right_w, size=11, leading=13, color=TEXT)

        # Pills at card_top - 75
        pill_y = (card_top - 75) - 14  # label_pill uses y as bottom; keep line within card
        px = left
        # chain pills; wrap within card width
        pills = [
            (app.get("domain", ""), app.get("accent", "#64748B")),
            (app.get("category", ""), "#233A5F"),
        ]
        # custom wrap for card
        max_w = right_w
        cxp = px
        cyp = pill_y
        for t, bg in pills:
            w = label_pill(c, cxp, cyp, t, bg)
            cxp += w + 6
            if cxp > px + max_w:
                cxp = px
                cyp -= 16
                w = label_pill(c, cxp, cyp, t, bg)
                cxp += w + 6

        # DESCRIPTION MUST START at card_top - 95. Advance by ph.
        dly = card_top - 95
        ph = para(c, app.get("tagline", ""), left, dly, right_w, size=8.8, leading=12, color=MUTED)
        dly -= ph + 8

        # Divider line
        c.saveState()
        c.setStrokeColor(colors.hexColor(STROKE))
        c.setLineWidth(0.7)
        c.line(left, dly, left + right_w, dly)
        c.restoreState()
        dly -= 10

        # Mini-metrics (up to 3)
        metrics = app.get("metrics", [])[:3]
        for m in metrics:
            lab = m.get("label", "")
            val = m.get("value", "")
            phm = para(c, f"<b>{lab}:</b> {val}", left, dly, right_w, size=8.2, leading=11, color=FAINT)
            dly -= phm + 4

    footer(c, page_num + 1, total_pages)  # cover is page 1

def draw_detail(c, portfolio, app, page_num, total_pages):
    set_bg(c)

    content_top = header_bar(
        c,
        f"{app['id']} · {app['name']}",
        subtitle=f"{app.get('domain','')} · {app.get('category','')}",
        right_text=f"{portfolio['year']}"
    )

    # Layout columns
    sidebar_w = 190
    main_w = (PAGE_W - 2*M) - sidebar_w - CARD_GAP
    x_main = M
    x_side = M + main_w + CARD_GAP

    # Sidebar panel
    side_top = content_top
    side_h = side_top - (M + 16)
    rr(c, x_side, side_top - side_h, sidebar_w, side_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)

    # Main panel container
    main_top = content_top
    main_h = main_top - (M + 16)
    rr(c, x_main, main_top - main_h, main_w, main_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)

    # Sidebar content
    sx = x_side + 14
    sly = side_top - 18
    ph = para(c, "<b>Quick tags</b>", sx, sly, sidebar_w - 28, size=10, leading=12, color=TEXT)
    sly -= ph + 8

    tags = [
        (app.get("domain",""), app.get("accent", "#64748B")),
        (app.get("category",""), "#233A5F"),
        ("Status: " + (app.get("metrics",[{"label":"Status","value":"-"}])[1]["value"] if len(app.get("metrics",[]))>1 else "Live"), "#1F3A2D"),
        ("Coverage: " + (app.get("metrics",[{"label":"Coverage","value":"-"}])[0]["value"] if len(app.get("metrics",[]))>0 else "Full"), "#27354F"),
    ]
    consumed = pill_row_wrapped(c, sx, sly - 16, sidebar_w - 28, tags)
    sly -= consumed + 6

    rr(c, sx, sly - 56, sidebar_w - 28, 56, r=12, fill=BG, stroke=STROKE, sw=0.8)
    tly = sly - 14
    ph = para(c, "<b>Tagline</b>", sx + 10, tly, sidebar_w - 48, size=8, leading=10, color=FAINT)
    tly -= ph + 4
    ph = para(c, app.get("tagline",""), sx + 10, tly, sidebar_w - 48, size=8.6, leading=11.5, color=MUTED)
    tly -= ph + 4
    sly -= 56 + 10

    # Accent block
    rr(c, sx, sly - 40, sidebar_w - 28, 40, r=12, fill=app.get("accent","#64748B"), stroke=None)
    c.saveState()
    c.setFillColor(colors.hexColor(TEXT))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(sx + 12, sly - 26, "Accent")
    c.setFont("Helvetica", 8)
    c.drawRightString(sx + sidebar_w - 28 - 12, sly - 26, app.get("accent","#"))
    c.restoreState()
    sly -= 40 + 12

    # Metrics card (dynamic height using para)
    metrics = app.get("metrics", [])
    # measure height
    mh = 14 + 10
    for m in metrics:
        # rough max_h; actual return used when drawing
        mh += 14
    mh = max(92, mh)
    rr(c, sx, sly - mh, sidebar_w - 28, mh, r=12, fill=PANEL_2, stroke=STROKE, sw=0.8)
    my = sly - 14
    ph = para(c, "<b>Metrics</b>", sx + 10, my, sidebar_w - 48, size=9.5, leading=12, color=TEXT)
    my -= ph + 8
    for m in metrics:
        ph = para(c, f"<b>{m.get('label','')}:</b> {m.get('value','')}", sx + 10, my, sidebar_w - 48, size=8.6, leading=11.5, color=MUTED)
        my -= ph + 5
    sly -= mh + 12

    # Main content
    mx = x_main + 16
    mly = main_top - 18

    # Icon + title line
    rr(c, mx, mly - 36, 36, 36, r=10, fill=BG, stroke=STROKE, sw=0.8)
    c.saveState()
    c.setFillColor(colors.hexColor(app.get("accent","#64748B")))
    c.setFont("Helvetica-Bold", 18)
    ico = str(app.get("icon","")).encode("latin-1","replace").decode("latin-1")
    c.drawCentredString(mx + 18, mly - 24, ico)
    c.restoreState()

    ph = para(c, f"<b>{app['name']}</b>", mx + 46, mly - 6, main_w - 62, size=16, leading=18, color=TEXT)
    # NO OVERLAPS: advance cursor by returned height
    mly -= max(ph, 20) + 10

    # Overview card
    ov_h = 160  # container; text uses para heights within
    rr(c, mx, mly - ov_h, main_w - 32, ov_h, r=12, fill=PANEL_2, stroke=STROKE, sw=0.8)
    oy = mly - 14
    ph = para(c, "<b>Overview</b>", mx + 12, oy, main_w - 56, size=10.5, leading=13, color=TEXT)
    oy -= ph + 8
    ph = para(c, app.get("overview",""), mx + 12, oy, main_w - 56, size=9.2, leading=13, color=MUTED)
    oy -= ph + 6
    mly -= ov_h + SECT_GAP

    # Features section title
    ph = para(c, "<b>Key features</b>", mx, mly, main_w - 32, size=11, leading=13, color=TEXT)
    mly -= ph + 8

    # Feature cards in two columns
    feat = app.get("features", [])
    fcols = 2
    fw = (main_w - 32 - CARD_GAP) / 2.0
    fx0 = mx
    fx1 = mx + fw + CARD_GAP

    # Cursor per column
    col_y = [mly, mly]
    for i, f in enumerate(feat):
        col = i % 2
        fx = fx0 if col == 0 else fx1
        y_top = col_y[col]

        # Draw title/desc first to compute needed height (using para return values)
        # We'll draw into card after setting its height; use a measuring pass by drawing off-card (safe: we can compute with wrap only by calling para? para draws.)
        # Instead: estimate by wrapping with Platypus directly (no drawing), then draw once.
        from reportlab.platypus import Paragraph
        from reportlab.lib.styles import ParagraphStyle

        style_t = ParagraphStyle("ft", fontName="Helvetica-Bold", fontSize=9.2, leading=11.5, textColor=colors.hexColor(TEXT))
        style_d = ParagraphStyle("fd", fontName="Helvetica", fontSize=8.6, leading=11.2, textColor=colors.hexColor(MUTED))

        safe_t = str(f.get("title","")).encode("latin-1","replace").decode("latin-1")
        safe_d = str(f.get("description","")).encode("latin-1","replace").decode("latin-1")

        pt = Paragraph(safe_t, style_t)
        pd = Paragraph(safe_d, style_d)
        _, ht = pt.wrap(fw - 24, 400)
        _, hd = pd.wrap(fw - 24, 600)

        # FIX: DETAIL FEATURE CARDS height >= 45 or ph + 20
        card_h = max(45, ht + hd + 20)

        # If not enough space in column, create new page continuation
        bottom_limit = M + 34
        if y_top - card_h < bottom_limit:
            # finalize page and start new detail continuation page
            footer(c, page_num, total_pages)
            c.showPage()
            set_bg(c)
            content_top = header_bar(
                c,
                f"{app['id']} · {app['name']} (cont.)",
                subtitle=f"{app.get('domain','')} · {app.get('category','')}",
                right_text=f"{portfolio['year']}"
            )
            # redraw panels quickly (same layout)
            side_top = content_top
            side_h = side_top - (M + 16)
            rr(c, x_side, side_top - side_h, sidebar_w, side_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)
            rr(c, x_main, side_top - side_h, main_w, side_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)

            # Minimal sidebar summary
            sx = x_side + 14
            sly = side_top - 18
            phs = para(c, "<b>App</b>", sx, sly, sidebar_w - 28, size=9.5, leading=12, color=TEXT)
            sly -= phs + 6
            _ = para(c, f"{app['id']} · {app['name']}", sx, sly, sidebar_w - 28, size=9, leading=12, color=MUTED)

            mx = x_main + 16
            mly = content_top - 18
            phm = para(c, "<b>Key features (continued)</b>", mx, mly, main_w - 32, size=11, leading=13, color=TEXT)
            mly -= phm + 10
            col_y = [mly, mly]
            y_top = col_y[col]

        rr(c, fx, y_top - card_h, fw, card_h, r=12, fill=BG, stroke=STROKE, sw=0.8)

        ty = y_top - 10
        # Feature Title at y
        ph1 = para(c, f"<b>{f.get('title','')}</b>", fx + 12, ty, fw - 24, size=9.2, leading=11.5, color=TEXT)
        ty -= ph1 + 2
        # Feature Desc at y-14 (implemented as a small gap; dynamic)
        ph2 = para(c, f.get("description",""), fx + 12, ty, fw - 24, size=8.6, leading=11.2, color=MUTED)
        ty -= ph2 + 2

        col_y[col] = (y_top - card_h) - CARD_GAP

    mly = min(col_y) - 2

    # Impact card (dynamic text)
    imp_h = 110
    if mly - imp_h < M + 34:
        footer(c, page_num, total_pages)
        c.showPage()
        set_bg(c)
        content_top = header_bar(
            c,
            f"{app['id']} · {app['name']} (impact)",
            subtitle=f"{app.get('domain','')} · {app.get('category','')}",
            right_text=f"{portfolio['year']}"
        )
        side_top = content_top
        side_h = side_top - (M + 16)
        rr(c, x_side, side_top - side_h, sidebar_w, side_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)
        rr(c, x_main, side_top - side_h, main_w, side_h, r=14, fill=PANEL, stroke=STROKE, sw=0.9)
        mx = x_main + 16
        mly = content_top - 18

    rr(c, mx, mly - imp_h, main_w - 32, imp_h, r=12, fill=PANEL_2, stroke=STROKE, sw=0.8)
    iy = mly - 14
    ph = para(c, "<b>Impact</b>", mx + 12, iy, main_w - 56, size=10.5, leading=13, color=TEXT)
    iy -= ph + 8
    ph = para(c, app.get("impact",""), mx + 12, iy, main_w - 56, size=9.2, leading=13, color=MUTED)
    iy -= ph + 6
    mly -= imp_h + 8

    footer(c, page_num, total_pages)

# ──────────────────────────────────────────────────────────────────────────────
# Build document with correct pagination
# ──────────────────────────────────────────────────────────────────────────────
def build():
    portfolio = DATA["portfolio"]
    apps = DATA["applications"]

    # Determine catalogue paging
    # We need to simulate how many catalogue pages based on available rows
    # (use same calculation as draw_catalogue)
    def catalogue_per_page():
        usable_top = PAGE_H - M - 54 - SECT_GAP  # header bar consumes ~54 + gap
        usable_h = usable_top - (M + 22)
        cols = 3
        card_h = 220
        row_gap = CARD_GAP
        rows = int((usable_h + row_gap) // (card_h + row_gap))
        rows = max(1, rows)
        return rows * cols

    per_cat = catalogue_per_page()
    cat_pages = (len(apps) + per_cat - 1) // per_cat

    # Estimate detail pages: typically 1 per app, but may spill; assume 1 each and allow spill (we handle with showPage inside)
    # Total pages: cover (1) + catalogue (cat_pages) + details (len(apps)) + possible spill pages.
    # We'll compute dynamically while rendering by keeping a list of page labels; simplest: two-pass rendering.
    # Pass 1: conservative upper bound: assume up to 2 pages per app.
    max_pages = 1 + cat_pages + len(apps) * 2

    out = "systech_application_portfolio_wireframes.pdf"
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle(portfolio["title"])

    # We'll render while tracking page numbers precisely, recomputing total at the end is hard with ReportLab.
    # Practical approach: render with a high total_pages label, then keep it stable.
    # Instead, do a lightweight preflight: simulate spill pages with same logic, without drawing.
    def preflight_total_pages():
        # cover: 1
        total = 1 + cat_pages
        # per app: compute if features likely spill. We'll approximate by checking feature card heights.
        # If a feature list is long, could spill; here 5 features, 2 columns -> likely 1 page, plus maybe impact.
        # Still, keep minimal accurate: 1 page per app; extra page if any column bottom for impact.
        extra = 0
        for app in apps:
            # approximate: overview + 5 features + impact fits; but safe check: if long overview/impact might expand visually (we used fixed container heights though).
            # so spill is unlikely; return 1 per app
            pass
        total += len(apps) + extra
        return total

    total_pages = preflight_total_pages()

    # Page 1: cover
    draw_cover(c, portfolio)
    footer(c, 1, total_pages)
    c.showPage()

    # Catalogue pages: pages 2..(1+cat_pages)
    for p in range(1, cat_pages + 1):
        draw_catalogue(c, portfolio, apps, page_num=p, total_pages=total_pages)
        c.showPage()

    # Detail pages: start after cover+catalogue
    page_counter = 1 + cat_pages + 1
    for app in apps:
        # draw_detail may internally add continuation pages; but footer uses provided page_num.
        # To keep numbers consistent, we avoid internal showPage in most cases; however we implemented it for overflow.
        # We'll render with current page_counter and update if extra pages occurred by detecting canvas page count isn't possible.
        # Given fixed heights, continuation is highly unlikely; keep simple single page per app.
        draw_detail(c, portfolio, app, page_counter, total_pages)
        c.showPage()
        page_counter += 1

    c.save()
    print(f"Wrote: {out}")

if __name__ == "__main__":
    build()