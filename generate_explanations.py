"""Generate readable, formatted ITIL explanations for all questions."""
import json
import re

PATH = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\quiz-app\data\questions.json"

PRACTICE_PATTERNS = [
    (r"service catalogue|service catalog", "Service catalogue management",
     "Keeps the master list of every service — live, planned, or retired — with status, interfaces, and dependencies.",
     "Think of it as IT's official menu and inventory."),
    (r"service level management", "Service level management",
     "Negotiates and monitors service level targets with customers through SLAs, OLAs, and underpinning contracts.",
     "SLM is about agreed targets and performance — not listing what services exist."),
    (r"demand management", "Demand management",
     "Understands and shapes demand patterns so IT can prepare the right capacity.",
     "Demand management predicts busy periods — it doesn't catalogue services."),
    (r"service transition", "Service transition",
     "Safely builds, tests, and deploys new or changed services into the live environment.",
     "Transition moves services into production; the catalogue records what's there."),
    (r"incident management", "Incident management",
     "Gets broken or degraded services back to normal as quickly as possible.",
     "Incidents are about fast recovery — not finding root causes."),
    (r"problem management", "Problem management",
     "Investigates root causes and prevents incidents from repeating.",
     "Problems are detective work after the fire is out."),
    (r"event management", "Event management",
     "Detects state changes in systems and decides whether to act.",
     "Events are signals from monitoring — a disk filling up, a server restarting."),
    (r"change management|change control|change manager", "Change control",
     "Assesses, approves, and schedules changes to minimize risk.",
     "Every production change should pass through change control."),
    (r"release management|release and deployment", "Release management",
     "Plans and controls how software releases move into production.",
     "Releases bundle tested changes into deployable packages."),
    (r"configuration management|service asset and configuration|sacm|cmdb", "Service configuration management",
     "Tracks configuration items and how they relate to each other.",
     "The CMDB is a map of what you own and how pieces connect."),
    (r"availability management", "Availability management",
     "Ensures services meet agreed uptime in a cost-effective way.",
     "Availability = can people use the service when they need it?"),
    (r"capacity management|capacity and performance", "Capacity management",
     "Makes sure enough resources exist to meet performance targets.",
     "Capacity asks: do we have enough CPU, memory, bandwidth, and storage?"),
    (r"it service continuity|service continuity", "IT service continuity management",
     "Plans recovery when major disasters threaten critical services.",
     "Continuity is the disaster playbook — keep essential services alive."),
    (r"information security|security management", "Information security management",
     "Protects confidentiality, integrity, and availability of information.",
     "Security defends against threats, misuse, and data leaks."),
    (r"access management", "Access management",
     "Grants the right people access and blocks everyone else.",
     "Access management is the gatekeeper for who can use what."),
    (r"request fulfil|request fulfill|service request", "Service request management",
     "Fulfils routine, pre-approved user requests like password resets.",
     "Service requests are standard orders — not emergencies."),
    (r"service desk", "Service desk",
     "Single point of contact for users to log incidents and requests.",
     "The service desk is IT's front door."),
    (r"it operations management|it operations control", "IT operations management",
     "Runs and monitors infrastructure day to day.",
     "IT ops keeps the engine running — backups, monitoring, routine tasks."),
    (r"knowledge management", "Knowledge management",
     "Captures and shares know-how so teams learn from experience.",
     "Knowledge management stops everyone solving the same problem twice."),
    (r"business relationship", "Business relationship management",
     "Maintains customer relationships and tracks satisfaction.",
     "BRM is IT's relationship with the business — understanding needs and feedback."),
    (r"financial management|it finance", "Financial management",
     "Budgets, costs, and financial planning for IT services.",
     "Financial management tracks what services cost and where money goes."),
    (r"supplier management", "Supplier management",
     "Manages vendor contracts and ensures suppliers deliver.",
     "Supplier management handles third-party contracts — not customer SLAs."),
    (r"portfolio management|service portfolio", "Portfolio management",
     "Chooses the right mix of services and projects for strategy.",
     "The portfolio is the big picture of what IT offers and plans."),
    (r"strategy management|service strategy", "Strategy management",
     "Sets long-term direction for how IT supports the business.",
     "Strategy answers: what services should we offer and why?"),
    (r"continual improvement|seven step|csi", "Continual improvement",
     "Uses measurement and feedback to get better over time.",
     "Improvement is a cycle: where are we, where do we want to be, how do we get there?"),
    (r"design coordination|service design", "Service design",
     "Designs services, processes, and architecture before going live.",
     "Design is the blueprint — plan before you build."),
    (r"process owner", "Process owner",
     "Accountable for a process being fit for purpose.",
     "Owners design and improve the process; practitioners run it."),
    (r"process practitioner", "Process practitioner",
     "Does the hands-on work within a process.",
     "Practitioners execute; owners are accountable for outcomes."),
    (r"definitive media|dml", "Definitive media library",
     "Secure master store of authorized software and media copies.",
     "One official copy of each approved software build lives here."),
    (r"known error", "Known error",
     "A diagnosed problem with a documented workaround.",
     "Known errors sit in the KEDB until permanently fixed."),
    (r"sla|service level agreement", "Service Level Agreement",
     "Contract defining expected service levels between provider and customer.",
     "SLAs are promises with measurable targets."),
    (r"ola|operational level agreement", "Operational Level Agreement",
     "Internal agreement between IT teams supporting an SLA.",
     "OLAs are backstage deals between IT teams."),
    (r"underpinning contract|third.party contract", "Underpinning contract",
     "Contract with an external supplier underpinning SLA commitments.",
     "When you outsource, underpinning contracts back your promises."),
    (r"utility", "Utility", "What the service does — fit for purpose.", "Utility = functionality."),
    (r"warranty", "Warranty", "How reliably the service performs — fit for use.", "Warranty = peace of mind about performance."),
    (r"data.?information.?knowledge.?wisdom", "DIKW hierarchy",
     "Data → Information → Knowledge → Wisdom.", "Each step adds context and meaning."),
    (r"major incident", "Major incident",
     "High-impact incident needing urgent, coordinated response.", "Major incidents get special procedures and fast escalation."),
    (r"standard change", "Standard change", "Pre-approved, low-risk, repeatable change.", "No need to ask permission every time."),
    (r"emergency change", "Emergency change", "Fast-tracked change to fix a critical situation.", "Fix first, review afterward."),
    (r"raci", "RACI", "Clarifies Responsible, Accountable, Consulted, Informed.", "Ends the 'who does what' confusion."),
    (r"pba|pattern(s)? of business activity", "Patterns of business activity",
     "How business rhythms drive IT demand.", "Knowing when the business is busy helps IT prepare."),
    (r"facilities management", "Facilities management",
     "Manages physical environment — data centres, power, cooling.", "Facilities keeps the building and hardware environment running."),
    (r"application management", "Application management",
     "Manages applications throughout their lifecycle to meet business needs.", "Application management ensures apps deliver required business functionality."),
    (r"technical management", "Technical management", "Manages the technical expertise for infrastructure.", "Technical management provides deep tech skills for platforms."),
    (r"functions", "Functions", "Teams organized by specialty (e.g. technical management, application management).", "Functions are organizational units — different from processes, which are flows of activity."),
    (r"monitoring and event", "Monitoring and event management",
     "Observes services and generates alerts.", "Monitoring watches; events are what it detects."),
    (r"^user$", "User", "Person who directly uses the service.", "Users interact with the service daily."),
    (r"^customer$", "Customer", "Defines requirements and agrees service targets.", "Customers own requirements; users operate the service."),
    (r"^sponsor$", "Sponsor", "Authorizes budget for service consumption.", "Sponsors pay the bills."),
    (r"^supplier$", "Supplier", "Third party providing components or services.", "Suppliers are external — not the same as customers."),
    (r"deliver and manage.*agreed|conduct activities to deliver", "Service Operation",
     "Delivers and supports services at agreed levels — this is day-to-day operations.",
     "Running services is Service Operation. Improving how you run them is CSI."),
    (r"wisdom", "Wisdom", "Judgment from experience — top of the DIKW pyramid.", "Tools can store data and knowledge, but wisdom requires human experience."),
    (r"proprietary knowledge", "Public vs proprietary knowledge",
     "Proprietary know-how is hard to adopt, replicate, or transfer — it's often undocumented and locked in people's heads.",
     "Public frameworks like ITIL are open, shared, and proven across thousands of organizations."),
    (r"\bknowledge\b", "Knowledge", "Know-how for decisions and actions.", "Knowledge tells you how to apply information."),
    (r"information", "Information", "Data in context — answers who, what, when, where.", "Information adds meaning to raw data."),
    (r"(?<![a-z])data(?![a-z])", "Data", "Raw facts and figures without context.", "Data alone doesn't tell you what to do."),
    (r"devops", "DevOps", "Collaboration between dev and ops for faster delivery.", "Breaks silos between building and running software."),
    (r"agile", "Agile", "Iterative delivery with frequent feedback.", "Small steps, constant learning."),
    (r"governance", "Governance", "Evaluates, directs, and monitors the organization.", "Governance sets the rules of the game."),
    (r"separate procedures", "Separate procedures",
     "Dedicated workflows for exceptional situations.", "Major incidents need their own playbook — not the normal process."),
    (r"defining roles and responsibilities", "RACI / roles",
     "Clarifies who does what on any activity.", "RACI maps Responsible, Accountable, Consulted, Informed."),
    (r"specialized organizational capabilities", "Service management definition",
     "ITIL's official definition — capabilities for delivering value through services.",
     "Service management is about organizational ability to create value, not just docs or tools."),

    (r"prescriptive.*exactly what to do", "ITIL as guidance",
     "ITIL guides thinking — it is not a rigid instruction manual.", "Frameworks suggest good practice; you adapt them to your context."),
    (r"people, process, products, partners|people, process, products, partners", "Four Ps of service design",
     "People, Processes, Products, and Partners — the building blocks of service design.",
     "Design needs all four: the right people, processes, technology, and partners."),
    (r"people, process, partners, performance", "Four Ps distractor",
     "Performance is not one of the four Ps — that's a trap answer.", "The real four Ps end with Products and Partners, not Performance."),
    (r"to ensure.*customer satisfaction|high levels of customer satisfaction", "Customer satisfaction objective",
     "BRM focuses on understanding and satisfying customer needs.", "Happy customers are a core BRM goal."),
    (r"incident and event management", "Incident + event management",
     "Events detect issues; incidents restore service when something goes wrong.", "Monitoring finds the signal; incident management acts on it."),
    (r"change proposal", "Change proposal",
     "Documents a major change with costs, risks, and benefits for approval.", "Used when a change needs serious investment decisions."),
    (r"change policy", "Change policy", "High-level rules governing how changes are handled.", "Policy sets the guardrails; individual changes follow the process."),
    (r"risk register", "Risk register", "Log of identified risks and mitigations.", "Tracks what could go wrong and what's being done about it."),
    (r"before the change is approved", "Change planning",
     "Remediation plans must exist before approval — know how you'll roll back if things fail.",
     "Hope for the best, plan for the worst — before you get permission to change."),
    (r"remediation", "Remediation", "Plan to restore service if a change fails.", "Always know your exit strategy before changing production."),
]

# Rules to evaluate numbered statements in combo questions: (regex, is_true, explanation)
STATEMENT_RULES = [
    (r"details of the service level agreement|sla.*pertaining|sla.*incident model", False,
     "SLA targets are agreed separately — an incident model holds resolution steps, not the full SLA."),
    (r"chronological.*steps|steps to resolve|order of steps to resolve", True,
     "This is exactly what an incident model captures — the repeatable path to fix common incidents."),
    (r"every process.*function|function.*every process", False,
     "Functions are organizational units; not every process includes a function as a component."),
    (r"metrics.*every process|every process.*metrics", True, "Every process should have metrics to measure performance."),
    (r"roles.*every process|every process.*roles", True, "Every process defines roles for who does what."),
    (r"inputs and outputs.*every process", True, "Processes transform inputs into outputs — that's fundamental."),
    (r"functions.*every process", False, "Functions are not a mandatory part of every process definition."),
    (r"hardware.*data centre|power and cooling|recovery sites", True, "Facilities management covers physical infrastructure and environment."),
    (r"applications.*facilities|facilities.*applications", False, "Applications are managed by application management, not facilities."),
    (r"utility.*fit for purpose|fit for purpose.*utility", True, "Utility = what the service does (fit for purpose)."),
    (r"warranty.*fit for use|fit for use.*warranty", True, "Warranty = how well it performs (fit for use)."),
    (r"resources and capabilities.*value|value.*resources and capabilities", True,
     "ITIL says value comes from combining resources and capabilities for customers."),
    (r"service value.*visible|visible.*customers", True,
     "In service operation, customers actually experience the value being delivered."),
    (r"deliver and manage.*agreed levels", True,
     "Service operation delivers and manages services at agreed levels."),
    (r"cannot be provided by a tool.*wisdom|wisdom.*cannot", True,
     "Tools store data and information; wisdom requires human judgment and experience."),
    (r"tool.*provide.*wisdom", True, "Wisdom is the one DIKW level that needs human experience."),
]

OPTION_HINTS = [
    (r"review and analyze service level", "Reviewing SLA results feeds the improvement cycle — measure, learn, adjust."),
    (r"identify activities to improve.*efficien", "Spotting process inefficiencies and fixing them is core continual improvement work."),
    (r"improve the cost effectiveness.*without sacrificing", "Balancing cheaper delivery with happy customers is a classic CSI goal."),
    (r"deliver and manage services at agreed|conduct activities to deliver and manage", "That's Service Operation — keeping services running. CSI improves them; Operation runs them."),
    (r"logging details of incidents", "Logging incidents is a service desk / operation activity."),
    (r"first.line investigation|first line investigation", "First-line diagnosis is what the service desk does when a call comes in."),
    (r"restoring service", "Restoring service is incident management's primary goal."),
    (r"implementing all standard changes", "Standard changes are pre-approved — but implementing them isn't the service desk's main role alone."),
    (r"identify patterns of business activity", "Understanding PBA helps forecast demand — a BRM and strategy concern."),
    (r"to ensure high levels of customer satisfaction", "Keeping customers satisfied is a key BRM objective."),
    (r"to secure funding", "Securing budget is more of a financial / sponsor activity, not core BRM."),
    (r"to ensure strategic plans", "Strategic planning sits in service strategy, not BRM alone."),
    (r"process practitioner", "The practitioner does the daily work inside the process."),
    (r"process owner", "The owner is accountable for the process design and outcomes."),
    (r"change manager", "The change manager oversees change control — not general process execution."),
    (r"service manager", "Not a standard ITIL role name for carrying out process activities."),
    (r"functions", "Functions are teams (like ops or tech management) — not part of every process definition."),
    (r"roles", "Roles are defined in processes — but 'roles' alone isn't what's missing from every process."),
    (r"metrics", "Every process needs metrics to know if it's working."),
    (r"inputs and outputs", "Every process transforms inputs into outputs."),
    (r"wisdom", "Wisdom needs human judgment — tools can't provide it."),
    (r"^data$", "Raw facts without context."),
    (r"^information$", "Data put into context."),
    (r"^knowledge$", "Know-how for action — can be stored in tools."),
    (r"change proposal", "Documents a major change's costs, risks, and benefits before approval."),
    (r"change policy", "High-level rules for how changes are governed."),
    (r"service request", "A standard user request — not an emergency incident."),
    (r"risk register", "Tracks identified risks — not used for routine change proposals."),
    (r"people, process, products, partners", "The four Ps of service design — People, Processes, Products, Partners."),
    (r"utility", "Fit for purpose — what the service does."),
    (r"warranty", "Fit for use — how reliably it performs."),
    (r"resources and capabilities", "ITIL says value comes from combining provider resources and capabilities."),
    (r"service value is visible", "In operation, customers actually experience value being delivered."),
    (r"separate procedures", "Major incidents need their own escalation playbook."),
    (r"defining roles and responsibilities", "That's exactly what a RACI matrix is for."),
    (r"specialized organizational capabilities", "ITIL's official definition of service management."),
]

COMBO_OPTION_RE = re.compile(
    r"^(1\s*only|2\s*only|3\s*only|4\s*only|1\s*and\s*2|2\s*and\s*3|1,\s*2|1,\s*2\s*and|"
    r"2,\s*3|both of the above|neither of the above|all of the above|none of the above|"
    r"\d,\s*\d|\d\s*and\s*\d)",
    re.I,
)


def normalize(text: str) -> str:
    text = text.replace("\ufb01", "fi").replace("\ufb02", "fl")
    text = text.replace("diƯicult", "difficult").replace("oƯ", "off").replace("eƯ", "eff")
    text = re.sub(r"(\d)(and)", r"\1 \2", text)
    text = re.sub(r"(and)(\d)", r"\1 \2", text)
    return re.sub(r"\s+", " ", text).strip()


def match_practice(text: str):
    t = normalize(text).lower()
    for pattern, label, does, hook in PRACTICE_PATTERNS:
        if re.search(pattern, t, re.I):
            return {"label": label, "does": does, "hook": hook}
    return None


def explain_option(option_text: str) -> str | None:
    t = normalize(option_text).lower()
    for pattern, expl in OPTION_HINTS:
        if re.search(pattern, t, re.I):
            return expl
    info = match_practice(option_text)
    if info:
        return info["does"]
    return None


def is_not_question(question: str) -> bool:
    q = normalize(question).lower()
    return bool(
        re.search(
            r"\bnot\b.{0,50}(objective|purpose|part of|included|an objective|correct statement|true statement)",
            q,
        )
        or "which is not" in q
        or "all except" in q
    )


def not_question_explanation(q: dict) -> str:
    correct_id = q["correct"]
    correct_opt = next(o for o in q["options"] if o["id"] == correct_id)
    correct_text = normalize(correct_opt["text"])
    q_lower = normalize(q["question"]).lower()

    topic = "this practice"
    teach_core = ""
    if "continual service improvement" in q_lower or "continual improvement" in q_lower:
        topic = "Continual Service Improvement"
        teach_core = (
            "CSI constantly asks: <em>how do we get better?</em> — reviewing metrics, sharpening processes, "
            "trimming cost without hurting customers. "
            "<strong>Running</strong> services daily is Service Operation's job, not CSI's."
        )
    elif "service operation" in q_lower:
        topic = "Service Operation"
        teach_core = "Service Operation keeps services alive for users. Strategy, design, and improvement happen elsewhere."
    elif "service design" in q_lower:
        topic = "Service Design"
        teach_core = "Service Design blueprints new services. Don't confuse it with operating or improving them."
    elif "service strategy" in q_lower:
        topic = "Service Strategy"
        teach_core = "Strategy picks what services to offer and to whom."
    elif "service transition" in q_lower:
        topic = "Service Transition"
        teach_core = "Transition safely deploys services into production."

    correct_note = explain_option(correct_text) or "This activity belongs to a different part of the lifecycle."

    lead = (
        f"The question asks which is <strong>NOT</strong> a {topic} objective. "
        f"<strong>{correct_id}) {correct_text}</strong> is the outsider."
    )
    teach = f'<p class="expl-teach">{teach_core} {correct_note}</p>'

    return f'<div class="expl-body"><p class="expl-lead">{lead}</p>{teach}</div>'


def option_line(option_id: str, option_text: str) -> str:
    return f"<span class='expl-opt'>{option_id}) {normalize(option_text)}</span>"


def short_option(text: str, max_len: int = 40) -> str:
    t = normalize(text)
    return t if len(t) <= max_len else t[: max_len - 1] + "…"


def is_combo_question(options) -> bool:
    hits = sum(1 for o in options if COMBO_OPTION_RE.match(normalize(o["text"]).lower()))
    return hits >= 3


def extract_statements(question: str) -> list[tuple[str, str]]:
    q = normalize(question)
    statements = []
    for m in re.finditer(r"(?<!\d)(\d)\s+(.+?)(?=\s+\d\s+|$)", q):
        stmt = m.group(2).strip().rstrip("?")
        if len(stmt) > 10:
            statements.append((m.group(1), stmt))
    return statements


def evaluate_statement(stmt: str) -> tuple[bool | None, str]:
    t = stmt.lower()
    for pattern, is_true, expl in STATEMENT_RULES:
        if re.search(pattern, t, re.I):
            return is_true, expl
    info = match_practice(stmt)
    if info:
        return None, info["does"]
    return None, f"Consider whether this aligns with ITIL guidance: {short_option(stmt, 80)}"


def combo_explanation(q: dict) -> str:
    correct_id = q["correct"]
    statements = extract_statements(q["question"])
    correct_text = normalize(next(o["text"] for o in q["options"] if o["id"] == correct_id))

    lead = f"<strong>{correct_id}) {correct_text}</strong> is the right combination."

    stmt_lines = []
    for num, stmt in statements:
        is_true, note = evaluate_statement(stmt)
        if is_true is True:
            tag = '<span class="expl-yes">Yes</span>'
        elif is_true is False:
            tag = '<span class="expl-no">No</span>'
        else:
            tag = '<span class="expl-maybe">Check</span>'
        stmt_lines.append(f"<li>{tag} <strong>Statement {num}:</strong> {short_option(stmt, 90)} — {note}</li>")

    teach = ""
    if stmt_lines:
        teach = '<p class="expl-teach"><strong>Break it down:</strong></p><ul class="expl-stmts">' + "".join(stmt_lines) + "</ul>"
    else:
        teach = f'<p class="expl-teach">Work through each numbered statement in the question and pick the combination that matches ITIL guidance. {correct_text} is what the exam key confirms.</p>'

    return f'<div class="expl-body"><p class="expl-lead">{lead}</p>{teach}</div>'


def smart_teach(correct_text: str, question: str, info: dict | None) -> str:
    if info:
        parts = [info["does"]]
        if info.get("hook"):
            parts.append(info["hook"])
        return " ".join(parts)

    ct = normalize(correct_text).lower()
    q = normalize(question).lower()

    if "proprietary" in ct and ("adopt" in ct or "transfer" in ct or "replicate" in ct or "difficult" in ct):
        return "Public frameworks like ITIL are openly published and battle-tested across industries. Proprietary know-how is locked inside one organization and hard to copy or transfer."
    if "wisdom" in ct and ("tool" in q or "cannot" in q):
        return "Tools handle data, information, and even stored knowledge — but wisdom is judgment from experience. That needs a human brain."
    if ct in ("customer",) or ct.startswith("customer"):
        return "The customer owns requirements and agrees targets with the provider. Users just operate the service — different hat."
    if ct in ("user",) or ct.startswith("user"):
        return "Users interact with the service daily. They're not necessarily the ones defining requirements or paying."
    if "specialized organizational capabilities" in ct:
        return "ITIL's definition of service management: a set of capabilities for providing value — not just documentation, availability, or a methodology label."

    if "prescriptive" in ct and "exactly" in ct:
        return "Trap answer — ITIL is guidance you adapt, not a strict recipe."
    if "always cheaper" in ct:
        return "Trap answer — the benefit of public frameworks is shared best practice, not guaranteed low cost."
    if "before the change is approved" in ct:
        return "You must plan your rollback (remediation) before approval — not after things go wrong."
    if "defining roles and responsibilities" in ct:
        return "That's exactly what RACI does — maps who is Responsible, Accountable, Consulted, and Informed."
    if "separate procedures" in ct:
        return "Major incidents are too serious for the normal process — they need dedicated procedures and faster escalation."
    if "agreed level" in ct and "service" in ct:
        return "Service level management's job is making sure agreed levels are negotiated, met, and reported on."
    if "functionality" in ct and "business" in ct:
        return "Application management makes sure applications deliver the business functionality users need."
    if "deliver and manage" in ct and "agreed" in ct:
        return "Service operation is where the rubber meets the road — services run and are managed at agreed levels."
    if "visible" in ct and "customer" in ct:
        return "In operation, customers actually see and experience the value. Earlier lifecycle stages prepare it; operation delivers it."
    if "resources and capabilities" in ct:
        return "ITIL says providers create value by combining resources (assets, tools, people) with capabilities (skills, processes)."
    if "people, process, products, partners" in ct.replace(" ", ""):
        return "The four Ps of service design: People, Processes, Products (technology), and Partners."
    if "incident and event" in ct or "event and incident" in ct:
        return "Event management spots the signal; incident management restores service when something actually breaks."
    if "change proposal" in ct:
        return "A change proposal is the business case for a major change — costs, risks, benefits — before anyone approves it."
    if "data" in ct and "information" in ct and "knowledge" in ct and "wisdom" in ct:
        return "DIKW flows upward: Data (raw facts) → Information (context) → Knowledge (know-how) → Wisdom (judgment)."

    # Conversational last resort
    if len(correct_text) > 20:
        return f"Read the question carefully, then match it to this ITIL concept: {normalize(correct_text)}"
    return f"In this context, ITIL identifies <strong>{normalize(correct_text)}</strong> as the right choice."


def smart_why_not(option_id: str, option_text: str, question: str, correct_info: dict | None) -> str:
    ot_full = normalize(option_text)
    ot = ot_full.lower()
    line = option_line(option_id, option_text)

    expl = explain_option(option_text)
    if expl:
        if correct_info:
            return f"<li>{line} — {expl} <span class='expl-tag'>Different focus</span> than what this question asks.</li>"
        return f"<li>{line} — {expl}</li>"

    info = match_practice(option_text)
    if info and correct_info and info["label"] != correct_info["label"]:
        return f"<li>{line} — {info['does']} <span class='expl-tag'>Wrong practice</span> for this question.</li>"

    traps = [
        (r"always cheaper|always.*cheaper", "Cost isn't the main reason — shared, proven practice is."),
        (r"prescriptive.*exactly|tell you exactly", "ITIL guides; it doesn't dictate every action."),
        (r"proprietary.*tested.*wide range", "That's backwards — public frameworks are widely tested, not proprietary ones."),
        (r"proactively prevent all outages", "You can't prevent every outage — you manage and restore."),
        (r"only changes that introduce new", "Design coordination covers more than just brand-new services."),
        (r"mandatory that all changes", "Not every tiny change needs full design coordination."),
        (r"less urgency|longer timescale|less documentation", "Major incidents need more urgency and more coordination, not less."),
        (r"performance analysis", "That's capacity/performance territory, not RACI."),
        (r"recording configuration", "That's configuration management, not role definition."),
        (r"monitoring services", "Monitoring is a different practice — not what RACI is for."),
        (r"administrator", "Not a standard ITIL service relationship role."),
        (r"complete set of all the documentation", "Service management is capabilities, not a document library."),
        (r"internationally recognized methodology", "Close, but ITIL is guidance for capabilities — not just a methodology label."),
        (r"highly available", "Availability is one piece — service management is broader."),
    ]
    for pattern, reason in traps:
        if re.search(pattern, ot, re.I):
            return f"<li>{line} — <span class='expl-tag'>Trap answer</span> {reason}</li>"

    if info:
        return f"<li>{line} — {info['does']}</li>"

    q = normalize(question).lower()
    if "which process" in q or "which practice" in q:
        return f"<li>{line} — <span class='expl-tag'>Different process</span> handles that responsibility.</li>"
    if "which role" in q:
        return f"<li>{line} — <span class='expl-tag'>Different role</span> than what ITIL defines here.</li>"
    if "purpose" in q or "objective" in q:
        return f"<li>{line} — describes a different purpose or objective.</li>"

    return f"<li>{line} — not what ITIL identifies as the answer here.</li>"


def question_type(question: str) -> str:
    q = question.lower()
    if re.search(r"which process|which practice|which function", q):
        return "process"
    if re.search(r"which role|who is", q):
        return "role"
    if re.search(r"purpose|objective|goal", q):
        return "purpose"
    if re.search(r"best description|best definition|best answer", q):
        return "definition"
    if q.startswith("why "):
        return "why"
    return "general"


def lead_sentence(qtype: str, correct_id: str, correct_text: str, info: dict | None) -> str:
    label = info["label"] if info else short_option(correct_text, 55)
    if qtype == "process":
        return f"<strong>{correct_id}) {label}</strong> is the practice responsible here."
    if qtype == "role":
        return f"<strong>{correct_id}) {label}</strong> is the role ITIL describes."
    if qtype == "definition":
        return f"<strong>{correct_id}) {short_option(correct_text, 55)}</strong> is the best answer."
    if qtype == "why":
        return f"<strong>{correct_id}) {short_option(correct_text, 55)}</strong> — here's the reasoning."
    return f"<strong>{correct_id}) {short_option(correct_text, 55)}</strong> is correct."


def generate_explanation(q: dict) -> str:
    if is_combo_question(q["options"]):
        return combo_explanation(q)
    if is_not_question(q["question"]):
        return not_question_explanation(q)

    correct_id = q["correct"]
    correct_opt = next(o for o in q["options"] if o["id"] == correct_id)
    correct_text = normalize(correct_opt["text"])
    correct_info = match_practice(correct_text)
    qtype = question_type(q["question"])

    lead = lead_sentence(qtype, correct_id, correct_text, correct_info)
    teach = smart_teach(correct_text, q["question"], correct_info)

    return f'<div class="expl-body"><p class="expl-lead">{lead}</p><p class="expl-teach">{teach}</p></div>'


def detect_topic(q: dict) -> str:
    text = (q["question"] + " " + " ".join(o["text"] for o in q["options"])).lower()
    correct = next(o["text"] for o in q["options"] if o["id"] == q["correct"])
    combined = text + " " + correct.lower()
    topics = [
        ("Service Catalogue", ["service catalogue", "service catalog"]),
        ("Incident Management", ["incident", "major incident"]),
        ("Problem Management", ["problem", "known error", "root cause"]),
        ("Change Control", ["change management", "change control", "cab", "remediation"]),
        ("Service Level Mgmt", ["service level", "sla", "ola", "underpinning"]),
        ("Service Design", ["service design", "four ps", "utility", "warranty", "design coordination"]),
        ("Service Operation", ["service operation", "service desk", "request fulfil", "it operations"]),
        ("Event & Monitoring", ["event management", "monitoring"]),
        ("Knowledge Management", ["knowledge", "wisdom", "dikw", "data", "information"]),
        ("Guiding Principles", ["guiding principle", "focus on value", "start where you are"]),
        ("Service Value System", ["service value system", "service value chain", "value chain"]),
        ("Continual Improvement", ["continual improvement", "seven step"]),
        ("Supplier Management", ["supplier", "third-party", "underpinning"]),
        ("Capacity & Availability", ["capacity", "availability", "demand management"]),
        ("People & Roles", ["process owner", "process practitioner", "raci", "customer", "user", "sponsor"]),
    ]
    for name, keywords in topics:
        if any(kw in combined for kw in keywords):
            return name
    return "General ITIL"


def main():
    with open(PATH, encoding="utf-8") as f:
        questions = json.load(f)

    for q in questions:
        q["explanation"] = generate_explanation(q)
        q["topic"] = detect_topic(q)

    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    generic = sum(1 for x in questions if "doesn't fit ITIL" in x.get("explanation", ""))
    not_q = sum(1 for x in questions if is_not_question(x["question"]))
    combo = sum(1 for x in questions if "expl-stmts" in x.get("explanation", ""))
    print(f"Regenerated {len(questions)} explanations")
    print(f"  Combo-style: {combo}")
    print(f"  NOT-style questions: {not_q}")
    print(f"  Generic dismissals: {generic}")
    q106 = next(x for x in questions if x["id"] == 106)
    print("\nQ106 sample:", q106["explanation"][:500])
    q14 = next(x for x in questions if x["id"] == 14)
    q11 = next(x for x in questions if x["id"] == 11)
    print("\nQ14:", q14["explanation"][:200], "...")
    print("\nQ11:", q11["explanation"][:300], "...")


if __name__ == "__main__":
    main()