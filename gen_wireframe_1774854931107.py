#!/usr/bin/env python3
# IntelliFrame DESIGN ENGINE (v2.0 - ReportLab Master)
# Multi-page wireframes: HERO (p1), CATALOG (p2), DETAIL (p3+)
# Premium Design System: strict spacing, golden ratio layout, no overlaps.

import argparse
import json
import math
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

# ──────────────────────────────────────────────────────────────────────────────
# Input JSON (STRICT) embedded for single-script execution
# ──────────────────────────────────────────────────────────────────────────────
DATA_JSON = r'''
{
  "portfolio": {
    "title": "Systech Analytics — Application Portfolio",
    "organisation": "Systech Analytics",
    "year": "2026",
    "confidential": true,
    "stats": {
      "totalApps": "15",
      "domains": "5+ Industries",
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
      "tagline": "AI-powered promotional coupon engine generating hyper-personalised casino offers.",
      "overview": "Maverick is a personalised incentive generation platform for gaming and casinos. It analyses player behaviour, spending history, game preferences, and visit frequency to craft hyper-personalised offers (e.g., free spins, dining credits, VIP upgrades). AI-driven campaigns adapt in real time to maximise engagement and lifetime value.",
      "features": [
        { "title": "Player segmentation", "description": "Segments players by lifetime value, churn risk, and play patterns." },
        { "title": "Automated coupon generation", "description": "Generates offers with configurable reward rules and expiry logic." },
        { "title": "Real-time offer delivery", "description": "Delivers offers via SMS, app notifications, and kiosk displays." },
        { "title": "Campaign analytics & A/B testing", "description": "Tracks performance and supports controlled experimentation." },
        { "title": "POS & loyalty integration", "description": "Integrates with casino POS and loyalty management systems." }
      ],
      "impact": "Increases promotional ROI and player retention by delivering the right offer to the right player at the right moment.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "02",
      "name": "TRBank",
      "domain": "Banking",
      "category": "Data Processing",
      "tagline": "Transforms unstructured banking documents into validated structured datasets.",
      "overview": "TRBank is an intelligent document processing platform for financial institutions. It ingests unstructured documents (statements, loan applications, KYC forms, remittance slips, correspondence) and outputs clean, validated structured data for analytics, compliance reporting, and core banking ingestion.",
      "features": [
        { "title": "Multi-format ingestion", "description": "Supports PDFs, scanned images, and handwritten forms." },
        { "title": "Entity extraction", "description": "Extracts account numbers, dates, amounts, and counterparties." },
        { "title": "Validation rules engine", "description": "Flags anomalies, duplicates, and missing fields." },
        { "title": "Structured outputs", "description": "Exports JSON/CSV and supports direct database writes." },
        { "title": "Auditability", "description": "Provides audit trail and confidence scoring per extracted field." }
      ],
      "impact": "Reduces processing time from hours to minutes per batch while improving accuracy and compliance readiness.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "03",
      "name": "Sustainability",
      "domain": "ESG",
      "category": "Emission Analytics",
      "tagline": "End-to-end ESG intelligence and carbon emission calculation across Scopes 1–3.",
      "overview": "Sustainability is an end-to-end ESG intelligence tool that ingests utility bills, fuel logs, travel records, and supply chain data to calculate emissions across Scope 1, 2, and 3. It generates audit-ready reports aligned with GHG Protocol and GRI, and provides predictive analytics for net-zero planning and reduction scenario modelling.",
      "features": [
        { "title": "Automated bill parsing", "description": "Parses utility bills and maps emission factors intelligently." },
        { "title": "Scope 1–3 carbon accounting", "description": "Calculates emissions aligned with the GHG Protocol." },
        { "title": "AI-generated ESG narratives", "description": "Creates board/regulatory-ready narrative reporting." },
        { "title": "Benchmarking dashboards", "description": "Provides peer benchmarking and target-gap analysis." },
        { "title": "Scenario modelling", "description": "Models reduction roadmaps and net-zero pathways." }
      ],
      "impact": "Shrinks ESG reporting from weeks of manual work to automated, audit-ready output in minutes.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "04",
      "name": "Ecovision",
      "domain": "ESG",
      "category": "Vision AI",
      "tagline": "Computer-vision sustainability auditing using CCTV for continuous compliance.",
      "overview": "Ecovision turns existing CCTV into a continuous compliance monitoring system. It analyses live and recorded facility video to detect energy waste, improper waste disposal, safety non-compliance, and resource misuse. Each event is logged with a clip, timestamp, severity rating, and AI-generated corrective action recommendations.",
      "features": [
        { "title": "Real-time video monitoring", "description": "Detects sustainability and compliance events across facilities." },
        { "title": "Automated incident logging", "description": "Captures clips, timestamps, and severity classifications." },
        { "title": "Corrective action guidance", "description": "Generates AI recommendations per detected incident." },
        { "title": "Compliance scoring", "description": "Dashboards with historical trends for governance reporting." },
        { "title": "Platform integration", "description": "Integrates with the Sustainability platform for unified ESG reporting." }
      ],
      "impact": "Converts periodic manual walkthroughs into an always-on, evidence-driven audit trail for regulators and internal teams.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "05",
      "name": "Hotel Concierge",
      "domain": "Hospitality",
      "category": "AI Agent",
      "tagline": "Conversational AI avatar that manages hotel bookings and amenity reservations.",
      "overview": "Hotel Concierge is a conversational AI agent with a lifelike avatar interface for end-to-end hotel booking and guest services. Guests can search rooms, check availability, book/modify/cancel stays, and reserve amenities (dining, spa, activities). It maintains multi-turn context and integrates with hotel PMS/channel managers for real-time pricing and availability.",
      "features": [
        { "title": "Room booking workflows", "description": "Handles search, booking, modification, and cancellation in natural language." },
        { "title": "Amenity reservations", "description": "Books dining, spa, pool, gym, and activities." },
        { "title": "Conversational memory", "description": "Maintains context and tracks guest preferences across turns." },
        { "title": "AI avatar interface", "description": "Provides an immersive, human-like self-service experience." },
        { "title": "PMS integration", "description": "Connects to PMS and channel managers for live availability and pricing." }
      ],
      "impact": "Reduces front-desk workload and call volumes while increasing ancillary revenue via 24/7 self-service.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "06",
      "name": "VetAI",
      "domain": "HR Tech",
      "category": "AI Screening",
      "tagline": "Automates candidate screening with AI-led interviews and structured hiring reports.",
      "overview": "VetAI automates recruitment from job posting to hiring decision. It conducts AI-powered live video interviews, evaluates communication, technical accuracy, and behavioural competencies in real time, and produces structured recruiter reports. Proctoring and silence/anomaly detection support interview integrity, and role templates enable rapid setup across job types.",
      "features": [
        { "title": "AI-led video interviews", "description": "Runs live interviews with contextual follow-up questions." },
        { "title": "Integrity & proctoring", "description": "Detects anomalies and provides interview integrity scoring." },
        { "title": "Multi-dimensional evaluation", "description": "Assesses technical, behavioural, and communication competencies." },
        { "title": "Structured hiring reports", "description": "Generates role-fit scores, rankings, and summaries for recruiters." },
        { "title": "Pipeline management", "description": "Dashboard for candidate tracking and recruitment analytics." }
      ],
      "impact": "Cuts time-to-screen by up to 70%, enabling recruiters to focus on final-stage evaluation at scale.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" },
        { "label": "Time-to-screen reduction", "value": "Up to 70%" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "07",
      "name": "Resonance",
      "domain": "L&D",
      "category": "Communication AI",
      "tagline": "AI communication coaching with speech analysis and actionable feedback loops.",
      "overview": "Resonance is an AI communication coaching platform for professional upskilling. Using speech analysis and LLM-based evaluation, it scores tone, clarity, pacing, filler words, and persuasive impact during practice and real conversations. It delivers personalised feedback and exercises, tracking progress over time for individuals and cohorts.",
      "features": [
        { "title": "Real-time speech analysis", "description": "Evaluates tone, pace, clarity, and filler word frequency." },
        { "title": "Actionable feedback reports", "description": "Generates specific improvement suggestions after sessions." },
        { "title": "Scenario practice", "description": "Supports presentations, negotiations, and interview simulations." },
        { "title": "Progress tracking", "description": "Visualises skill development across sessions over time." },
        { "title": "Team analytics", "description": "Provides cohort insights for L&D managers." }
      ],
      "impact": "Improves organisational communication quality, reducing meeting inefficiencies and strengthening stakeholder engagement.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "08",
      "name": "Orbit",
      "domain": "Internal Tool",
      "category": "Project Management",
      "tagline": "Internal project and ticket tracking system replacing spreadsheets and email.",
      "overview": "Orbit is Systech’s internal project management and ticket tracking platform. It centralises task creation, assignment, status tracking, and milestone management across projects and client engagements. Built to replace spreadsheets and email threads, it provides leadership with real-time visibility into delivery health, resource allocation, and sprint progress.",
      "features": [
        { "title": "Project & sprint planning", "description": "Creates projects/sprints with milestones, deadlines, and priorities." },
        { "title": "Ticket lifecycle management", "description": "Tracks tickets from backlog to completion sign-off." },
        { "title": "Workload visibility", "description": "Shows assignments and individual capacity across projects." },
        { "title": "Search and filtering", "description": "Filters by status/priority and supports global search." },
        { "title": "Collaboration feed", "description": "Per-ticket activity feeds and comment threads for async work." }
      ],
      "impact": "Provides a single source of truth for delivery operations with structured, searchable collaboration.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "09",
      "name": "SysRank",
      "domain": "Internal Tool",
      "category": "Technical Assessment",
      "tagline": "Proprietary coding and data skills assessment platform for hiring and benchmarking.",
      "overview": "SysRank is Systech’s internal equivalent of HackerRank for evaluating technical talent via coding challenges, SQL assessments, data engineering problems, and timed problem sets. Used in hiring and internal benchmarking, it manages question banks by domain, difficulty, and technology track and provides detailed scoring analytics.",
      "features": [
        { "title": "Timed assessments", "description": "Runs coding/SQL/data engineering challenges under time constraints." },
        { "title": "Auto-grading", "description": "Executes test cases with partial scoring and breakdowns." },
        { "title": "Proctoring controls", "description": "Candidate portal with integrity and proctoring features." },
        { "title": "Question bank management", "description": "Organises questions by domain, difficulty, and technology track." },
        { "title": "Results analytics", "description": "Leaderboards, score history, and skill heatmaps." }
      ],
      "impact": "Standardises objective talent evaluation for hiring and internal capability benchmarking.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "10",
      "name": "AeroIntel",
      "domain": "Aviation",
      "category": "RAG · Conversational AI",
      "tagline": "RAG assistant for CCR technicians to retrieve procedures, manuals, and fault history.",
      "overview": "AeroIntel is a retrieval-augmented generation (RAG) assistant for airport Common Communication Room (CCR) technicians. It supports natural language queries over a hybrid knowledge base of structured operational databases and unstructured technical documents, surfacing procedures, manuals, fault histories, and protocols quickly during live incidents.",
      "features": [
        { "title": "Hybrid RAG search", "description": "Combines structured database querying with document retrieval." },
        { "title": "Multi-turn conversation", "description": "Context-aware chat interface for iterative troubleshooting." },
        { "title": "Guided procedure retrieval", "description": "Returns step-by-step maintenance and resolution instructions." },
        { "title": "Fault history matching", "description": "Finds similar incidents and patterns to speed diagnosis." },
        { "title": "Agentic orchestration", "description": "Synthesises answers across multiple sources for complex queries." }
      ],
      "impact": "Reduces time-to-resolution for technical faults by providing instant access to critical knowledge during incidents.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "11",
      "name": "SysMart",
      "domain": "Retail",
      "category": "AI Chatbot",
      "tagline": "Retail ops chatbot combining live SQL querying with RAG and Freshchat deployment.",
      "overview": "SysMart is a conversational AI platform for retail operations built on Databricks AI serving endpoints. It answers customer and internal ops questions using live SQL queries over inventory/order databases plus RAG over catalogues, return policies, and FAQs. Freshchat integration enables in-channel deployment with intelligent escalation to human agents.",
      "features": [
        { "title": "Live database Q&A", "description": "Runs natural language queries against inventory and order systems." },
        { "title": "RAG knowledge base", "description": "Retrieves from catalogues, return policies, and operational FAQs." },
        { "title": "Freshchat integration", "description": "Deploys directly into existing customer support channels." },
        { "title": "Human handoff", "description": "Escalates complex queries with smooth agent transfer." },
        { "title": "Usage analytics", "description": "Tracks query categories and performance for continuous improvement." }
      ],
      "impact": "Reduces support ticket volume by automating routine product, order, and policy queries.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "12",
      "name": "Intelliframe",
      "domain": "Design",
      "category": "Generative AI",
      "tagline": "Generates annotated dashboard and app wireframes from natural language briefs.",
      "overview": "Intelliframe generates annotated dashboard and application wireframes from natural language briefs or data schemas. PMs and analysts describe metrics, user journeys, and layout preferences; Intelliframe produces structured mockups with component annotations, layout logic, and data-binding suggestions, exportable for developer handoff and iterative refinement via follow-up prompts.",
      "features": [
        { "title": "Natural language to wireframe", "description": "Creates layouts for dashboards, apps, and portals from prompts." },
        { "title": "Schema-aware suggestions", "description": "Recommends layouts based on the underlying data model." },
        { "title": "Annotated components", "description": "Adds UX rationale and interaction behaviour notes." },
        { "title": "Export formats", "description": "Exports to image, PDF, and developer-ready spec documents." },
        { "title": "Iterative refinement", "description": "Improves designs through conversational follow-up prompts." }
      ],
      "impact": "Compresses wireframing and design iteration from weeks to hours, reducing rework and misalignment.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "13",
      "name": "CCTV (AiCCTV)",
      "domain": "Security",
      "category": "Vision Analytics",
      "tagline": "AI vision analytics for surveillance: anomalies, intrusions, safety hazards, and alerts.",
      "overview": "AiCCTV transforms passive camera infrastructure into an active security intelligence layer. It analyses live and recorded video to detect anomalies, unauthorised access, crowd density violations, safety hazards, and behavioural patterns. It generates real-time alerts with clip evidence and incident metadata, plus historical analytics and compliance reporting.",
      "features": [
        { "title": "Anomaly & intrusion detection", "description": "Monitors multiple camera feeds for suspicious activity and access violations." },
        { "title": "Crowd & zone monitoring", "description": "Tracks crowd density and restricted-zone breaches." },
        { "title": "Safety hazard detection", "description": "Detects falls, unattended objects, and fire indicators." },
        { "title": "Evidence-backed alerts", "description": "Dispatches alerts with video clips and rich incident metadata." },
        { "title": "Incident analytics", "description": "Provides heatmaps, trends, and compliance reporting over history." }
      ],
      "impact": "Enables proactive security operations, reducing response times and improving compliance auditability with evidence-backed records.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "14",
      "name": "DataOne",
      "domain": "Data Engineering",
      "category": "AI Tooling",
      "tagline": "Unified AI data engineering toolkit across Fabric, Snowflake, and Databricks via MCP.",
      "overview": "DataOne unifies Microsoft Fabric, Snowflake, and Databricks under a single AI-driven interface. Using purpose-built MCP (Model Context Protocol) servers, it enables natural language pipeline creation, schema exploration, query execution, and data asset management, supporting AI agents and automation workflows without switching consoles or writing boilerplate integration code.",
      "features": [
        { "title": "MCP platform connectors", "description": "Purpose-built MCP servers for Fabric, Snowflake, and Databricks." },
        { "title": "Natural language pipelines", "description": "Creates and orchestrates transformations through language-driven commands." },
        { "title": "Cross-platform discovery", "description": "Explores schemas and queries data lineage across platforms." },
        { "title": "AI agent integration", "description": "Automates data quality checks, monitoring, and alerting." },
        { "title": "No-code orchestration", "description": "Integrates with workflow automation for pipeline orchestration." }
      ],
      "impact": "Reduces data engineering toil by eliminating context-switching and manual API wrangling across major data platforms.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    },
    {
      "id": "15",
      "name": "Chef",
      "domain": "AI Avatar",
      "category": "Food and Beverage",
      "tagline": "Lifelike AI video avatar for menu guidance, cooking walkthroughs, and ordering.",
      "overview": "Chef is an AI video avatar for food and beverage experiences. A lifelike presenter provides personalised menu recommendations, ingredient and allergen guidance, nutritional breakdowns, and step-by-step cooking walkthroughs via natural language conversation. It blends engagement with commerce through POS and e-commerce integrations for in-conversation ordering.",
      "features": [
        { "title": "Conversational video avatar", "description": "Natural, context-aware dialogue through a lifelike AI presenter." },
        { "title": "Personalised recommendations", "description": "Suggests dishes based on preferences and dietary restrictions." },
        { "title": "Guided cooking support", "description": "Step-by-step walkthroughs with real-time Q&A." },
        { "title": "Allergen & nutrition guidance", "description": "Provides allergen details, nutrition info, and substitutions." },
        { "title": "Commerce integration", "description": "Integrates with POS/e-commerce for ordering within the conversation." }
      ],
      "impact": "Creates an always-on, scalable digital engagement channel that combines human-like warmth with consistent AI-driven personalisation.",
      "metrics": [
        { "label": "Coverage", "value": "Full" },
        { "label": "Status", "value": "Live" },
        { "label": "Version", "value": "v1.0" }
      ],
      "accent": "#6B7280",
      "icon": "◆"
    }
  ]
}
'''

# ──────────────────────────────────────────────────────────────────────────────
# Renderer Utilities (MUST DEFINE)
# ──────────────────────────────────────────────────────────────────────────────

def clean_txt(t):
    if t is None:
        return ""
    if not isinstance(t, str):
        t = str(t)
    return re.sub(r'<[^>]*>', '', t)

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def _hex(c):
    try:
        return HexColor(c)
    except Exception:
        return HexColor("#FFFFFF")

def gradient_fill(c, x, y, w, h, c1, c2, steps=24):
    # Vertical gradient using thin rect bands (subtle, luxury depth)
    steps = int(_clamp(steps, 8, 80))
    c1 = _hex(c1)
    c2 = _hex(c2)

    def interp(a, b, t):
        return a + (b - a) * t

    for i in range(steps):
        t = i / float(steps - 1)
        r = interp(c1.red, c2.red, t)
        g = interp(c1.green, c2.green, t)
        b = interp(c1.blue, c2.blue, t)
        c.setFillColorRGB(r, g, b)
        band_h = h / steps
        c.rect(x, y + i * band_h, w, band_h + 0.25, stroke=0, fill=1)

def rr(c, x, y, w, h, r=12, fill="#0F172A", stroke="#1F2A44", sw=1):
    # Rounded rect with subtle depth: base + highlight line
    c.saveState()
    c.setLineWidth(sw)
    c.setStrokeColor(_hex(stroke))
    c.setFillColor(_hex(fill))
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)

    # Subtle top highlight
    c.setStrokeColor(_hex("#16213A"))
    c.setLineWidth(0.75)
    c.line(x + r, y + h - 0.75, x + w - r, y + h - 0.75)

    c.restoreState()

def _wrap_lines(text, font, size, max_w):
    # Greedy wrapping by words; respects existing newlines as hard breaks.
    text = clean_txt(text).replace("\r\n", "\n").replace("\r", "\n")
    hard = text.split("\n")
    lines = []
    for chunk in hard:
        words = chunk.split()
        if not words:
            lines.append("")
            continue
        cur = words[0]
        for w in words[1:]:
            trial = cur + " " + w
            if stringWidth(trial, font, size) <= max_w:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
    return lines

def para(c, text, x, y, w, max_h, font="Helvetica", size=12, color="#E5E7EB",
         leading=None, align="left"):
    """
    Draw wrapped paragraph starting from top at y (top baseline reference).
    Returns height_consumed.
    """
    text = clean_txt(text)
    if leading is None:
        leading = size * 1.5

    lines = _wrap_lines(text, font, size, w)
    max_lines = int(max_h // leading) if max_h > 0 else len(lines)
    lines = lines[:max(0, max_lines)]

    c.saveState()
    c.setFont(font, size)
    c.setFillColor(_hex(color))

    y_cursor = y
    for ln in lines:
        if align == "center":
            tx = x + (w - stringWidth(ln, font, size)) / 2.0
        elif align == "right":
            tx = x + (w - stringWidth(ln, font, size))
        else:
            tx = x
        c.drawString(tx, y_cursor - size, ln)
        y_cursor -= leading

    c.restoreState()
    consumed = len(lines) * leading
    return consumed

def label_pill(c, x, y, text, bg="#16213A", fg="#E5E7EB",
               font_size=10, padding_x=10, h=20):
    text = clean_txt(text)
    r = h / 2.0
    font = "Helvetica-Bold"
    tw = stringWidth(text, font, font_size)
    w = tw + 2 * padding_x
    rr(c, x, y, w, h, r=r, fill=bg, stroke=bg, sw=1)
    c.saveState()
    c.setFont(font, font_size)
    c.setFillColor(_hex(fg))
    c.drawString(x + padding_x, y + (h - font_size) / 2.0 + 1, text)
    c.restoreState()
    return w

# ──────────────────────────────────────────────────────────────────────────────
# Design System
# ──────────────────────────────────────────────────────────────────────────────

BASE = "#080C14"      # 60%
SURFACE = "#0F172A"   # 30%
ACCENT = "#2563EB"    # 10% (no purple)
TEXT = "#E5E7EB"
MUTED = "#9CA3AF"
BORDER = "#1F2A44"

GRID = 8
MARGIN_L = 48
MARGIN_R = 48
MARGIN_B = 48
MARGIN_T = 48

PHI = 1.618
PAGE_W, PAGE_H = letter

def _snap8(v):
    return int(round(v / 8.0)) * 8

def draw_page_bg(c):
    # Luxury depth background
    gradient_fill(c, 0, 0, PAGE_W, PAGE_H, BASE, SURFACE, steps=28)

def draw_header_footer(c, title_left, page_label):
    # Minimal header line and footer paging (restraint)
    c.saveState()
    c.setStrokeColor(_hex("#101A33"))
    c.setLineWidth(1)
    c.line(MARGIN_L, PAGE_H - 32, PAGE_W - MARGIN_R, PAGE_H - 32)

    c.setFont("Helvetica", 9)
    c.setFillColor(_hex(MUTED))
    c.drawString(MARGIN_L, PAGE_H - 24, clean_txt(title_left))

    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - MARGIN_R, 24, clean_txt(page_label))
    c.restoreState()

# ──────────────────────────────────────────────────────────────────────────────
# Page Templates
# ──────────────────────────────────────────────────────────────────────────────

def page_hero(c, portfolio):
    c.saveState()
    draw_page_bg(c)

    # Safe zone starting Y: 780 (top reference for hero content)
    safe_top = 780

    # Left: 62% content, right: 38% stats. Stat X starts at 380.
    title_x = MARGIN_L
    title_y_top = safe_top
    title_w = 350  # constraint: never overwrite stats; fixed max width

    stats_x = 380
    stats_w = PAGE_W - stats_x - MARGIN_R

    # Top pills row (org, year, confidential)
    pill_y = safe_top - 28
    px = title_x
    px += label_pill(c, px, pill_y, clean_txt(portfolio.get("organisation", "")),
                     bg="#0B1224", fg=TEXT, font_size=10, padding_x=12, h=22) + 8
    px += label_pill(c, px, pill_y, clean_txt(portfolio.get("year", "")),
                     bg="#0B1224", fg=TEXT, font_size=10, padding_x=12, h=22) + 8
    if bool(portfolio.get("confidential", False)):
        label_pill(c, px, pill_y, "CONFIDENTIAL",
                   bg=ACCENT, fg="#FFFFFF", font_size=10, padding_x=12, h=22)

    # Title (size 42, bold, wrapped)
    title = clean_txt(portfolio.get("title", ""))
    # Compute max height so it stays above bottom; avoid overlap with pills spacing
    title_top_text_y = safe_top - 56
    _ = para(c, title, title_x, title_top_text_y, title_w, max_h=320,
             font="Helvetica-Bold", size=42, color=TEXT, leading=42 * 1.15, align="left")

    # Subline / descriptor
    sub = "Curated catalogue of production-grade applications across domains."
    para(c, sub, title_x, title_top_text_y - 140, title_w, max_h=96,
         font="Helvetica", size=12, color=MUTED, leading=12 * 1.5, align="left")

    # Right: 4 stat cards (2x2)
    stats = portfolio.get("stats", {}) or {}
    stat_items = [
        ("Total apps", stats.get("totalApps", "")),
        ("Domains", stats.get("domains", "")),
        ("AI / LLM", stats.get("aiPowered", "")),
        ("Build tenure", stats.get("buildTenure", "")),
    ]
    # Card grid
    gap = 16
    card_h = 104
    card_w = (stats_w - gap) / 2.0
    row1_y = safe_top - 88
    row2_y = row1_y - (card_h + gap)

    for i, (k, v) in enumerate(stat_items):
        col = i % 2
        row = i // 2
        x = stats_x + col * (card_w + gap)
        y = (row1_y if row == 0 else row2_y) - card_h
        rr(c, x, y, card_w, card_h, r=16, fill="#0B1224", stroke=BORDER, sw=1)

        # Accent strip
        c.saveState()
        c.setFillColor(_hex(ACCENT))
        c.rect(x, y + card_h - 6, card_w, 6, stroke=0, fill=1)
        c.restoreState()

        # Label + value
        para(c, clean_txt(k).upper(), x + 16, y + card_h - 20, card_w - 32, max_h=24,
             font="Helvetica", size=9, color=MUTED, leading=9 * 1.5, align="left")
        para(c, clean_txt(v), x + 16, y + card_h - 50, card_w - 32, max_h=60,
             font="Helvetica-Bold", size=18, color=TEXT, leading=18 * 1.2, align="left")

    # Lower hero band: preview chips
    band_y = 160
    rr(c, MARGIN_L, band_y, PAGE_W - MARGIN_L - MARGIN_R, 92, r=20, fill=SURFACE, stroke=BORDER, sw=1)
    para(c, "Highlights", MARGIN_L + 20, band_y + 72, 200, 24, "Helvetica-Bold", 12, TEXT, 12 * 1.5, "left")
    para(c, "AI generation · Vision analytics · RAG assistants · Internal tools · ESG intelligence",
         MARGIN_L + 20, band_y + 46, PAGE_W - MARGIN_L - MARGIN_R - 40, 48,
         "Helvetica", 11, MUTED, 11 * 1.5, "left")

    draw_header_footer(c, portfolio.get("organisation", "Systech"), "Page 1 — Overview")
    c.restoreState()

def _draw_catalog_card(c, x, y, w, h, app):
    # Card container
    rr(c, x, y, w, h, r=18, fill="#0B1224", stroke=BORDER, sw=1)

    # Top row: icon + name + id
    icon = clean_txt(app.get("icon", "◆"))
    name = clean_txt(app.get("name", ""))
    app_id = clean_txt(app.get("id", ""))

    # Accent dot/strip
    c.saveState()
    c.setFillColor(_hex(ACCENT))
    c.circle(x + 20, y + h - 22, 5, stroke=0, fill=1)
    c.restoreState()

    c.saveState()
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(_hex(TEXT))
    c.drawString(x + 34, y + h - 28, f"{app_id}. {name}")
    c.restoreState()

    # Pills: domain + category
    pill_y = y + h - 56
    px = x + 16
    px += label_pill(c, px, pill_y, clean_txt(app.get("domain", "")),
                     bg=SURFACE, fg=TEXT, font_size=9, padding_x=10, h=20) + 8
    label_pill(c, px, pill_y, clean_txt(app.get("category", "")),
               bg="#0E1A36", fg="#C7D2FE", font_size=9, padding_x=10, h=20)

    # Tagline
    tagline = clean_txt(app.get("tagline", ""))
    para(c, tagline, x + 16, y + h - 84, w - 32, max_h=40,
         font="Helvetica", size=10.5, color=MUTED, leading=10.5 * 1.5, align="left")

    # Divider
    c.saveState()
    c.setStrokeColor(_hex("#122040"))
    c.setLineWidth(1)
    c.line(x + 16, y + 56, x + w - 16, y + 56)
    c.restoreState()

    # Impact microcopy
    impact = clean_txt(app.get("impact", ""))
    para(c, "Impact", x + 16, y + 46, w - 32, max_h=16,
         font="Helvetica-Bold", size=9.5, color=TEXT, leading=9.5 * 1.2, align="left")
    para(c, impact, x + 16, y + 34, w - 32, max_h=44,
         font="Helvetica", size=9.5, color=MUTED, leading=9.5 * 1.5, align="left")

def page_catalog(c, portfolio, apps):
    c.saveState()
    draw_page_bg(c)

    # Title
    para(c, "Application Catalog", MARGIN_L, PAGE_H - 88, PAGE_W - MARGIN_L - MARGIN_R, 60,
         font="Helvetica-Bold", size=28, color=TEXT, leading=28 * 1.15, align="left")
    para(c, "A structured index for fast scanning. Select any card to review details in the following pages.",
         MARGIN_L, PAGE_H - 124, PAGE_W - MARGIN_L - MARGIN_R, 48,
         font="Helvetica", size=11, color=MUTED, leading=11 * 1.5, align="left")

    # Asymmetric grid layout with 24pt vertical spacing between blocks
    top_y = PAGE_H - 160
    left_x = MARGIN_L
    right_x = MARGIN_L + (PAGE_W - MARGIN_L - MARGIN_R) * 0.58 + 16  # asymmetric split
    left_w = (PAGE_W - MARGIN_L - MARGIN_R) * 0.58 - 8
    right_w = PAGE_W - right_x - MARGIN_R

    # Staggered card heights for asymmetry (no overlaps)
    h_big = 168
    h_sm = 144
    vgap = 24

    ly = top_y
    ry = top_y

    for idx, app in enumerate(apps):
        # Alternate: place one on left (bigger every 3), one on right (smaller)
        if ly >= ry:
            w = left_w
            h = h_big if (idx % 3 == 0) else h_sm
            y = ly - h
            _draw_catalog_card(c, left_x, y, w, h, app)
            ly = y - vgap
        else:
            w = right_w
            h = h_sm
            y = ry - h
            _draw_catalog_card(c, right_x, y, w, h, app)
            ry = y - vgap

        # Stop if near bottom; keep restraint (catalog is index, not exhaustive layout complexity)
        if min(ly, ry) < MARGIN_B + 64:
            break

    # Footer note
    rr(c, MARGIN_L, 72, PAGE_W - MARGIN_L - MARGIN_R, 56, r=16, fill=SURFACE, stroke=BORDER, sw=1)
    para(c, f"Total applications: {clean_txt(portfolio.get('stats', {}).get('totalApps',''))}",
         MARGIN_L + 16, 108, 260, 20, "Helvetica-Bold", 10.5, TEXT, 10.5 * 1.2, "left")
    para(c, "Details continue on the next pages.",
         MARGIN_L + 16, 90, PAGE_W - MARGIN_L - MARGIN_R - 32, 20, "Helvetica", 10.5, MUTED, 10.5 * 1.5, "left")

    draw_header_footer(c, portfolio.get("organisation", "Systech"), "Page 2 — Catalog")
    c.restoreState()

def page_detail(c, portfolio, app, page_num):
    c.saveState()
    draw_page_bg(c)

    # 1.618 ratio split: main 62%, sidebar 38%
    content_w = PAGE_W - MARGIN_L - MARGIN_R
    main_w = content_w * 0.62
    side_w = content_w - main_w - 16
    main_x = MARGIN_L
    side_x = MARGIN_L + main_w + 16

    top = PAGE_H - 88

    # Header block
    app_id = clean_txt(app.get("id", ""))
    name = clean_txt(app.get("name", ""))
    domain = clean_txt(app.get("domain", ""))
    category = clean_txt(app.get("category", ""))
    tagline = clean_txt(app.get("tagline", ""))

    para(c, f"{app_id}. {name}", main_x, top, main_w, 60,
         font="Helvetica-Bold", size=30, color=TEXT, leading=30 * 1.1, align="left")

    pill_y = top - 52
    px = main_x
    px += label_pill(c, px, pill_y, domain, bg=SURFACE, fg=TEXT, font_size=9, padding_x=10, h=20) + 8
    label_pill(c, px, pill_y, category, bg="#0E1A36", fg="#C7D2FE", font_size=9, padding_x=10, h=20)

    para(c, tagline, main_x, top - 72, main_w, 56,
         font="Helvetica", size=11.5, color=MUTED, leading=11.5 * 1.5, align="left")

    # Main: Summary & Facts
    main_card_y = 120
    main_card_h = (top - 104) - main_card_y
    rr(c, main_x, main_card_y, main_w, main_card_h, r=20, fill="#0B1224", stroke=BORDER, sw=1)

    ly = top - 120  # inside card top reference

    # Section: Overview
    para(c, "Overview", main_x + 20, ly, main_w - 40, 24,
         font="Helvetica-Bold", size=12, color=TEXT, leading=12 * 1.2, align="left")
    ly -= 24

    consumed = para(c, clean_txt(app.get("overview", "")),
                    main_x + 20, ly, main_w - 40, max_h=184,
                    font="Helvetica", size=10.8, color=MUTED, leading=10.8 * 1.5, align="left")
    ly -= (consumed + 24)  # Y-management rule

    # Section: Key features
    para(c, "Key features", main_x + 20, ly, main_w - 40, 24,
         font="Helvetica-Bold", size=12, color=TEXT, leading=12 * 1.2, align="left")
    ly -= 24

    feats = app.get("features", []) or []
    # Feature list with bullets; ensure no overflow; keep generous whitespace
    for f in feats[:6]:
        if ly < main_card_y + 72:
            break
        title = clean_txt(f.get("title", ""))
        desc = clean_txt(f.get("description", ""))
        # Bullet dot
        c.saveState()
        c.setFillColor(_hex(ACCENT))
        c.circle(main_x + 24, ly - 10, 2.2, stroke=0, fill=1)
        c.restoreState()

        para(c, title, main_x + 34, ly, main_w - 54, 18,
             font="Helvetica-Bold", size=10.5, color=TEXT, leading=10.5 * 1.2, align="left")
        ly -= 18
        consumed = para(c, desc, main_x + 34, ly, main_w - 54, max_h=44,
                        font="Helvetica", size=10.2, color=MUTED, leading=10.2 * 1.5, align="left")
        ly -= (consumed + 16)  # Y-management (use 16 here inside list for compactness but still 8-grid)

    # Section: Impact
    if ly > main_card_y + 72:
        para(c, "Impact", main_x + 20, ly, main_w - 40, 24,
             font="Helvetica-Bold", size=12, color=TEXT, leading=12 * 1.2, align="left")
        ly -= 24
        consumed = para(c, clean_txt(app.get("impact", "")),
                        main_x + 20, ly, main_w - 40, max_h=76,
                        font="Helvetica", size=10.8, color=MUTED, leading=10.8 * 1.5, align="left")
        ly -= (consumed + 24)

    # Sidebar: Metrics
    side_card_y = 120
    side_card_h = main_card_h
    rr(c, side_x, side_card_y, side_w, side_card_h, r=20, fill=SURFACE, stroke=BORDER, sw=1)

    sy = top - 120
    para(c, "Snapshot", side_x + 18, sy, side_w - 36, 24,
         font="Helvetica-Bold", size=12, color=TEXT, leading=12 * 1.2, align="left")
    sy -= 32

    metrics = app.get("metrics", []) or []
    # Render metric rows
    row_h = 56
    for m in metrics[:8]:
        if sy - row_h < side_card_y + 24:
            break
        rr(c, side_x + 14, sy - row_h + 8, side_w - 28, row_h - 8, r=14, fill="#0B1224", stroke=BORDER, sw=1)
        label = clean_txt(m.get("label", ""))
        value = clean_txt(m.get("value", ""))
        para(c, label.upper(), side_x + 26, sy - 18, side_w - 52, 16,
             font="Helvetica", size=8.8, color=MUTED, leading=8.8 * 1.2, align="left")
        para(c, value, side_x + 26, sy - 40, side_w - 52, 28,
             font="Helvetica-Bold", size=12.5, color=TEXT, leading=12.5 * 1.2, align="left")
        sy -= (row_h + 16)

    # Sidebar: Domain / Category emphasis block
    if sy > side_card_y + 96:
        rr(c, side_x + 14, side_card_y + 24, side_w - 28, 64, r=16, fill="#0B1224", stroke=BORDER, sw=1)
        para(c, "Domain", side_x + 26, side_card_y + 72, side_w - 52, 14,
             font="Helvetica", 8.8, MUTED, 8.8 * 1.2, "left")
        para(c, domain, side_x + 26, side_card_y + 54, side_w - 52, 18,
             font="Helvetica-Bold", 12, TEXT, 12 * 1.2, "left")

    draw_header_footer(c, portfolio.get("organisation", "Systech"),
                       f"Page {page_num} — Detail ({app_id})")
    c.restoreState()

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def deep_clean(obj):
    # Ensure every string gets clean_txt applied before render
    if isinstance(obj, dict):
        return {k: deep_clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_clean(v) for v in obj]
    if isinstance(obj, str):
        return clean_txt(obj)
    return obj

def build_pdf(output_path):
    data = json.loads(DATA_JSON)
    data = deep_clean(data)

    portfolio = data.get("portfolio", {}) or {}
    apps = data.get("applications", []) or []

    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle(clean_txt(portfolio.get("title", "Application Portfolio")))

    # Page 1: HERO
    page_hero(c, portfolio)
    c.showPage()

    # Page 2: CATALOG
    page_catalog(c, portfolio, apps)
    c.showPage()

    # Page 3+: DETAIL per app
    page_num = 3
    for app in apps:
        page_detail(c, portfolio, app, page_num)
        c.showPage()
        page_num += 1

    c.save()

def main():
    parser = argparse.ArgumentParser(description="Generate multi-page application portfolio wireframes (ReportLab).")
    parser.add_argument("--output", required=True, help="Output PDF path")
    args = parser.parse_args()
    build_pdf(args.output)

if __name__ == "__main__":
    main()