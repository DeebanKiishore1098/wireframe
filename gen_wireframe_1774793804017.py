# IntelliFrame DESIGN ENGINE (v3.1 - Bug Fix Edition)
# High-fidelity multi-page wireframe generator (ReportLab)
# Generates: Hero page, Catalog pages, and one Detail page per application.

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import os

# ──────────────────────────────────────────────────────────────────────────────
# DATA EMBEDDING (STRICT)
# ──────────────────────────────────────────────────────────────────────────────
BRIEF = {
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
      "tagline": "AI-powered promotional coupon engine that generates hyper-personalised offers for casino players.",
      "overview": "Maverick is a personalised incentive generation platform built for the gaming and casino industry. It analyses player behaviour, spending history, game preferences, and visit frequency to craft hyper-personalised promotional offers — from free spins and dining credits to VIP room upgrades. Powered by AI, Maverick replaces static, one-size-fits-all promotions with dynamic, data-driven campaigns that adapt in real time to maximise player engagement and lifetime value.",
      "features": [
        {"title": "Player segmentation", "description": "Segments players by lifetime value, churn risk, and play patterns for targeted campaigns."},
        {"title": "Automated coupon generation", "description": "Generates coupons using configurable reward rules and expiry logic."},
        {"title": "Real-time multi-channel delivery", "description": "Delivers offers via SMS, app notifications, and kiosk displays in real time."},
        {"title": "Campaign analytics & A/B testing", "description": "Tracks performance and supports A/B testing to optimise conversion and retention."},
        {"title": "POS & loyalty integrations", "description": "Integrates with casino POS and loyalty management systems for closed-loop execution."}
      ],
      "impact": "Increases promotional ROI and player retention by delivering the right offer to the right player at the right moment, replacing guesswork with precision targeting.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#F59E0B",
      "icon": "🎰"
    },
    {
      "id": "02",
      "name": "TRBank",
      "domain": "Banking",
      "category": "Data Processing",
      "tagline": "Intelligent document processing to transform unstructured banking documents into validated structured data.",
      "overview": "TRBank is an intelligent document processing platform designed for financial institutions. It ingests unstructured banking documents — account statements, loan applications, KYC forms, remittance slips, and free-text correspondence — and transforms them into clean, validated, structured datasets ready for downstream analytics, compliance reporting, and core banking system ingestion.",
      "features": [
        {"title": "Multi-format document ingestion", "description": "Processes PDFs, scanned images, and handwritten forms."},
        {"title": "Entity extraction", "description": "Extracts account numbers, dates, transaction amounts, and counterparties."},
        {"title": "Validation rules engine", "description": "Flags anomalies, duplicates, and missing fields for operational confidence."},
        {"title": "Structured outputs", "description": "Exports JSON/CSV and supports direct database write formats."},
        {"title": "Auditability & confidence scoring", "description": "Provides an audit trail and confidence score for every extracted field."}
      ],
      "impact": "Eliminates manual data entry for banking operations teams, reducing document processing time from hours to minutes per batch while improving accuracy and compliance readiness.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#2563EB",
      "icon": "🏦"
    },
    {
      "id": "03",
      "name": "Sustainability",
      "domain": "ESG",
      "category": "Emission Analytics",
      "tagline": "End-to-end ESG intelligence platform for Scope 1–3 emissions calculation and audit-ready reporting.",
      "overview": "The Sustainability platform is an end-to-end ESG intelligence tool for organisations managing their environmental footprint. It ingests utility bills, fuel logs, travel records, and supply chain data to calculate carbon emissions across Scope 1, 2, and 3 categories. The platform generates audit-ready ESG reports aligned with GHG Protocol and GRI standards, and provides predictive analytics to model emission reduction scenarios for net-zero planning.",
      "features": [
        {"title": "Automated utility bill parsing", "description": "Parses utility bills and maps to relevant emission factors automatically."},
        {"title": "Scope 1–3 carbon accounting", "description": "Calculates emissions across Scopes 1, 2, and 3 aligned to the GHG Protocol."},
        {"title": "AI-generated ESG narrative reports", "description": "Creates board- and regulator-ready narrative reporting output."},
        {"title": "Benchmarking dashboards", "description": "Provides industry peer benchmarking and target-gap analysis views."},
        {"title": "Scenario modelling", "description": "Models net-zero pathways and reduction roadmap scenarios for planning."}
      ],
      "impact": "Reduces ESG reporting effort from weeks of manual spreadsheet work to automated, audit-ready output generated in minutes — enabling organisations to meet sustainability reporting obligations with confidence.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#16A34A",
      "icon": "🌿"
    },
    {
      "id": "04",
      "name": "Ecovision",
      "domain": "ESG",
      "category": "Vision AI",
      "tagline": "Computer-vision compliance monitoring that turns CCTV into continuous sustainability auditing.",
      "overview": "Ecovision brings computer vision into the sustainability space, transforming passive CCTV infrastructure into an active compliance monitoring system. It continuously analyses live and recorded facility video feeds to detect energy waste, improper waste disposal, safety non-compliance, and resource misuse. Each detected event is logged with an extracted video clip, timestamp, severity rating, and an AI-generated corrective action recommendation.",
      "features": [
        {"title": "Real-time facility video analysis", "description": "Detects sustainability and compliance events across live and recorded feeds."},
        {"title": "Automated incident logging", "description": "Logs incidents with clip extraction and severity classification."},
        {"title": "Corrective action recommendations", "description": "Generates AI recommendations per detected incident to guide remediation."},
        {"title": "Compliance scoring & trends", "description": "Provides scoring dashboards with historical trend analytics."},
        {"title": "Unified ESG reporting integration", "description": "Integrates natively with the Sustainability platform for consolidated reporting."}
      ],
      "impact": "Transforms sustainability auditing from periodic manual walkthroughs into a continuous, automated, evidence-driven compliance function — providing an always-on audit trail for regulators and internal teams.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#16A34A",
      "icon": "👁"
    },
    {
      "id": "05",
      "name": "Hotel Concierge",
      "domain": "Hospitality",
      "category": "AI Agent",
      "tagline": "AI avatar booking agent for end-to-end hotel reservations and guest amenity services.",
      "overview": "Hotel Concierge is a conversational AI agent that handles end-to-end hotel booking and guest services through a lifelike AI avatar interface. Guests interact in natural language to search rooms, check availability, make bookings, and reserve amenities including dining, spa, and leisure activities. The agent maintains conversational context across multi-turn interactions and orchestrates reservations through backend hotel PMS integrations, delivering a seamless, always-available self-service experience.",
      "features": [
        {"title": "Room booking flows", "description": "Supports room search, booking, modification, and cancellation via natural language."},
        {"title": "Amenity reservations", "description": "Books dining, spa, pool, gym, and activities from one conversational interface."},
        {"title": "Conversational memory", "description": "Maintains multi-turn context and tracks guest preferences over time."},
        {"title": "AI avatar interface", "description": "Uses a lifelike avatar UI for immersive and personalised guest experiences."},
        {"title": "PMS & channel manager integration", "description": "Connects to PMS/channel manager for real-time availability and pricing."}
      ],
      "impact": "Reduces front-desk workload and call centre volumes while increasing ancillary revenue by enabling 24/7 self-service booking through an engaging, human-like AI interface.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#EC4899",
      "icon": "🏨"
    },
    {
      "id": "06",
      "name": "VetAI",
      "domain": "HR Tech",
      "category": "AI Screening",
      "tagline": "AI recruitment platform for automated candidate screening, proctored interviews, and structured reports.",
      "overview": "VetAI is a full-stack AI recruitment platform that automates the candidate screening process from job posting through to hiring decision. It conducts live AI-powered video interviews, evaluates responses across communication quality, technical accuracy, and behavioural competencies in real time, and delivers structured hiring reports to recruiters. Video proctoring and silence detection ensure interview integrity, while job-title-based configuration templates allow rapid setup for diverse roles across any industry.",
      "features": [
        {"title": "AI-led video interviews", "description": "Conducts live interviews with dynamic, contextual follow-up questioning."},
        {"title": "Interview integrity controls", "description": "Uses video proctoring, anomaly detection, and silence detection for integrity scoring."},
        {"title": "Multi-dimensional evaluation", "description": "Assesses technical, behavioural, and communication performance in real time."},
        {"title": "Automated hiring reports", "description": "Produces structured reports with role-fit scores and candidate ranking."},
        {"title": "Pipeline management", "description": "Provides a dashboard for candidate tracking and recruitment analytics."}
      ],
      "impact": "Cuts time-to-screen by up to 70%, enabling recruiters to focus on final-stage evaluation while AI handles initial assessment at scale — consistently and without bias.",
      "metrics": [
        {"label": "Time-to-screen reduction", "value": "Up to 70%"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#8B5CF6",
      "icon": "🧑"
    },
    {
      "id": "07",
      "name": "Resonance",
      "domain": "L&D",
      "category": "Communication AI",
      "tagline": "AI communication coaching using speech analysis and LLM evaluation to accelerate professional upskilling.",
      "overview": "Resonance is an AI-powered communication coaching platform designed to help professionals develop confident, effective communication skills. Using speech analysis and LLM-based evaluation, it assesses tone, clarity, pacing, filler word usage, and persuasive impact during practice sessions and real conversations. Personalised feedback loops and structured exercises help users build lasting communication habits, with progress tracked and visualised across sessions over time.",
      "features": [
        {"title": "Real-time speech analysis", "description": "Analyses tone, pace, clarity, and filler word frequency during sessions."},
        {"title": "Actionable feedback reports", "description": "Generates specific improvement suggestions using LLM-based evaluation."},
        {"title": "Scenario-based practice", "description": "Supports practice for presentations, negotiations, and interviews."},
        {"title": "Progress tracking", "description": "Tracks skill growth over time with visualised progress across sessions."},
        {"title": "Team analytics", "description": "Provides cohort-level insights for L&D managers and organisations."}
      ],
      "impact": "Helps organisations build a culture of clear, confident communication — reducing meeting inefficiencies and improving stakeholder engagement across teams at every level.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#06B6D4",
      "icon": "🗣"
    },
    {
      "id": "08",
      "name": "Orbit",
      "domain": "Internal Tool",
      "category": "Project Management",
      "tagline": "Internal project and ticket tracking system providing a real-time source of truth for delivery execution.",
      "overview": "Orbit is Systech's purpose-built internal project management and ticket tracking platform. It centralises task creation, assignment, status tracking, and milestone management across all active projects and client engagements. Built to replace scattered spreadsheets and email threads, Orbit gives team leads and senior leadership a real-time, always-accurate operational view of delivery health, resource allocation, and sprint progress across the entire organisation.",
      "features": [
        {"title": "Project & sprint management", "description": "Creates projects/sprints with milestone, deadline, and priority tracking."},
        {"title": "End-to-end ticket lifecycle", "description": "Manages tickets from backlog creation through completion sign-off."},
        {"title": "Workload visibility", "description": "Assigns tickets and shows individual workload across projects."},
        {"title": "Search and filtering", "description": "Supports priority/status filters and global search across active work."},
        {"title": "Collaboration threads", "description": "Includes per-ticket activity feeds and comment threads for async collaboration."}
      ],
      "impact": "Gives Systech leadership a single source of truth for all project delivery, replacing fragmented communication channels with a structured, searchable operational hub.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#6B7280",
      "icon": "🗂"
    },
    {
      "id": "09",
      "name": "SysRank",
      "domain": "Internal Tool",
      "category": "Technical Assessment",
      "tagline": "Proprietary technical assessment platform for coding/SQL challenges and objective benchmarking.",
      "overview": "SysRank is Systech's internal equivalent of HackerRank — a proprietary platform for evaluating technical talent through structured coding challenges, SQL assessments, data engineering problems, and timed problem sets. It is used both in the hiring pipeline to screen candidates objectively and internally to benchmark developer and analyst skill levels across the team. Question banks are managed by domain, difficulty level, and technology track.",
      "features": [
        {"title": "Timed assessments", "description": "Runs timed coding challenges across Python, SQL, and data engineering tracks."},
        {"title": "Auto-grading", "description": "Auto-grades with partial scoring and detailed result breakdowns."},
        {"title": "Proctored candidate portal", "description": "Provides a candidate-facing portal with proctoring and integrity controls."},
        {"title": "Question bank management", "description": "Organises question banks by domain, difficulty, and technology."},
        {"title": "Benchmarking dashboards", "description": "Shows leaderboards, score history, and skill heatmaps for benchmarking."}
      ],
      "impact": "Standardises talent evaluation at Systech, ensuring consistent, objective assessment for both external hiring and internal capability development and benchmarking.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#6B7280",
      "icon": "🧪"
    },
    {
      "id": "10",
      "name": "AeroIntel",
      "domain": "Aviation",
      "category": "RAG · Conversational AI",
      "tagline": "RAG-powered AI assistant enabling CCR technicians to query procedures, manuals, and fault history in seconds.",
      "overview": "AeroIntel is a retrieval-augmented generation (RAG) AI assistant built specifically for airport Common Communication Room (CCR) technicians. It enables natural language queries over a hybrid knowledge base combining structured operational databases and unstructured technical documents. Technicians can instantly surface maintenance procedures, equipment manuals, fault histories, and operational protocols — without navigating complex document repositories or waiting for expert availability during live incidents.",
      "features": [
        {"title": "Hybrid RAG search", "description": "Combines structured database access with unstructured document retrieval."},
        {"title": "Conversational interface", "description": "Supports natural language queries with context-aware multi-turn conversation."},
        {"title": "Guided procedure retrieval", "description": "Returns step-by-step maintenance procedures with resolution guidance."},
        {"title": "Fault pattern matching", "description": "Finds similar incidents by searching fault histories and patterns."},
        {"title": "Agentic orchestration", "description": "Synthesises multi-source answers for complex operational queries."}
      ],
      "impact": "Dramatically reduces time-to-resolution for technical faults by giving CCR engineers instant access to the right information during live airport incidents — when every minute counts.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#0EA5E9",
      "icon": "✈"
    },
    {
      "id": "11",
      "name": "SysMart",
      "domain": "Retail",
      "category": "AI Chatbot",
      "tagline": "Databricks-powered conversational AI chatbot combining live SQL querying with RAG over retail knowledge bases.",
      "overview": "SysMart is a conversational AI platform for retail operations, built on Databricks AI serving endpoints. It combines live SQL-based database querying with retrieval-augmented generation over product catalogues, return policies, and FAQ knowledge bases to answer questions from both customers and internal operations teams. The Freshchat integration deploys the chatbot directly into the existing customer support channel, enabling seamless handoff between AI and human agents when escalation is needed.",
      "features": [
        {"title": "Live database Q&A", "description": "Runs natural language queries against live inventory and order management databases."},
        {"title": "RAG over knowledge bases", "description": "Uses RAG over product catalogues, return policies, and operational FAQs."},
        {"title": "Freshchat deployment", "description": "Integrates with Freshchat for customer-facing self-service experiences."},
        {"title": "Human escalation", "description": "Supports intelligent escalation and handoff to human agents for complex cases."},
        {"title": "Usage analytics", "description": "Tracks usage, categorises queries, and supports continuous improvement."}
      ],
      "impact": "Reduces support ticket volume and handles routine product, order, and policy queries automatically — freeing support agents to focus on higher-value, complex customer interactions.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#F97316",
      "icon": "🛒"
    },
    {
      "id": "12",
      "name": "Intelliframe",
      "domain": "Design",
      "category": "Generative AI",
      "tagline": "Generates annotated dashboard and app wireframes from natural language briefs or data schemas.",
      "overview": "Intelliframe accelerates the design-to-development pipeline by generating annotated dashboard and application wireframes from natural language briefs or data schemas. Product managers and business analysts describe what they need — the metrics to display, the intended user journey, layout preferences — and Intelliframe produces structured wireframe mockups complete with component annotations, layout logic, and data binding suggestions ready for developer handoff.",
      "features": [
        {"title": "Natural language to wireframes", "description": "Generates wireframes for dashboards, apps, and portals directly from briefs."},
        {"title": "Schema-aware layouts", "description": "Suggests layouts aligned to the underlying data model/schema."},
        {"title": "Annotated components", "description": "Adds UX rationale and interaction behaviour notes for developer handoff."},
        {"title": "Export formats", "description": "Exports to image, PDF, and developer-ready specification documents."},
        {"title": "Iterative refinement", "description": "Supports follow-up prompts to refine and iterate on wireframe outputs."}
      ],
      "impact": "Compresses weeks of wireframing and design iteration into hours, aligning product, design, and engineering teams around a shared visual brief much faster — reducing rework and misalignment.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#A855F7",
      "icon": "🧩"
    },
    {
      "id": "13",
      "name": "AiCCTV",
      "domain": "Security",
      "category": "Vision Analytics",
      "tagline": "AI-powered surveillance platform for real-time anomaly detection, alerts, and compliance-ready incident records.",
      "overview": "AiCCTV is an intelligent video surveillance solution that transforms passive camera infrastructure into an active security intelligence layer. It processes live and recorded feeds to detect anomalies, unauthorised access, crowd density violations, safety hazards, and behavioural patterns of concern. Alerts are generated in real time with accompanying video clip evidence and incident metadata, enabling security operations centres to act proactively rather than reactively on emerging threats.",
      "features": [
        {"title": "Real-time anomaly & intrusion detection", "description": "Monitors multiple camera feeds to detect anomalies and intrusions in real time."},
        {"title": "Crowd & zone monitoring", "description": "Tracks crowd density and supports zone-based restricted access alerting."},
        {"title": "Safety hazard detection", "description": "Detects falls, unattended objects, and fire indicators to reduce risk."},
        {"title": "Evidence-backed alerts", "description": "Dispatches alerts with video clip evidence and incident metadata."},
        {"title": "Historical analytics & reporting", "description": "Provides incident analytics, heatmaps, and compliance reporting."}
      ],
      "impact": "Enables proactive security operations at scale across large facilities — reducing incident response time and providing evidence-backed records for compliance investigations and regulatory audits.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#DC2626",
      "icon": "📹"
    },
    {
      "id": "14",
      "name": "DataOne",
      "domain": "Data Engineering",
      "category": "AI Tooling",
      "tagline": "Unified AI data engineering toolkit bridging Fabric, Snowflake, and Databricks via MCP servers.",
      "overview": "DataOne is Systech's unified AI data engineering platform that bridges Microsoft Fabric, Snowflake, and Databricks under a single intelligent interface. Through purpose-built MCP (Model Context Protocol) servers, DataOne exposes the full capability of each platform to AI agents and automation workflows — enabling natural language pipeline creation, cross-platform schema exploration, query execution, and data asset management without switching between separate consoles or writing boilerplate integration code.",
      "features": [
        {"title": "MCP server connectors", "description": "Provides MCP servers purpose-built for Fabric, Snowflake, and Databricks."},
        {"title": "Natural language pipelines", "description": "Creates pipelines and orchestrates transformations via language-driven commands."},
        {"title": "Cross-platform exploration", "description": "Enables schema exploration and data lineage querying across platforms."},
        {"title": "AI agent automation", "description": "Supports automated data quality checks, monitoring, and alerting via agents."},
        {"title": "No-code orchestration integration", "description": "Integrates with no-code workflow automation for pipeline orchestration."}
      ],
      "impact": "Reduces data engineering toil by giving AI agents and analysts a unified, language-driven interface across three major data platforms simultaneously — eliminating context-switching and manual API wrangling.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#0F766E",
      "icon": "🧱"
    },
    {
      "id": "15",
      "name": "Chef",
      "domain": "Food and Beverage",
      "category": "AI Avatar",
      "tagline": "AI-powered video avatar delivering personalised menu guidance, allergens, and cooking walkthroughs.",
      "overview": "Chef is an AI video avatar application tailored for the food and beverage industry. A lifelike AI presenter delivers personalised menu recommendations, ingredient explanations, allergen guidance, and step-by-step cooking walkthroughs — all through natural language conversation. The platform blends engaging content with commerce, enabling restaurants, food brands, and recipe platforms to offer an interactive, on-demand AI host available around the clock with the warmth of a human presenter.",
      "features": [
        {"title": "Conversational video avatar", "description": "Delivers lifelike, context-aware interactions through an AI video presenter."},
        {"title": "Personalised recommendations", "description": "Recommends dishes and menus based on preferences and dietary restrictions."},
        {"title": "Guided cooking walkthroughs", "description": "Provides step-by-step cooking guidance with real-time Q&A."},
        {"title": "Allergen & nutrition support", "description": "Explains allergens, nutrition breakdowns, and ingredient substitution options."},
        {"title": "Commerce integration", "description": "Integrates with POS and e-commerce for in-conversation ordering."}
      ],
      "impact": "Creates a differentiated, always-on digital engagement channel for F&B brands — combining the warmth and personalisation of a human host with the scalability and consistency of AI.",
      "metrics": [
        {"label": "Coverage", "value": "Full"},
        {"label": "Status", "value": "Live"},
        {"label": "Version", "value": "v1.0"}
      ],
      "accent": "#84CC16",
      "icon": "🍽"
    }
  ]
}


# ──────────────────────────────────────────────────────────────────────────────
# Font registration (emoji-capable fallback strategy)
# ──────────────────────────────────────────────────────────────────────────────
def _try_register_fonts():
    """
    Try to register a decent Unicode font for icons/emoji.
    ReportLab doesn't guarantee emoji rendering; we fall back gracefully.
    """
    # 1) If system has NotoSansSymbols2 / DejaVuSans, register.
    candidates = [
        ("DejaVuSans", [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/Library/Fonts/DejaVuSans.ttf",
            "C:\\Windows\\Fonts\\DejaVuSans.ttf",
        ]),
        ("NotoSans", [
            "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
            "/Library/Fonts/NotoSans-Regular.ttf",
            "C:\\Windows\\Fonts\\NotoSans-Regular.ttf",
        ]),
        ("NotoSansSymbols2", [
            "/usr/share/fonts/truetype/noto/NotoSansSymbols2-Regular.ttf",
            "/Library/Fonts/NotoSansSymbols2-Regular.ttf",
            "C:\\Windows\\Fonts\\NotoSansSymbols2-Regular.ttf",
        ]),
        ("SegoeUIEmoji", [
            "C:\\Windows\\Fonts\\seguiemj.ttf",
        ]),
        ("AppleColorEmoji", [
            "/System/Library/Fonts/Apple Color Emoji.ttc",
        ]),
    ]
    for face, paths in candidates:
        for p in paths:
            if os.path.exists(p):
                try:
                    pdfmetrics.registerFont(TTFont(face, p))
                    return face
                except Exception:
                    pass

    # 2) CID font fallback (covers many CJK glyphs; not true emoji)
    try:
        pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
        return "HeiseiKakuGo-W5"
    except Exception:
        return "Helvetica"


EMOJI_FONT = _try_register_fonts()


# ──────────────────────────────────────────────────────────────────────────────
# Utilities (saveState/restoreState, HexColor, para height tracking)
# ──────────────────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def safe_hex(hex_str, fallback="#64748B"):
    try:
        return HexColor(hex_str)
    except Exception:
        return HexColor(fallback)

def draw_round_rect(c, x, y, w, h, r=8, fill=0, stroke=1):
    c.roundRect(x, y, w, h, r, stroke=stroke, fill=fill)

def draw_divider(c, x1, y, x2, color="#E5E7EB", lw=1):
    c.saveState()
    c.setStrokeColor(HexColor(color))
    c.setLineWidth(lw)
    c.line(x1, y, x2, y)
    c.restoreState()

def fit_text_one_line(c, text, x, y, max_w, font_name="Helvetica-Bold", font_size=12, color="#0F172A"):
    c.saveState()
    c.setFillColor(HexColor(color))
    size = font_size
    c.setFont(font_name, size)
    while size > 7 and pdfmetrics.stringWidth(text, font_name, size) > max_w:
        size -= 0.5
        c.setFont(font_name, size)
    c.drawString(x, y, text)
    c.restoreState()
    return size

def para_draw(c, text, x, y_top, w, style):
    """
    Draw a Paragraph with top-aligned y coordinate.
    Returns height consumed.
    """
    p = Paragraph(text, style)
    _, h = p.wrap(w, 10000)
    p.drawOn(c, x, y_top - h)
    return h

def chip(c, x, y, text, bg="#F1F5F9", fg="#0F172A", pad_x=8, pad_y=4, font_name="Helvetica", font_size=9, r=10):
    c.saveState()
    c.setFont(font_name, font_size)
    tw = pdfmetrics.stringWidth(text, font_name, font_size)
    w = tw + pad_x * 2
    h = font_size + pad_y * 2
    c.setFillColor(HexColor(bg))
    c.setStrokeColor(HexColor("#E2E8F0"))
    c.setLineWidth(1)
    draw_round_rect(c, x, y, w, h, r=r, fill=1, stroke=1)
    c.setFillColor(HexColor(fg))
    c.drawString(x + pad_x, y + pad_y, text)
    c.restoreState()
    return w, h

def metric_pill(c, x, y, label, value, accent="#2563EB"):
    """
    Small metric pill (label + value) in a compact card.
    """
    c.saveState()
    c.setLineWidth(1)
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setFillColor(HexColor("#FFFFFF"))
    w = 165
    h = 44
    draw_round_rect(c, x, y, w, h, r=10, fill=1, stroke=1)

    # accent bar
    c.setFillColor(safe_hex(accent))
    draw_round_rect(c, x + 10, y + 10, 6, h - 20, r=3, fill=1, stroke=0)

    c.setFillColor(HexColor("#475569"))
    c.setFont("Helvetica", 8.5)
    c.drawString(x + 24, y + h - 17, label.upper())

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x + 24, y + 14, value)

    c.restoreState()
    return w, h


# ──────────────────────────────────────────────────────────────────────────────
# Page chrome
# ──────────────────────────────────────────────────────────────────────────────
def draw_header(c, title_left, subtitle_left=None, right_text=None, accent="#2563EB", show_confidential=False):
    """
    Top bar with title + optional subtitle; right-side small text.
    """
    c.saveState()
    margin = 18 * mm
    top_h = 18 * mm
    y0 = PAGE_H - margin - top_h

    # background
    c.setFillColor(HexColor("#0B1220"))
    c.rect(0, PAGE_H - top_h, PAGE_W, top_h, stroke=0, fill=1)

    # left accent bar
    c.setFillColor(safe_hex(accent))
    c.rect(0, PAGE_H - top_h, 10, top_h, stroke=0, fill=1)

    # title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(margin, PAGE_H - 14 * mm, title_left)

    if subtitle_left:
        c.setFillColor(HexColor("#CBD5E1"))
        c.setFont("Helvetica", 9.5)
        c.drawString(margin, PAGE_H - 18.2 * mm, subtitle_left)

    # right text
    if right_text:
        c.setFillColor(HexColor("#CBD5E1"))
        c.setFont("Helvetica", 9)
        tw = pdfmetrics.stringWidth(right_text, "Helvetica", 9)
        c.drawString(PAGE_W - margin - tw, PAGE_H - 14.5 * mm, right_text)

    if show_confidential:
        tag = "CONFIDENTIAL"
        c.setFont("Helvetica-Bold", 8.5)
        tw = pdfmetrics.stringWidth(tag, "Helvetica-Bold", 8.5)
        x = PAGE_W - margin - tw - 10
        y = PAGE_H - top_h + 6
        c.setFillColor(HexColor("#7F1D1D"))
        c.setStrokeColor(HexColor("#FCA5A5"))
        c.setLineWidth(1)
        draw_round_rect(c, x, y, tw + 20, 16, r=8, fill=1, stroke=1)
        c.setFillColor(HexColor("#FEE2E2"))
        c.drawString(x + 10, y + 4.5, tag)

    c.restoreState()

def draw_footer(c, page_num, total_pages=None):
    c.saveState()
    margin = 18 * mm
    y = 12 * mm
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    c.line(margin, y + 10, PAGE_W - margin, y + 10)

    c.setFillColor(HexColor("#64748B"))
    c.setFont("Helvetica", 8.5)
    left = BRIEF["portfolio"]["organisation"]
    c.drawString(margin, y, left)

    right = f"Page {page_num}" if total_pages is None else f"Page {page_num} / {total_pages}"
    tw = pdfmetrics.stringWidth(right, "Helvetica", 8.5)
    c.drawString(PAGE_W - margin - tw, y, right)
    c.restoreState()


# ──────────────────────────────────────────────────────────────────────────────
# Pages: Hero, Catalog, Detail
# ──────────────────────────────────────────────────────────────────────────────
def draw_hero_page(c, page_num):
    port = BRIEF["portfolio"]
    accent = "#A855F7"  # brand-ish; can be any
    draw_header(
        c,
        title_left=port["title"],
        subtitle_left=f"{port['organisation']} • {port['year']}",
        right_text="Application Wireframes",
        accent=accent,
        show_confidential=bool(port.get("confidential"))
    )

    margin = 18 * mm
    content_top = PAGE_H - 26 * mm
    content_bottom = 22 * mm
    content_h = content_top - content_bottom

    # Hero block
    c.saveState()
    c.setFillColor(HexColor("#0F172A"))
    draw_round_rect(c, margin, content_bottom + content_h * 0.45, PAGE_W - 2 * margin, content_h * 0.52, r=18, fill=1, stroke=0)

    # Accent gradient-ish stripes (vector approximation)
    ax = margin
    ay = content_bottom + content_h * 0.45
    aw = PAGE_W - 2 * margin
    ah = content_h * 0.52
    stripes = [
        ("#1D4ED8", 0.00, 0.18),
        ("#7C3AED", 0.18, 0.36),
        ("#DB2777", 0.36, 0.54),
        ("#F97316", 0.54, 0.72),
        ("#16A34A", 0.72, 0.90),
    ]
    for col, s0, s1 in stripes:
        c.setFillColor(HexColor(col))
        c.rect(ax + aw * s0, ay + ah - 8, aw * (s1 - s0), 8, stroke=0, fill=1)

    # Title + subtext
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(margin + 18, ay + ah - 48, "Application Portfolio")

    c.setFillColor(HexColor("#CBD5E1"))
    c.setFont("Helvetica", 11)
    c.drawString(margin + 18, ay + ah - 68, "Multi-page wireframe pack • hero + catalog + per-application detail screens")

    # Stats row
    stats = port.get("stats", {})
    stat_items = [
        ("Total Apps", stats.get("totalApps", "—")),
        ("Domains", stats.get("domains", "—")),
        ("AI / LLM", stats.get("aiPowered", "—")),
        ("Build Tenure", stats.get("buildTenure", "—")),
    ]
    sx = margin + 18
    sy = ay + 22
    for i, (lbl, val) in enumerate(stat_items):
        w, h = metric_pill(c, sx + i * 175, sy, lbl, val, accent="#38BDF8")
        # wrap domains pill if too long: leave as is (will still render)
    c.restoreState()

    # Lower: navigation / legend
    c.saveState()
    block_y = content_bottom
    block_h = content_h * 0.40
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, margin, block_y, PAGE_W - 2 * margin, block_h, r=18, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin + 18, block_y + block_h - 30, "What’s inside")

    bullets = [
        "<b>Catalog</b>: grid view of all applications with tags, domains, and status.",
        "<b>Detail</b>: one page per application with overview, feature list, impact, and metrics.",
        "<b>Wireframe fidelity</b>: high-contrast layout blocks suitable for design review & handoff."
    ]
    styles = getSampleStyleSheet()
    p_style = ParagraphStyle(
        "heroBullet",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.2,
        leading=13.2,
        textColor=HexColor("#334155"),
    )
    tx = margin + 18
    ty = block_y + block_h - 48
    for b in bullets:
        h = para_draw(c, f"• {b}", tx, ty, PAGE_W - 2 * margin - 36, p_style)
        ty -= (h + 6)

    # Legend chips
    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin + 18, block_y + 56, "Legend")

    chip_x = margin + 18
    chip_y = block_y + 28
    chip(c, chip_x, chip_y, "Domain", bg="#F1F5F9", fg="#0F172A")
    chip(c, chip_x + 74, chip_y, "Category", bg="#EEF2FF", fg="#1E3A8A")
    chip(c, chip_x + 160, chip_y, "Status: Live", bg="#ECFDF5", fg="#065F46")
    chip(c, chip_x + 258, chip_y, "Coverage: Full", bg="#F0FDFA", fg="#0F766E")
    c.restoreState()

    draw_footer(c, page_num)

def draw_catalog_pages(c, page_num_start):
    apps = BRIEF["applications"]
    port = BRIEF["portfolio"]
    margin = 18 * mm
    header_h = 18 * mm

    # grid settings
    cols = 2
    card_gap_x = 10 * mm
    card_gap_y = 10 * mm
    card_w = (PAGE_W - 2 * margin - card_gap_x) / cols
    card_h = 52 * mm

    usable_top = PAGE_H - header_h - 10 * mm
    usable_bottom = 22 * mm
    usable_h = usable_top - usable_bottom

    rows = int((usable_h + card_gap_y) // (card_h + card_gap_y))
    if rows < 1:
        rows = 1
    cards_per_page = rows * cols

    pages = []
    for i in range(0, len(apps), cards_per_page):
        pages.append(apps[i:i + cards_per_page])

    styles = getSampleStyleSheet()
    tagline_style = ParagraphStyle(
        "tagline",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=12,
        textColor=HexColor("#334155"),
    )

    for pi, chunk in enumerate(pages):
        accent = "#0EA5E9"
        draw_header(
            c,
            title_left=port["title"],
            subtitle_left="Catalog • Applications overview",
            right_text=f"{port['year']}",
            accent=accent,
            show_confidential=bool(port.get("confidential"))
        )

        # Summary strip
        c.saveState()
        c.setFillColor(HexColor("#FFFFFF"))
        c.setStrokeColor(HexColor("#E5E7EB"))
        c.setLineWidth(1)
        strip_h = 18 * mm
        strip_y = PAGE_H - header_h - 8 * mm - strip_h
        draw_round_rect(c, margin, strip_y, PAGE_W - 2 * margin, strip_h, r=12, fill=1, stroke=1)
        c.setFillColor(HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(margin + 14, strip_y + strip_h - 12.5, "Portfolio Index")

        meta = f"Total apps: {port.get('stats', {}).get('totalApps', str(len(apps)))} • Domains: {port.get('stats', {}).get('domains', '—')}"
        c.setFillColor(HexColor("#475569"))
        c.setFont("Helvetica", 9.5)
        c.drawString(margin + 14, strip_y + 6.5, meta)
        c.restoreState()

        # Cards
        start_y = strip_y - 10 * mm
        x0 = margin
        y = start_y

        for idx, app in enumerate(chunk):
            r = idx // cols
            col = idx % cols
            x = x0 + col * (card_w + card_gap_x)
            y_card_top = y - r * (card_h + card_gap_y)
            y_card = y_card_top - card_h

            c.saveState()
            c.setFillColor(HexColor("#FFFFFF"))
            c.setStrokeColor(HexColor("#E5E7EB"))
            c.setLineWidth(1)
            draw_round_rect(c, x, y_card, card_w, card_h, r=14, fill=1, stroke=1)

            # Accent header band
            acc = app.get("accent", "#64748B")
            c.setFillColor(safe_hex(acc))
            c.rect(x, y_card + card_h - 12, card_w, 12, stroke=0, fill=1)

            # Icon tile
            c.setFillColor(HexColor("#0B1220"))
            draw_round_rect(c, x + 14, y_card + card_h - 46, 30, 30, r=10, fill=1, stroke=0)

            # Icon
            c.setFillColor(white)
            c.setFont(EMOJI_FONT, 14)
            icon = app.get("icon", "■")
            c.drawCentredString(x + 14 + 15, y_card + card_h - 46 + 9, icon)

            # ID badge
            c.setFillColor(HexColor("#F1F5F9"))
            c.setStrokeColor(HexColor("#E2E8F0"))
            draw_round_rect(c, x + card_w - 60, y_card + card_h - 42, 46, 18, r=9, fill=1, stroke=1)
            c.setFillColor(HexColor("#0F172A"))
            c.setFont("Helvetica-Bold", 9.5)
            c.drawCentredString(x + card_w - 37, y_card + card_h - 37, f"APP {app.get('id','--')}")

            # Name
            fit_text_one_line(c, app.get("name", "—"), x + 54, y_card + card_h - 34, card_w - 120, font_name="Helvetica-Bold", font_size=13, color="#0F172A")

            # Domain + category chips
            chip_y = y_card + card_h - 66
            chip_x = x + 14
            w1, _ = chip(c, chip_x, chip_y, f"Domain: {app.get('domain','—')}", bg="#F1F5F9", fg="#0F172A")
            chip(c, chip_x + w1 + 8, chip_y, f"Category: {app.get('category','—')}", bg="#EEF2FF", fg="#1E3A8A")

            # Tagline paragraph
            tx = x + 14
            ty = y_card + card_h - 80
            th = para_draw(c, app.get("tagline", ""), tx, ty, card_w - 28, tagline_style)

            # Bottom metrics (status + version if present)
            metrics = {m.get("label", ""): m.get("value", "") for m in (app.get("metrics") or [])}
            status = metrics.get("Status", "—")
            version = metrics.get("Version", "—")
            coverage = metrics.get("Coverage", metrics.get("Time-to-screen reduction", "—"))

            # Status chip
            if status.lower() == "live":
                bg, fg = "#ECFDF5", "#065F46"
            else:
                bg, fg = "#FEF3C7", "#92400E"
            chip(c, x + 14, y_card + 12, f"Status: {status}", bg=bg, fg=fg)
            chip(c, x + 110, y_card + 12, f"Version: {version}", bg="#F8FAFC", fg="#334155")

            # Coverage chip (or custom metric)
            label = "Coverage" if "Coverage" in metrics else ("Metric" if coverage != "—" else "Coverage")
            chip(c, x + 14, y_card + 34, f"{label}: {coverage}", bg="#F0FDFA", fg="#0F766E")

            # Right "Detail" CTA placeholder
            c.setStrokeColor(safe_hex(acc))
            c.setFillColor(HexColor("#FFFFFF"))
            draw_round_rect(c, x + card_w - 108, y_card + 14, 94, 26, r=13, fill=1, stroke=1)
            c.setFillColor(safe_hex(acc))
            c.setFont("Helvetica-Bold", 9.5)
            c.drawCentredString(x + card_w - 61, y_card + 22, "View detail →")

            c.restoreState()

        draw_footer(c, page_num_start + pi)
        c.showPage()

    return page_num_start + len(pages)

def draw_detail_page(c, app, page_num):
    port = BRIEF["portfolio"]
    accent = app.get("accent", "#2563EB")
    draw_header(
        c,
        title_left=f"{port['title']}",
        subtitle_left=f"Application Detail • {app.get('id','--')} — {app.get('name','—')}",
        right_text=f"{app.get('domain','—')} • {app.get('category','—')}",
        accent=accent,
        show_confidential=bool(port.get("confidential"))
    )

    margin = 18 * mm
    header_h = 18 * mm
    top = PAGE_H - header_h - 10 * mm
    bottom = 22 * mm

    # Layout columns
    gutter = 10 * mm
    left_w = (PAGE_W - 2 * margin - gutter) * 0.62
    right_w = (PAGE_W - 2 * margin - gutter) - left_w
    left_x = margin
    right_x = margin + left_w + gutter

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "dTitle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=HexColor("#0F172A"),
    )
    body_style = ParagraphStyle(
        "dBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.2,
        leading=14,
        textColor=HexColor("#334155"),
    )
    small_style = ParagraphStyle(
        "dSmall",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=12.5,
        textColor=HexColor("#475569"),
    )
    feature_style = ParagraphStyle(
        "dFeat",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.6,
        leading=12.8,
        textColor=HexColor("#334155"),
    )

    # Left: hero summary card
    c.saveState()
    hero_h = 52 * mm
    draw_round_rect(c, left_x, top - hero_h, left_w, hero_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    # Ensure fill/stroke already handled by round rect: redraw with proper fill
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    draw_round_rect(c, left_x, top - hero_h, left_w, hero_h, r=16, fill=1, stroke=1)

    # Accent ribbon
    c.setFillColor(safe_hex(accent))
    c.rect(left_x, top - 10, left_w, 10, stroke=0, fill=1)

    # Icon block
    c.setFillColor(HexColor("#0B1220"))
    draw_round_rect(c, left_x + 16, top - 44, 34, 34, r=12, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(EMOJI_FONT, 16)
    c.drawCentredString(left_x + 16 + 17, top - 44 + 10, app.get("icon", "■"))

    # App name
    fit_text_one_line(c, f"{app.get('name','—')}", left_x + 60, top - 30, left_w - 200, font_name="Helvetica-Bold", font_size=18, color="#0F172A")

    # chips
    cy = top - 56
    w1, _ = chip(c, left_x + 16, cy, f"Domain: {app.get('domain','—')}", bg="#F1F5F9", fg="#0F172A", font_size=9)
    chip(c, left_x + 16 + w1 + 8, cy, f"Category: {app.get('category','—')}", bg="#EEF2FF", fg="#1E3A8A", font_size=9)
    chip(c, left_x + 16, cy - 22, f"App ID: {app.get('id','--')}", bg="#F8FAFC", fg="#334155", font_size=9)

    # Tagline
    t_y = top - 74
    para_draw(c, f"<b>Tagline:</b> {app.get('tagline','')}", left_x + 16, t_y, left_w - 32, small_style)

    c.restoreState()

    # Left: Overview + Features + Impact
    cursor_y = top - hero_h - 10 * mm

    # Overview card
    c.saveState()
    ov_h = 62 * mm
    draw_round_rect(c, left_x, cursor_y - ov_h, left_w, ov_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, left_x, cursor_y - ov_h, left_w, ov_h, r=16, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x + 16, cursor_y - 22, "Overview")

    draw_divider(c, left_x + 16, cursor_y - 28, left_x + left_w - 16)

    ov_text_top = cursor_y - 38
    para_draw(c, app.get("overview", ""), left_x + 16, ov_text_top, left_w - 32, body_style)

    c.restoreState()
    cursor_y -= (ov_h + 10 * mm)

    # Features card
    c.saveState()
    feat_h = 88 * mm
    draw_round_rect(c, left_x, cursor_y - feat_h, left_w, feat_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, left_x, cursor_y - feat_h, left_w, feat_h, r=16, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x + 16, cursor_y - 22, "Key Features")

    draw_divider(c, left_x + 16, cursor_y - 28, left_x + left_w - 16)

    fy = cursor_y - 40
    features = app.get("features") or []
    max_features = 5
    for i, f in enumerate(features[:max_features]):
        # feature bullet with mini accent dot
        c.setFillColor(safe_hex(accent))
        c.circle(left_x + 18, fy - 4, 2.5, stroke=0, fill=1)

        # title + description
        ft = f.get("title", "—")
        fd = f.get("description", "")
        # Title
        c.setFillColor(HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10.2)
        c.drawString(left_x + 28, fy - 8, ft)

        # Description paragraph
        dh = para_draw(c, fd, left_x + 28, fy - 14, left_w - 44, feature_style)
        fy -= (dh + 14)
        if fy < (cursor_y - feat_h + 18):
            break

    c.restoreState()
    cursor_y -= (feat_h + 10 * mm)

    # Impact card (short)
    c.saveState()
    imp_h = max(34 * mm, cursor_y - bottom)  # consume remaining
    imp_h = clamp(imp_h, 34 * mm, 52 * mm)
    draw_round_rect(c, left_x, cursor_y - imp_h, left_w, imp_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, left_x, cursor_y - imp_h, left_w, imp_h, r=16, fill=1, stroke=1)

    # Impact header with accent band
    c.setFillColor(safe_hex(accent))
    c.rect(left_x, cursor_y - 10, left_w, 10, stroke=0, fill=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x + 16, cursor_y - 26, "Impact")

    draw_divider(c, left_x + 16, cursor_y - 32, left_x + left_w - 16)

    para_draw(c, app.get("impact", ""), left_x + 16, cursor_y - 42, left_w - 32, body_style)

    c.restoreState()

    # Right: Metrics / Snapshot / Wireframe modules
    right_cursor = top

    # Snapshot card
    c.saveState()
    snap_h = 46 * mm
    draw_round_rect(c, right_x, right_cursor - snap_h, right_w, snap_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, right_x, right_cursor - snap_h, right_w, snap_h, r=16, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(right_x + 14, right_cursor - 22, "Snapshot")

    draw_divider(c, right_x + 14, right_cursor - 28, right_x + right_w - 14)

    # Chips row
    chip(right_x + 14, right_cursor - 46, f"Org: {port.get('organisation','—')}", bg="#F8FAFC", fg="#334155", font_size=9)
    chip(right_x + 14, right_cursor - 68, f"Year: {port.get('year','—')}", bg="#F8FAFC", fg="#334155", font_size=9)
    c.restoreState()
    right_cursor -= (snap_h + 10 * mm)

    # Metrics card
    c.saveState()
    met_h = 70 * mm
    draw_round_rect(c, right_x, right_cursor - met_h, right_w, met_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, right_x, right_cursor - met_h, right_w, met_h, r=16, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(right_x + 14, right_cursor - 22, "Metrics")

    draw_divider(c, right_x + 14, right_cursor - 28, right_x + right_w - 14)

    metrics = app.get("metrics") or []
    mx = right_x + 14
    my = right_cursor - 44
    for m in metrics[:4]:
        label = m.get("label", "—")
        value = m.get("value", "—")
        metric_pill(c, mx, my - 44, label, value, accent=accent)
        my -= 48
        if my < (right_cursor - met_h + 10):
            break

    c.restoreState()
    right_cursor -= (met_h + 10 * mm)

    # Wireframe modules card (placeholders for UI sections)
    c.saveState()
    wf_h = right_cursor - bottom
    wf_h = clamp(wf_h, 70 * mm, 120 * mm)
    draw_round_rect(c, right_x, right_cursor - wf_h, right_w, wf_h, r=16, fill=1, stroke=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#E5E7EB"))
    c.setLineWidth(1)
    draw_round_rect(c, right_x, right_cursor - wf_h, right_w, wf_h, r=16, fill=1, stroke=1)

    c.setFillColor(HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(right_x + 14, right_cursor - 22, "Suggested Screen Modules")

    draw_divider(c, right_x + 14, right_cursor - 28, right_x + right_w - 14)

    # module blocks
    mod_x = right_x + 14
    mod_w = right_w - 28
    yy = right_cursor - 42
    modules = [
        ("Primary user flow", "Entry → Context capture → Action → Confirmation"),
        ("Core UI components", "Cards, tables, filters, charts, assistant panel"),
        ("Integrations", "APIs / data sources / system connectors"),
        ("Analytics", "KPIs, trends, experiment results, audit logs"),
    ]
    for title, desc in modules:
        box_h = 26 * mm
        if yy - box_h < (right_cursor - wf_h + 12):
            break
        c.setFillColor(HexColor("#F8FAFC"))
        c.setStrokeColor(HexColor("#E2E8F0"))
        draw_round_rect(c, mod_x, yy - box_h, mod_w, box_h, r=12, fill=1, stroke=1)

        # small accent dot
        c.setFillColor(safe_hex(accent))
        c.circle(mod_x + 10, yy - 14, 3, stroke=0, fill=1)

        c.setFillColor(HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10.2)
        c.drawString(mod_x + 18, yy - 18, title)

        para_draw(c, desc, mod_x + 18, yy - 22, mod_w - 26, small_style)
        yy -= (box_h + 8)

    c.restoreState()

    # Footer
    draw_footer(c, page_num)


# ──────────────────────────────────────────────────────────────────────────────
# Build
# ──────────────────────────────────────────────────────────────────────────────
def build_wireframes(output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(BRIEF["portfolio"]["title"])

    page_num = 1

    # Hero
    draw_hero_page(c, page_num)
    c.showPage()
    page_num += 1

    # Catalog (1+ pages)
    page_num = draw_catalog_pages(c, page_num)

    # Detail pages: one per app
    for app in BRIEF["applications"]:
        draw_detail_page(c, app, page_num)
        c.showPage()
        page_num += 1

    c.save()


# CLI BOILERPLATE (EXACT)
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="output.pdf")
    args = parser.parse_args()
    build_wireframes(args.output)