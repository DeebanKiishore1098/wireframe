#!/usr/bin/env python3
# IntelliFrame DESIGN ENGINE (v3.0)
# High-fidelity ReportLab script generating a product-grade wireframe PDF.
#
# Usage:
#   python portfolio_wireframes.py --output application_portfolio.pdf
#
# Notes:
# - Self-contained (no external assets). Uses vector icons.
# - Implements: stronger hero gradient, glass overlay, drop-shadows, accent pops,
#   improved typography leading (1.4x), refined separators, fixed catalog card height.

import argparse
import math
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.units import inch


# -----------------------------
# Data
# -----------------------------
DATA = {
  "portfolio": {
    "title": "Application Portfolio",
    "organisation": "Systech Analytics",
    "year": "2026",
    "stats": {
      "applications_count": 15,
      "ai_llm_powered_count": "7+",
      "industries_count": "5+",
      "confidentiality": "Confidential",
      "notable_metrics": [
        {"label": "Time-to-screen reduction (VetAI)", "value": "Up to 70%"},
        {"label": "ESG reporting cycle time (Sustainability)", "value": "Weeks → minutes"},
        {"label": "Bank document processing (TRBank)", "value": "Hours → minutes per batch"},
        {"label": "Design iteration speed (Intelliframe)", "value": "Weeks → hours"},
      ]
    }
  },
  "applications": [
    {
      "id": "APP-01",
      "name": "Maverick",
      "domain": "Casino & Gaming",
      "category": "AI Generation",
      "tagline": "AI-Powered Promotional Coupon Engine for Casino Players",
      "overview": "Maverick is a personalised incentive generation platform for gaming and casinos. It analyses player behaviour, spend history, game preferences, and visit frequency to generate hyper-personalised promotional offers (e.g., free spins, dining credits, VIP upgrades). It replaces static promotions with dynamic, data-driven campaigns that adapt in real time to maximise engagement and lifetime value.",
      "catalog_summary": "AI engine generating real-time, personalised casino offers to boost engagement and LTV.",
      "features": [
        {"title": "Player Segmentation", "description": "Segments players by lifetime value, churn risk, and play patterns for targeted promotions."},
        {"title": "Automated Coupon Generation", "description": "Generates coupons automatically with configurable reward rules and expiry logic."},
        {"title": "Omnichannel Offer Delivery", "description": "Delivers offers in real time via SMS, app notifications, and kiosk displays."},
        {"title": "Campaign Analytics & A/B Testing", "description": "Tracks campaign performance with analytics and A/B testing support."},
        {"title": "Casino Systems Integration", "description": "Integrates with casino POS and loyalty management systems."}
      ],
      "impact": "Improves promotional ROI and player retention through precision targeting with real-time, personalised incentives.",
      "metrics": [],
      "accent": "#D7263D",
      "icon": "casino"
    },
    {
      "id": "APP-02",
      "name": "TRBank",
      "domain": "Banking & Financial Services",
      "category": "Data Processing",
      "tagline": "Unstructured-to-Structured Data Transformation for Banking",
      "overview": "TRBank is an intelligent document processing platform for financial institutions. It ingests unstructured banking documents (statements, loan applications, KYC forms, remittance slips, free-text correspondence) and converts them into clean, validated structured datasets for analytics, compliance reporting, and core banking system ingestion.",
      "catalog_summary": "IDP platform turning banking documents into validated structured data for analytics and compliance.",
      "features": [
        {"title": "Multi-format Ingestion", "description": "Supports PDFs, scanned images, and handwritten forms."},
        {"title": "Entity Extraction", "description": "Extracts account numbers, dates, transaction amounts, and counterparties."},
        {"title": "Validation Rules Engine", "description": "Flags anomalies, duplicates, and missing fields through configurable validation."},
        {"title": "Structured Outputs", "description": "Exports to JSON/CSV and supports direct database writes."},
        {"title": "Audit Trail & Confidence Scoring", "description": "Provides an audit trail and confidence score per extracted data field."}
      ],
      "impact": "Eliminates manual data entry and accelerates document processing while improving accuracy and compliance readiness.",
      "metrics": [{"label": "Document processing time", "value": "Hours → minutes per batch"}],
      "accent": "#0B5FFF",
      "icon": "bank"
    },
    {
      "id": "APP-03",
      "name": "Sustainability",
      "domain": "ESG & Sustainability",
      "category": "Emission Analytics",
      "tagline": "Full-Cycle ESG Intelligence and Emission Calculation Platform",
      "overview": "Sustainability is an end-to-end ESG intelligence and carbon accounting platform. It ingests utility bills, fuel logs, travel records, and supply chain data to calculate emissions across Scope 1, 2, and 3. It generates audit-ready ESG reports aligned with GHG Protocol and GRI, and provides predictive analytics for emission-reduction scenarios and net-zero planning.",
      "catalog_summary": "End-to-end ESG + Scope 1–3 carbon accounting with audit-ready reports in minutes.",
      "features": [
        {"title": "Utility Bill Parsing", "description": "Automated parsing with intelligent emission factor mapping."},
        {"title": "Scope 1–3 Carbon Accounting", "description": "Carbon calculations aligned with the GHG Protocol across Scope 1, 2, and 3."},
        {"title": "AI ESG Narrative Reports", "description": "Generates board- and regulator-ready ESG narratives and reporting packs."},
        {"title": "Benchmarking & Target-Gap Dashboards", "description": "Peer benchmarking and target-gap analysis dashboards for ESG performance."},
        {"title": "Scenario Modelling", "description": "Models net-zero pathways and reduction roadmap scenarios."}
      ],
      "impact": "Automates ESG reporting from spreadsheet-heavy cycles into fast, audit-ready outputs to support regulatory and stakeholder obligations.",
      "metrics": [{"label": "ESG reporting effort", "value": "Weeks → minutes"}],
      "accent": "#16A34A",
      "icon": "leaf"
    },
    {
      "id": "APP-04",
      "name": "Ecovision",
      "domain": "ESG & Sustainability",
      "category": "Vision AI",
      "tagline": "Video-Powered AI Auditing for Sustainability Compliance",
      "overview": "Ecovision converts passive CCTV into an active sustainability compliance monitoring system. It analyses live and recorded facility video to detect energy waste, improper waste disposal, safety non-compliance, and resource misuse. Each event is logged with a clip, timestamp, severity rating, and AI-generated corrective action recommendations, with native integration to the Sustainability platform for unified reporting.",
      "catalog_summary": "Vision AI turns CCTV into always-on sustainability compliance monitoring with logged evidence.",
      "features": [
        {"title": "Real-time Compliance Video Analysis", "description": "Detects sustainability and compliance events across facilities from video feeds."},
        {"title": "Automated Incident Logging", "description": "Logs incidents with clip extraction and severity classification."},
        {"title": "Corrective Action Recommendations", "description": "Generates AI-based corrective actions per detected incident."},
        {"title": "Compliance Scoring & Trends", "description": "Dashboards for compliance scoring and historical trend analytics."},
        {"title": "Unified ESG Reporting Integration", "description": "Integrates with the Sustainability platform for consolidated ESG evidence and reporting."}
      ],
      "impact": "Shifts sustainability auditing from periodic manual checks to continuous, evidence-driven monitoring with an always-on audit trail.",
      "metrics": [],
      "accent": "#22C55E",
      "icon": "camera"
    },
    {
      "id": "APP-05",
      "name": "Hotel Concierge",
      "domain": "Hospitality & Travel",
      "category": "AI Agent",
      "tagline": "AI Avatar Booking Agent for Hotels and Guest Amenities",
      "overview": "Hotel Concierge is a conversational AI agent with a lifelike avatar that supports end-to-end hotel booking and guest services. Guests can search rooms, check availability, book/modify/cancel stays, and reserve amenities (dining, spa, leisure). It maintains multi-turn context and integrates with hotel PMS/channel managers for real-time availability and pricing to enable always-available self-service.",
      "catalog_summary": "24/7 AI avatar for hotel bookings + amenities with live PMS integration and context memory.",
      "features": [
        {"title": "End-to-End Booking Flows", "description": "Room search, booking, modification, and cancellation via natural language."},
        {"title": "Amenity Reservations", "description": "Reservations across dining, spa, pool, gym, and activities."},
        {"title": "Conversational Memory", "description": "Maintains multi-turn context and tracks guest preferences."},
        {"title": "Avatar Experience", "description": "Lifelike AI avatar interface for immersive guest interaction."},
        {"title": "PMS & Channel Manager Integration", "description": "Real-time availability and pricing through PMS/channel manager integrations."}
      ],
      "impact": "Reduces front-desk workload and call-centre volume while supporting incremental ancillary revenue through 24/7 self-service.",
      "metrics": [{"label": "Availability", "value": "24/7 self-service booking"}],
      "accent": "#F97316",
      "icon": "hotel"
    },
    {
      "id": "APP-06",
      "name": "VetAI",
      "domain": "HR Tech",
      "category": "AI Screening",
      "tagline": "End-to-End AI-Powered Candidate Screening and Interview Platform",
      "overview": "VetAI is a full-stack AI recruitment platform that automates candidate screening from job posting to hiring decision. It runs live AI video interviews with contextual follow-ups, evaluates technical/behavioural/communication performance in real time, and produces structured recruiter reports. Proctoring and silence detection support interview integrity, and job-title templates enable rapid setup across roles and industries.",
      "catalog_summary": "AI-led screening + video interviews with proctoring; cuts time-to-screen by up to 70%.",
      "features": [
        {"title": "AI Live Video Interviews", "description": "Conducts interviews with dynamic, contextual follow-up questioning."},
        {"title": "Integrity & Proctoring", "description": "Anomaly detection, silence detection, and integrity scoring during interviews."},
        {"title": "Multi-dimensional Evaluation", "description": "Scores candidates across technical, behavioural, and communication dimensions."},
        {"title": "Structured Hiring Reports", "description": "Auto-generates role-fit scores, rankings, and structured hiring summaries."},
        {"title": "Pipeline Management Analytics", "description": "Candidate management dashboard with pipeline tracking and analytics."}
      ],
      "impact": "Accelerates high-volume recruiting by automating initial screening and delivering consistent, structured evaluations.",
      "metrics": [{"label": "Time-to-screen reduction", "value": "Up to 70%"}],
      "accent": "#7C3AED",
      "icon": "users"
    },
    {
      "id": "APP-07",
      "name": "Resonance",
      "domain": "Learning & Development",
      "category": "Communication AI",
      "tagline": "AI Communication Coaching for Professional Upskilling",
      "overview": "Resonance is an AI communication coaching platform that analyses speech and uses LLM-based evaluation to assess tone, clarity, pacing, filler word usage, and persuasive impact. It provides personalised feedback and structured exercises for presentations, negotiations, and interviews, with progress tracking over time and team-level analytics for L&D managers.",
      "catalog_summary": "AI speech coaching with feedback loops, practice scenarios, and progress analytics for teams.",
      "features": [
        {"title": "Real-time Speech Analysis", "description": "Analyses tone, pace, clarity, and filler word frequency."},
        {"title": "Actionable Feedback Reports", "description": "Delivers specific improvement suggestions generated by AI."},
        {"title": "Scenario-based Practice", "description": "Practice modes for presentations, negotiations, and interviews."},
        {"title": "Progress Tracking", "description": "Tracks individual performance improvements across sessions over time."},
        {"title": "Team Analytics", "description": "Cohort-level analytics and monitoring for L&D managers."}
      ],
      "impact": "Improves organisational communication quality, reducing meeting inefficiencies and strengthening stakeholder engagement.",
      "metrics": [],
      "accent": "#2563EB",
      "icon": "mic"
    },
    {
      "id": "APP-08",
      "name": "Orbit",
      "domain": "Internal Operations",
      "category": "Project Management",
      "tagline": "Systech's Internal Project and Ticket Tracking System",
      "overview": "Orbit is Systech's internal project management and ticket tracking platform. It centralises tasks, assignments, status tracking, and milestones across projects and client engagements, replacing spreadsheets and email threads. Leaders get a real-time operational view of delivery health, resource allocation, and sprint progress across the organisation.",
      "catalog_summary": "Internal PM + ticketing hub replacing spreadsheets/email with real-time delivery visibility.",
      "features": [
        {"title": "Project & Sprint Planning", "description": "Creates projects/sprints with milestones, deadlines, and priorities."},
        {"title": "Ticket Lifecycle Management", "description": "Manages tickets from backlog creation through completion sign-off."},
        {"title": "Workload Visibility", "description": "Assigns tickets and provides individual workload visibility across projects."},
        {"title": "Search & Filtering", "description": "Priority/status filtering with global search across active projects."},
        {"title": "Async Collaboration", "description": "Per-ticket activity feeds and comment threads for collaboration."}
      ],
      "impact": "Creates a single source of truth for delivery execution, improving operational visibility and reducing fragmented coordination.",
      "metrics": [],
      "accent": "#334155",
      "icon": "kanban"
    },
    {
      "id": "APP-09",
      "name": "SysRank",
      "domain": "Internal Operations",
      "category": "Technical Assessment",
      "tagline": "Systech's Proprietary Technical Assessment and Benchmarking Platform",
      "overview": "SysRank is Systech’s internal equivalent of HackerRank for assessing technical talent via coding challenges, SQL assessments, data engineering problems, and timed problem sets. It supports hiring pipeline screening and internal benchmarking using domain/difficulty/track-managed question banks, proctoring controls, and performance dashboards (leaderboards, history, skill heatmaps).",
      "catalog_summary": "Internal HackerRank-style platform for coding/SQL assessments with proctoring and analytics.",
      "features": [
        {"title": "Timed Assessments", "description": "Timed coding challenges across Python, SQL, and data engineering tracks."},
        {"title": "Auto-grading & Scoring", "description": "Auto-graded test cases with partial scoring and detailed breakdowns."},
        {"title": "Assessment Portal & Integrity", "description": "Candidate-facing portal with proctoring and integrity controls."},
        {"title": "Question Bank Management", "description": "Organises question banks by domain, difficulty, and technology."},
        {"title": "Results Analytics", "description": "Leaderboards, score history, and skill heatmaps for benchmarking."}
      ],
      "impact": "Standardises technical evaluation for hiring and internal skills benchmarking with consistent, objective assessments.",
      "metrics": [],
      "accent": "#0F172A",
      "icon": "code"
    },
    {
      "id": "APP-10",
      "name": "AeroIntel",
      "domain": "Aviation",
      "category": "RAG · Conversational AI",
      "tagline": "RAG-Powered AI Assistant for Airport CCR Technicians",
      "overview": "AeroIntel is a RAG-based AI assistant for airport Common Communication Room (CCR) technicians. It supports natural language querying across a hybrid knowledge base spanning structured operational databases and unstructured technical documents. It helps engineers instantly retrieve maintenance procedures, manuals, fault histories, and operational protocols without navigating repositories or waiting for experts during live incidents.",
      "catalog_summary": "RAG assistant for airport CCR teams to retrieve procedures and fault history instantly during incidents.",
      "features": [
        {"title": "Hybrid RAG Search", "description": "Combines structured database search with document retrieval."},
        {"title": "Conversational Querying", "description": "Context-aware, multi-turn natural language interface."},
        {"title": "Guided Procedure Retrieval", "description": "Step-by-step maintenance procedure retrieval with guided resolution support."},
        {"title": "Fault Pattern Matching", "description": "Finds fault histories and similar-incident patterns."},
        {"title": "Agentic Orchestration", "description": "Supports complex, multi-source synthesis for advanced troubleshooting."}
      ],
      "impact": "Speeds up fault resolution by delivering the right operational knowledge instantly during time-critical airport incidents.",
      "metrics": [],
      "accent": "#06B6D4",
      "icon": "plane"
    },
    {
      "id": "APP-11",
      "name": "SysMart",
      "domain": "Retail",
      "category": "AI Chatbot",
      "tagline": "Databricks-Powered AI Chatbot for Retail Operations",
      "overview": "SysMart is a conversational AI platform for retail operations built on Databricks AI serving. It blends live SQL querying with RAG over product catalogues, return policies, and FAQ knowledge to answer questions from customers and internal ops teams. Freshchat integration enables deployment in existing support channels with AI-to-human handoff for escalations.",
      "catalog_summary": "Databricks + RAG retail chatbot with live SQL queries and Freshchat handoff to human agents.",
      "features": [
        {"title": "Live Database Q&A", "description": "Natural language queries against inventory and order management databases."},
        {"title": "RAG Knowledge Answers", "description": "RAG over product catalogues, return policies, and operational FAQs."},
        {"title": "Freshchat Deployment", "description": "Deploys directly into Freshchat for customer-facing self-service."},
        {"title": "Smart Escalation", "description": "Escalation logic and handoff to human agents for complex cases."},
        {"title": "Usage Analytics", "description": "Query categorisation and analytics dashboards for continuous improvement."}
      ],
      "impact": "Automates routine support queries to reduce ticket volume and free agents for higher-value customer interactions.",
      "metrics": [],
      "accent": "#F59E0B",
      "icon": "shopping-bag"
    },
    {
      "id": "APP-12",
      "name": "Intelliframe",
      "domain": "Design & Product",
      "category": "Generative AI",
      "tagline": "AI Wireframe Generator for Dashboards and Data Products",
      "overview": "Intelliframe generates annotated wireframes for dashboards and applications from natural language briefs or data schemas. It captures required metrics, user journey, and layout preferences, then produces structured mockups with component annotations, layout logic, and data binding suggestions ready for developer handoff, with iterative refinement via conversational prompts.",
      "catalog_summary": "Generates annotated dashboard/app wireframes from briefs or schemas; compresses weeks into hours.",
      "features": [
        {"title": "Natural Language → Wireframes", "description": "Generates wireframes for dashboards, apps, and portals from written briefs."},
        {"title": "Schema-aware Layouts", "description": "Suggests layouts based on the underlying data model or schema."},
        {"title": "Annotated Components", "description": "Includes UX rationale and interaction behaviour notes for components."},
        {"title": "Export & Handoff", "description": "Exports to image/PDF and developer-ready specification document formats."},
        {"title": "Iterative Refinement", "description": "Refines outputs through follow-up conversational prompts."}
      ],
      "impact": "Accelerates the design-to-development pipeline and reduces rework by aligning stakeholders faster with AI-generated visual briefs.",
      "metrics": [{"label": "Wireframing cycle time", "value": "Weeks → hours"}],
      "accent": "#EC4899",
      "icon": "layout"
    },
    {
      "id": "APP-13",
      "name": "AiCCTV",
      "domain": "Security",
      "category": "Vision Analytics",
      "tagline": "AI-Powered Surveillance and Vision Analytics Platform",
      "overview": "AiCCTV is a video surveillance and vision analytics platform that turns passive cameras into active security intelligence. It analyses live/recorded feeds to detect anomalies, unauthorised access, crowd density violations, safety hazards (falls, unattended objects, fire indicators), and behavioural patterns. It generates real-time alerts with video clip evidence and incident metadata, plus historical analytics and compliance reporting.",
      "catalog_summary": "Vision analytics for CCTV: real-time anomaly detection, alerts with evidence, and compliance reporting.",
      "features": [
        {"title": "Anomaly & Intrusion Detection", "description": "Real-time detection across multiple simultaneous camera feeds."},
        {"title": "Crowd & Zone Monitoring", "description": "Crowd density monitoring with zone-based restricted access alerting."},
        {"title": "Safety Hazard Detection", "description": "Detects falls, unattended objects, and fire indicators."},
        {"title": "Evidence-backed Alerting", "description": "Automated alert dispatch with video clip evidence and incident metadata."},
        {"title": "Incident Analytics & Reporting", "description": "Historical incident analytics, heatmaps, and compliance reporting."}
      ],
      "impact": "Enables proactive security operations and strengthens compliance/audit readiness with evidence-backed incident records.",
      "metrics": [],
      "accent": "#EF4444",
      "icon": "shield"
    },
    {
      "id": "APP-14",
      "name": "DataOne",
      "domain": "Data Engineering",
      "category": "AI Tooling",
      "tagline": "Unified AI Data Engineering Toolkit Across Fabric, Snowflake and Databricks",
      "overview": "DataOne is Systech’s unified AI data engineering platform spanning Microsoft Fabric, Snowflake, and Databricks. Using purpose-built MCP (Model Context Protocol) servers, it exposes platform capabilities to AI agents and automation workflows for natural language pipeline creation, cross-platform schema exploration, query execution, and data asset management—reducing context switching and integration boilerplate.",
      "catalog_summary": "Unified AI data engineering interface across Fabric, Snowflake & Databricks via MCP servers.",
      "features": [
        {"title": "MCP Servers for Major Platforms", "description": "Purpose-built MCP servers for Microsoft Fabric, Snowflake, and Databricks."},
        {"title": "Natural Language Pipelines", "description": "Creates pipelines and orchestrates transformations via natural language."},
        {"title": "Schema & Lineage Exploration", "description": "Cross-platform schema exploration and data lineage querying."},
        {"title": "AI-Driven Data Ops", "description": "AI agents automate data quality checks, monitoring, and alerting."},
        {"title": "No-code Orchestration Integration", "description": "Integrates with no-code workflow automation for pipeline orchestration."}
      ],
      "impact": "Reduces data engineering toil by enabling a unified, language-driven interface across three major data platforms and eliminating manual API wrangling.",
      "metrics": [{"label": "Platforms unified", "value": "Microsoft Fabric + Snowflake + Databricks"}],
      "accent": "#14B8A6",
      "icon": "database"
    },
    {
      "id": "APP-15",
      "name": "Chef",
      "domain": "Food & Beverage",
      "category": "AI Avatar",
      "tagline": "AI-Powered Video Avatar for Food and Beverage Experiences",
      "overview": "Chef is an AI video avatar for food and beverage experiences. A lifelike presenter provides personalised menu recommendations, ingredient explanations, allergen guidance, and step-by-step cooking walkthroughs via natural language conversation. It blends content and commerce with POS/e-commerce integration to enable in-conversation ordering and always-on digital engagement.",
      "catalog_summary": "AI video avatar for F&B: personalised menu help, cooking guidance, and POS/e-com ordering.",
      "features": [
        {"title": "Conversational Video Avatar", "description": "Lifelike AI avatar with natural, context-aware interaction."},
        {"title": "Personalised Recommendations", "description": "Dish/menu recommendations based on preferences and dietary restrictions."},
        {"title": "Guided Cooking Walkthroughs", "description": "Step-by-step cooking guidance with real-time Q&A."},
        {"title": "Allergen & Nutrition Support", "description": "Allergen information, nutrition breakdowns, and substitution guidance."},
        {"title": "Commerce Integration", "description": "POS and e-commerce integration for in-conversation ordering."}
      ],
      "impact": "Creates an always-on engagement channel for F&B brands by combining human-like presentation with scalable AI-driven personalisation.",
      "metrics": [{"label": "Availability", "value": "Always-on (24/7)"}],
      "accent": "#FB7185",
      "icon": "utensils"
    }
  ]
}


# -----------------------------
# Helpers
# -----------------------------
def hexc(h, alpha=1.0):
    h = h.strip().lstrip("#")
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0
    return colors.Color(r, g, b, alpha=alpha)


def clamp(v, a, b):
    return max(a, min(b, v))


def truncate_chars(s, n):
    s = (s or "").strip()
    if len(s) <= n:
        return s
    return s[: max(0, n - 1)].rstrip() + "…"


def wrap_lines(c, text, font_name, font_size, max_w):
    text = (text or "").replace("\n", " ").strip()
    if not text:
        return []
    c.setFont(font_name, font_size)
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = w if not cur else f"{cur} {w}"
        if c.stringWidth(test, font_name, font_size) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(c, text, x, y_top, max_w, font_name="Helvetica", font_size=10, color=colors.white, leading=None):
    # TEXT OPTIMIZATION: leading = 1.4 * font_size
    if leading is None:
        leading = 1.4 * font_size
    lines = wrap_lines(c, text, font_name, font_size, max_w)
    c.setFillColor(color)
    c.setFont(font_name, font_size)
    y = y_top
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y


def gradient_fill(c, x, y, w, h, top_hex, bottom_hex, steps=80):
    top = hexc(top_hex)
    bot = hexc(bottom_hex)
    steps = max(2, int(steps))
    for i in range(steps):
        t = i / (steps - 1)
        col = colors.Color(
            top.red * (1 - t) + bot.red * t,
            top.green * (1 - t) + bot.green * t,
            top.blue * (1 - t) + bot.blue * t,
            alpha=1.0
        )
        c.setFillColor(col)
        yy = y + (h * (1 - (i + 1) / steps))
        c.rect(x, yy, w, h / steps + 0.3, stroke=0, fill=1)


def rr(c, x, y, w, h, r=12, fill=1, stroke=0, stroke_color=None, fill_color=None, stroke_w=1, shadow=False):
    # RENDERER REFINEMENT: shadow boolean draws dark-transparent offset copy first.
    if shadow:
        c.saveState()
        c.setFillColor(colors.Color(0, 0, 0, alpha=0.22))
        c.setStrokeColor(colors.Color(0, 0, 0, alpha=0.0))
        # Subtle drop-shadow effect with 2pt offset
        c.roundRect(x + 2, y - 2, w, h, r, stroke=0, fill=1)
        c.restoreState()

    c.saveState()
    if fill_color is not None:
        c.setFillColor(fill_color)
    if stroke_color is not None:
        c.setStrokeColor(stroke_color)
    c.setLineWidth(stroke_w)
    c.roundRect(x, y, w, h, r, stroke=stroke, fill=fill)
    c.restoreState()


def hsep(c, x, y, w, color_hex="#2E3E55", alpha=1.0):
    # Brighter grey for depth
    c.saveState()
    c.setStrokeColor(hexc(color_hex, alpha))
    c.setLineWidth(1)
    c.line(x, y, x + w, y)
    c.restoreState()


def draw_pill(c, x, y, text, bg_hex, fg=colors.white, font_size=9, pad_x=10, h=18, r=9):
    w = c.stringWidth(text, "Helvetica-Bold", font_size) + pad_x * 2
    rr(c, x, y, w, h, r=r, fill=1, stroke=0, fill_color=hexc(bg_hex))
    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", font_size)
    c.drawString(x + pad_x, y + (h - font_size) / 2 + 1, text)
    return w


# -----------------------------
# Icons (vector)
# -----------------------------
def draw_icon(c, kind, cx, cy, size, fg=colors.white):
    c.saveState()
    c.setStrokeColor(fg)
    c.setFillColor(fg)
    c.setLineWidth(2)

    s = size
    x0 = cx - s / 2
    y0 = cy - s / 2

    if kind == "bank":
        # building with columns
        c.setLineWidth(1.8)
        c.polygon([x0, y0 + s * 0.78, cx, y0 + s, x0 + s, y0 + s * 0.78], stroke=1, fill=0)
        c.rect(x0 + s * 0.1, y0 + s * 0.18, s * 0.8, s * 0.55, stroke=1, fill=0)
        for i in range(4):
            xx = x0 + s * (0.18 + i * 0.18)
            c.line(xx, y0 + s * 0.20, xx, y0 + s * 0.70)
        c.line(x0 + s * 0.1, y0 + s * 0.18, x0 + s * 0.9, y0 + s * 0.18)
    elif kind == "leaf":
        c.setLineWidth(2)
        c.bezier(x0 + s*0.5, y0 + s*0.1, x0 + s*0.1, y0 + s*0.35, x0 + s*0.2, y0 + s*0.85, x0 + s*0.65, y0 + s*0.9)
        c.bezier(x0 + s*0.5, y0 + s*0.1, x0 + s*0.85, y0 + s*0.3, x0 + s*0.9, y0 + s*0.7, x0 + s*0.65, y0 + s*0.9)
        c.line(x0 + s*0.48, y0 + s*0.18, x0 + s*0.66, y0 + s*0.78)
    elif kind == "camera":
        c.setLineWidth(2)
        c.roundRect(x0 + s*0.12, y0 + s*0.28, s*0.76, s*0.48, 6, stroke=1, fill=0)
        c.circle(cx, y0 + s*0.52, s*0.16, stroke=1, fill=0)
        c.rect(x0 + s*0.22, y0 + s*0.72, s*0.18, s*0.12, stroke=1, fill=0)
    elif kind == "hotel":
        c.setLineWidth(2)
        c.rect(x0 + s*0.18, y0 + s*0.18, s*0.48, s*0.72, stroke=1, fill=0)
        c.rect(x0 + s*0.68, y0 + s*0.42, s*0.14, s*0.48, stroke=1, fill=0)
        for r in range(3):
            for col in range(2):
                c.rect(x0 + s*(0.24 + col*0.18), y0 + s*(0.72 - r*0.18), s*0.1, s*0.1, stroke=1, fill=0)
        c.rect(x0 + s*0.36, y0 + s*0.18, s*0.12, s*0.18, stroke=1, fill=0)
    elif kind == "users":
        c.setLineWidth(2)
        c.circle(cx - s*0.12, cy + s*0.12, s*0.14, stroke=1, fill=0)
        c.circle(cx + s*0.14, cy + s*0.10, s*0.12, stroke=1, fill=0)
        c.arc(cx - s*0.28, cy - s*0.22, cx + s*0.04, cy + s*0.04, 200, -20)
        c.arc(cx + s*0.02, cy - s*0.24, cx + s*0.34, cy + s*0.02, 200, -20)
    elif kind == "mic":
        c.setLineWidth(2)
        c.roundRect(cx - s*0.14, cy - s*0.06, s*0.28, s*0.40, 10, stroke=1, fill=0)
        c.line(cx, cy - s*0.06, cx, cy - s*0.22)
        c.arc(cx - s*0.22, cy - s*0.30, cx + s*0.22, cy - s*0.04, 200, -20)
    elif kind == "kanban":
        c.setLineWidth(2)
        c.roundRect(x0 + s*0.12, y0 + s*0.18, s*0.76, s*0.64, 8, stroke=1, fill=0)
        for i in range(2):
            xx = x0 + s*(0.12 + (i+1)*0.76/3)
            c.line(xx, y0 + s*0.18, xx, y0 + s*0.82)
        c.rect(x0 + s*0.18, y0 + s*0.64, s*0.16, s*0.10, stroke=1, fill=0)
        c.rect(x0 + s*0.44, y0 + s*0.56, s*0.16, s*0.18, stroke=1, fill=0)
        c.rect(x0 + s*0.70, y0 + s*0.60, s*0.12, s*0.14, stroke=1, fill=0)
    elif kind == "code":
        c.setLineWidth(2)
        # < />
        c.line(cx - s*0.26, cy, cx - s*0.08, cy + s*0.18)
        c.line(cx - s*0.26, cy, cx - s*0.08, cy - s*0.18)
        c.line(cx + s*0.26, cy, cx + s*0.08, cy + s*0.18)
        c.line(cx + s*0.26, cy, cx + s*0.08, cy - s*0.18)
        c.line(cx - s*0.02, cy - s*0.20, cx + s*0.02, cy + s*0.20)
    elif kind == "plane":
        c.setLineWidth(2)
        c.line(cx - s*0.36, cy, cx + s*0.36, cy)
        c.line(cx - s*0.08, cy, cx - s*0.24, cy + s*0.22)
        c.line(cx - s*0.08, cy, cx - s*0.24, cy - s*0.22)
        c.line(cx + s*0.10, cy, cx + s*0.22, cy + s*0.14)
        c.line(cx + s*0.10, cy, cx + s*0.22, cy - s*0.14)
        c.circle(cx + s*0.30, cy, s*0.04, stroke=1, fill=1)
    elif kind == "shopping-bag":
        c.setLineWidth(2)
        c.roundRect(x0 + s*0.20, y0 + s*0.22, s*0.60, s*0.60, 10, stroke=1, fill=0)
        c.arc(cx - s*0.16, y0 + s*0.66, cx + s*0.16, y0 + s*0.92, 0, 180)
        c.line(x0 + s*0.20, y0 + s*0.62, x0 + s*0.80, y0 + s*0.62)
    elif kind == "layout":
        c.setLineWidth(2)
        c.roundRect(x0 + s*0.12, y0 + s*0.18, s*0.76, s*0.64, 10, stroke=1, fill=0)
        c.line(x0 + s*0.12, y0 + s*0.58, x0 + s*0.88, y0 + s*0.58)
        c.line(x0 + s*0.46, y0 + s*0.18, x0 + s*0.46, y0 + s*0.58)
        c.rect(x0 + s*0.18, y0 + s*0.66, s*0.52, s*0.10, stroke=1, fill=0)
    elif kind == "shield":
        c.setLineWidth(2)
        p = [
            (cx, y0 + s*0.92),
            (x0 + s*0.22, y0 + s*0.78),
            (x0 + s*0.22, y0 + s*0.46),
            (cx, y0 + s*0.14),
            (x0 + s*0.78, y0 + s*0.46),
            (x0 + s*0.78, y0 + s*0.78),
        ]
        c.polygon([v for xy in p for v in xy], stroke=1, fill=0)
        c.line(cx, y0 + s*0.18, cx, y0 + s*0.86)
    elif kind == "database":
        c.setLineWidth(2)
        c.ellipse(x0 + s*0.18, y0 + s*0.72, x0 + s*0.82, y0 + s*0.92, stroke=1, fill=0)
        c.rect(x0 + s*0.18, y0 + s*0.30, s*0.64, s*0.46, stroke=1, fill=0)
        c.ellipse(x0 + s*0.18, y0 + s*0.22, x0 + s*0.82, y0 + s*0.42, stroke=1, fill=0)
        c.line(x0 + s*0.18, y0 + s*0.72, x0 + s*0.18, y0 + s*0.32)
        c.line(x0 + s*0.82, y0 + s*0.72, x0 + s*0.82, y0 + s*0.32)
    elif kind == "utensils":
        c.setLineWidth(2)
        # fork
        c.line(cx - s*0.18, y0 + s*0.18, cx - s*0.18, y0 + s*0.86)
        for i in range(3):
            c.line(cx - s*(0.24 - i*0.04), y0 + s*0.86, cx - s*(0.24 - i*0.04), y0 + s*0.72)
        # knife
        c.line(cx + s*0.14, y0 + s*0.18, cx + s*0.14, y0 + s*0.86)
        c.line(cx + s*0.14, y0 + s*0.86, cx + s*0.24, y0 + s*0.70)
    elif kind == "casino":
        c.setLineWidth(2)
        # card + chip
        c.roundRect(x0 + s*0.14, y0 + s*0.24, s*0.46, s*0.60, 8, stroke=1, fill=0)
        c.circle(x0 + s*0.72, y0 + s*0.52, s*0.18, stroke=1, fill=0)
        for a in range(0, 360, 60):
            rad = math.radians(a)
            c.line(x0 + s*0.72, y0 + s*0.52, x0 + s*0.72 + math.cos(rad)*s*0.18, y0 + s*0.52 + math.sin(rad)*s*0.18)
        # small diamond
        c.polygon([x0 + s*0.36, y0 + s*0.64, x0 + s*0.40, y0 + s*0.60, x0 + s*0.36, y0 + s*0.56, x0 + s*0.32, y0 + s*0.60], stroke=1, fill=0)
    else:
        # fallback: dot grid
        c.setLineWidth(1)
        for i in range(3):
            for j in range(3):
                c.circle(x0 + s*(0.25 + i*0.25), y0 + s*(0.25 + j*0.25), s*0.03, stroke=0, fill=1)

    c.restoreState()


# -----------------------------
# Layout / Theme
# -----------------------------
PAGE_W, PAGE_H = LETTER

M = 44  # margin
BG = hexc("#0B1220")
CARD = hexc("#101B2E")
CARD2 = hexc("#0E1729")
TEXT = hexc("#E7EEF9")
MUTED = hexc("#A8B6CC")
MUTED2 = hexc("#7E93B0")
LINE = hexc("#2E3E55")
NAV_GLASS_TOP = colors.Color(1, 1, 1, alpha=0.10)
NAV_GLASS_BOT = colors.Color(1, 1, 1, alpha=0.00)

HERO_TOP = "#080C14"      # stronger contrast
HERO_BOTTOM = "#152035"   # stronger contrast

CATALOG_CARD_H = 210

# breathing room: reduce max_w by 5-10pt inside cards
INNER_BREATH = 8


def draw_top_nav_glass(c, x, y, w, h):
    # Title gradient top overlay: "glass" effect using gradient_fill
    # We'll simulate with steps alpha blend by drawing translucent stripes.
    steps = 40
    for i in range(steps):
        t = i / (steps - 1)
        a = NAV_GLASS_TOP.alpha * (1 - t) + NAV_GLASS_BOT.alpha * t
        c.setFillColor(colors.Color(1, 1, 1, alpha=a))
        yy = y + h * (1 - (i + 1) / steps)
        c.rect(x, yy, w, h / steps + 0.5, stroke=0, fill=1)


def footer(c, page_num):
    c.saveState()
    c.setFillColor(hexc("#6F86A6"))
    c.setFont("Helvetica", 9)
    c.drawString(M, 18, f"Systech Analytics · Application Portfolio · {DATA['portfolio']['year']}")
    c.drawRightString(PAGE_W - M, 18, f"{page_num}")
    c.restoreState()


# -----------------------------
# Pages
# -----------------------------
def draw_hero_page(c):
    # Background gradient
    gradient_fill(c, 0, 0, PAGE_W, PAGE_H, HERO_TOP, HERO_BOTTOM, steps=120)

    # Top nav glass overlay band
    nav_h = 64
    draw_top_nav_glass(c, 0, PAGE_H - nav_h, PAGE_W, nav_h)
    hsep(c, M, PAGE_H - nav_h - 1, PAGE_W - 2*M, color_hex="#2E3E55", alpha=0.9)

    # Header text
    title = DATA["portfolio"]["title"]
    org = DATA["portfolio"]["organisation"]
    year = DATA["portfolio"]["year"]
    stats = DATA["portfolio"]["stats"]

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(M, PAGE_H - 40, org)
    c.setFont("Helvetica", 11)
    c.setFillColor(MUTED)
    c.drawString(M + c.stringWidth(org, "Helvetica-Bold", 13) + 10, PAGE_H - 40, f"· {year}")

    # Hero Title (upgrade to 36pt)
    hero_y = PAGE_H - 130
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(M, hero_y, title)

    # Hero underline accent (use a strong accent; pick Intelliframe accent as portfolio signature)
    hero_accent = hexc("#EC4899")
    underline_w = 260
    rr(c, M, hero_y - 14, underline_w, 6, r=3, fill=1, stroke=0, fill_color=hero_accent)

    # Subtitle
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 12)
    c.drawString(M, hero_y - 40, "A curated catalogue of AI, analytics, and automation applications across domains.")

    # Stats cards row
    cards_y = hero_y - 170
    card_h = 116
    gap = 14
    card_w = (PAGE_W - 2*M - 2*gap) / 3.0

    def stat_card(ix, label, value, accent_hex):
        x = M + ix * (card_w + gap)
        y = cards_y
        # drop-shadow
        rr(c, x, y, card_w, card_h, r=16, fill=1, stroke=1,
           fill_color=CARD, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)
        # accent stripe
        rr(c, x, y + card_h - 8, card_w, 8, r=6, fill=1, stroke=0, fill_color=hexc(accent_hex))
        # icon bubble (accent pop)
        bubble = 30
        rr(c, x + 16, y + card_h - 16 - bubble, bubble, bubble, r=10, fill=1, stroke=0, fill_color=hexc(accent_hex))
        draw_icon(c, "layout", x + 16 + bubble/2, y + card_h - 16 - bubble/2, 16, fg=colors.white)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(x + 16 + bubble + 10, y + card_h - 32, label)

        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(x + 16, y + 22, str(value))

    stat_card(0, "Applications", stats["applications_count"], "#0B5FFF")
    stat_card(1, "AI / LLM Powered", stats["ai_llm_powered_count"], "#7C3AED")
    stat_card(2, "Industries Covered", stats["industries_count"], "#16A34A")

    # Notable metrics panel
    panel_y = cards_y - 190
    panel_h = 170
    rr(c, M, panel_y, PAGE_W - 2*M, panel_h, r=18, fill=1, stroke=1,
       fill_color=CARD2, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)

    # Panel header with accent highlight
    header_accent = "#06B6D4"
    rr(c, M + 16, panel_y + panel_h - 36, 4, 20, r=2, fill=1, stroke=0, fill_color=hexc(header_accent))
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(M + 28, panel_y + panel_h - 32, "Notable Metrics")
    c.setFillColor(MUTED2)
    c.setFont("Helvetica", 10)
    c.drawRightString(PAGE_W - M - 16, panel_y + panel_h - 30, stats["confidentiality"])

    hsep(c, M + 16, panel_y + panel_h - 46, PAGE_W - 2*M - 32, color_hex="#2E3E55", alpha=0.9)

    # Metrics list (2 columns)
    left_x = M + 20
    right_x = M + (PAGE_W - 2*M)/2 + 10
    y = panel_y + panel_h - 70
    items = stats["notable_metrics"]
    for i, it in enumerate(items):
        col_x = left_x if i % 2 == 0 else right_x
        row_y = y - (i // 2) * 44
        # bullet accent
        rr(c, col_x, row_y + 10, 10, 10, r=3, fill=1, stroke=0, fill_color=hexc("#EC4899"))
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col_x + 16, row_y + 18, it["value"])
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9.5)
        c.drawString(col_x + 16, row_y + 4, it["label"])

    # CTA buttons (accent pop)
    btn_y = 72
    btn_h = 36
    btn_w = 190
    rr(c, M, btn_y, btn_w, btn_h, r=12, fill=1, stroke=0, fill_color=hexc("#EC4899"), shadow=True)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(M + 16, btn_y + 12, "Browse Applications")

    rr(c, M + btn_w + 12, btn_y, btn_w, btn_h, r=12, fill=1, stroke=1, fill_color=hexc("#0F1A2D"),
       stroke_color=hexc("#2E3E55"), shadow=True)
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(M + btn_w + 28, btn_y + 12, "View Detail Pages")


def draw_catalog_page(c, page_apps, page_num, total_pages):
    # Background
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Header band
    band_h = 64
    gradient_fill(c, 0, PAGE_H - band_h, PAGE_W, band_h, "#0A1020", "#0E1730", steps=50)
    draw_top_nav_glass(c, 0, PAGE_H - band_h, PAGE_W, band_h)
    hsep(c, M, PAGE_H - band_h - 1, PAGE_W - 2*M, color_hex="#2E3E55", alpha=0.9)

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(M, PAGE_H - 40, "Catalog")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawString(M + 86, PAGE_H - 38, "· Overview cards (fixed height)")

    c.setFillColor(MUTED2)
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - M, PAGE_H - 38, f"Page {page_num} / {total_pages}")

    # Grid: 2 columns x 3 rows = 6 cards per page
    cols = 2
    gap_x = 16
    gap_y = 16
    card_w = (PAGE_W - 2*M - gap_x) / 2.0
    card_h = CATALOG_CARD_H

    top_y = PAGE_H - band_h - 22
    x0 = M
    y_cursor = top_y

    for idx, app in enumerate(page_apps):
        col = idx % cols
        row = idx // cols

        x = x0 + col * (card_w + gap_x)
        y = y_cursor - (row + 1) * card_h - row * gap_y

        accent = app["accent"]

        # Card with shadow
        rr(c, x, y, card_w, card_h, r=16, fill=1, stroke=1,
           fill_color=CARD, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)

        # Accent sidebar highlight
        rr(c, x, y, 8, card_h, r=8, fill=1, stroke=0, fill_color=hexc(accent))

        # Icon badge (accent pop)
        badge = 34
        rr(c, x + 16, y + card_h - 16 - badge, badge, badge, r=12, fill=1, stroke=0, fill_color=hexc(accent))
        draw_icon(c, app.get("icon", "layout"), x + 16 + badge/2, y + card_h - 16 - badge/2, 18, fg=colors.white)

        # App name + ID
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(x + 16 + badge + 12, y + card_h - 30, app["name"])
        c.setFillColor(MUTED2)
        c.setFont("Helvetica", 9)
        c.drawString(x + 16 + badge + 12, y + card_h - 46, app["id"])

        # Category pill (accent)
        pill_text = app["category"]
        pill_w = c.stringWidth(pill_text, "Helvetica-Bold", 9) + 20
        pill_x = x + card_w - 16 - pill_w
        pill_y = y + card_h - 42
        draw_pill(c, pill_x, pill_y, pill_text, accent, fg=colors.white, font_size=9)

        # Domain line
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9.5)
        c.drawString(x + 16, y + card_h - 72, app["domain"])

        hsep(c, x + 16, y + card_h - 84, card_w - 32, color_hex="#2E3E55", alpha=0.85)

        # Tagline (Helvetica-Bold for punch)
        max_w = card_w - 32 - INNER_BREATH
        tagline = app.get("tagline", "")
        t_y = y + card_h - 104
        t_y2 = para(c, tagline, x + 16, t_y, max_w, font_name="Helvetica-Bold", font_size=10.5, color=TEXT)

        # Catalog summary (max 130 chars)
        summary = truncate_chars(app.get("catalog_summary", ""), 130)
        para(c, summary, x + 16, t_y2 - 8, max_w, font_name="Helvetica", font_size=9.6, color=MUTED)

        # Mini footer row
        # Action button (accent)
        btn_h = 26
        btn_w = 108
        btn_y = y + 16
        rr(c, x + 16, btn_y, btn_w, btn_h, r=10, fill=1, stroke=0, fill_color=hexc(accent))
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(x + 16 + 14, btn_y + 8, "Open Detail")

        # Right-aligned small hints
        c.setFillColor(MUTED2)
        c.setFont("Helvetica", 9)
        c.drawRightString(x + card_w - 16, btn_y + 8, "Wireframe-ready")

    # If fewer cards than full grid, keep clean whitespace.

    footer(c, page_num)


def draw_detail_page(c, app, page_num, total_pages):
    accent = app["accent"]

    # Background
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Top gradient header
    band_h = 92
    gradient_fill(c, 0, PAGE_H - band_h, PAGE_W, band_h, "#0A1020", "#132245", steps=70)
    draw_top_nav_glass(c, 0, PAGE_H - band_h, PAGE_W, band_h)
    hsep(c, M, PAGE_H - band_h - 1, PAGE_W - 2*M, color_hex="#2E3E55", alpha=0.9)

    # App heading with accent underline and icon badge
    badge = 42
    rr(c, M, PAGE_H - 66 - badge/2, badge, badge, r=14, fill=1, stroke=0, fill_color=hexc(accent), shadow=True)
    draw_icon(c, app.get("icon", "layout"), M + badge/2, PAGE_H - 66, 22, fg=colors.white)

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(M + badge + 14, PAGE_H - 56, app["name"])

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10.5)
    c.drawString(M + badge + 14, PAGE_H - 74, f"{app['id']}  ·  {app['domain']}  ·  {app['category']}")

    rr(c, M + badge + 14, PAGE_H - 82, 220, 5, r=3, fill=1, stroke=0, fill_color=hexc(accent))

    c.setFillColor(MUTED2)
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - M, PAGE_H - 56, f"Page {page_num} / {total_pages}")

    # Layout columns
    gutter = 16
    left_w = 260
    right_w = PAGE_W - 2*M - gutter - left_w
    left_x = M
    right_x = M + left_w + gutter
    top_y = PAGE_H - band_h - 18

    # Left: summary card
    card1_h = 250
    rr(c, left_x, top_y - card1_h, left_w, card1_h, r=16, fill=1, stroke=1,
       fill_color=CARD, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)
    rr(c, left_x, top_y - card1_h, 8, card1_h, r=8, fill=1, stroke=0, fill_color=hexc(accent))

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(left_x + 16, top_y - 28, "Tagline")
    hsep(c, left_x + 16, top_y - 40, left_w - 32, color_hex="#2E3E55", alpha=0.85)

    max_w_left = left_w - 32 - INNER_BREATH
    y_after = para(c, app.get("tagline", ""), left_x + 16, top_y - 62, max_w_left,
                   font_name="Helvetica-Bold", font_size=10.5, color=TEXT)

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(left_x + 16, y_after - 14, "Overview")
    hsep(c, left_x + 16, y_after - 26, left_w - 32, color_hex="#2E3E55", alpha=0.85)
    para(c, app.get("overview", ""), left_x + 16, y_after - 48, max_w_left,
         font_name="Helvetica", font_size=9.6, color=MUTED)

    # Left: impact + metrics
    card2_h = 270
    card2_y = top_y - card1_h - 16 - card2_h
    rr(c, left_x, card2_y, left_w, card2_h, r=16, fill=1, stroke=1,
       fill_color=CARD2, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(left_x + 16, card2_y + card2_h - 28, "Impact")
    rr(c, left_x + 16, card2_y + card2_h - 36, 30, 4, r=2, fill=1, stroke=0, fill_color=hexc(accent))
    hsep(c, left_x + 16, card2_y + card2_h - 46, left_w - 32, color_hex="#2E3E55", alpha=0.85)

    y_imp = para(c, app.get("impact", ""), left_x + 16, card2_y + card2_h - 70, max_w_left,
                 font_name="Helvetica", font_size=9.6, color=MUTED)

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(left_x + 16, y_imp - 14, "Key Metrics")
    hsep(c, left_x + 16, y_imp - 26, left_w - 32, color_hex="#2E3E55", alpha=0.85)

    metrics = app.get("metrics", []) or []
    y_m = y_imp - 50
    if not metrics:
        c.setFillColor(MUTED2)
        c.setFont("Helvetica", 9.6)
        c.drawString(left_x + 16, y_m, "No explicit metrics recorded for this application.")
    else:
        for mi, m in enumerate(metrics[:4]):
            by = y_m - mi * 40
            rr(c, left_x + 16, by - 8, 10, 10, r=3, fill=1, stroke=0, fill_color=hexc(accent))
            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(left_x + 32, by, m.get("value", ""))
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 9.5)
            c.drawString(left_x + 32, by - 14, m.get("label", ""))

    # Right: Features list card (taller)
    feat_h = (card1_h + 16 + card2_h)
    feat_y = top_y - feat_h
    rr(c, right_x, feat_y, right_w, feat_h, r=16, fill=1, stroke=1,
       fill_color=CARD, stroke_color=hexc("#1D2B43"), stroke_w=1, shadow=True)

    # Header strip
    rr(c, right_x, feat_y + feat_h - 8, right_w, 8, r=6, fill=1, stroke=0, fill_color=hexc(accent))
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(right_x + 16, feat_y + feat_h - 34, "Core Features")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9.5)
    c.drawString(right_x + 16, feat_y + feat_h - 50, "Structured capabilities for product and engineering alignment.")
    hsep(c, right_x + 16, feat_y + feat_h - 62, right_w - 32, color_hex="#2E3E55", alpha=0.85)

    # Feature items
    max_w_right = right_w - 32 - INNER_BREATH
    y_f = feat_y + feat_h - 86
    features = app.get("features", []) or []
    for i, f in enumerate(features[:8]):
        # row block height heuristic
        rr(c, right_x + 16, y_f - 28, 10, 10, r=3, fill=1, stroke=0, fill_color=hexc(accent))
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(right_x + 32, y_f - 20, f.get("title", ""))
        y_desc_end = para(c, f.get("description", ""), right_x + 32, y_f - 36, max_w_right - 16,
                          font_name="Helvetica", font_size=9.4, color=MUTED)
        y_f = y_desc_end - 18
        if y_f < feat_y + 30:
            break

    # Bottom action bar
    bar_h = 56
    rr(c, M, 34, PAGE_W - 2*M, bar_h, r=16, fill=1, stroke=1,
       fill_color=hexc("#0E1729"), stroke_color=hexc("#1D2B43"), shadow=True)

    # Accent button
    rr(c, M + 16, 34 + 14, 150, 28, r=11, fill=1, stroke=0, fill_color=hexc(accent))
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(M + 16 + 14, 34 + 22, "Request Demo")

    # Secondary button
    rr(c, M + 16 + 160, 34 + 14, 170, 28, r=11, fill=1, stroke=1,
       fill_color=hexc("#0B1220"), stroke_color=hexc("#2E3E55"))
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(M + 16 + 160 + 14, 34 + 22, "Add to Roadmap")

    c.setFillColor(MUTED2)
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - M - 16, 34 + 22, "Confidential · Internal use only")

    footer(c, page_num)


# -----------------------------
# Document builder
# -----------------------------
def build_pdf(output_path):
    c = canvas.Canvas(output_path, pagesize=LETTER)
    c.setTitle(f"{DATA['portfolio']['title']} · {DATA['portfolio']['organisation']}")

    # Page 1: Hero
    draw_hero_page(c)
    footer(c, 1)
    c.showPage()

    # Catalog pages
    apps = DATA["applications"]
    per_catalog_page = 6
    catalog_pages = math.ceil(len(apps) / per_catalog_page)

    # Detail pages (one per app)
    detail_pages = len(apps)

    total_pages = 1 + catalog_pages + detail_pages

    # Catalog
    for p in range(catalog_pages):
        page_num = 2 + p
        chunk = apps[p*per_catalog_page:(p+1)*per_catalog_page]
        draw_catalog_page(c, chunk, page_num, total_pages)
        c.showPage()

    # Details
    for i, app in enumerate(apps):
        page_num = 2 + catalog_pages + i
        draw_detail_page(c, app, page_num, total_pages)
        c.showPage()

    c.save()


def main():
    ap = argparse.ArgumentParser(description="Generate Application Portfolio wireframes (PDF) via ReportLab.")
    ap.add_argument("--output", required=True, help="Output PDF file path")
    args = ap.parse_args()
    build_pdf(args.output)


if __name__ == "__main__":
    main()