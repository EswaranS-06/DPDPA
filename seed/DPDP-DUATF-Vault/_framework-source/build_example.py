#!/usr/bin/env python3
"""Worked example client (fictional): DemoPay Finance Pvt Ltd - a digital NBFC lender with an app.
Demonstrates the graph: shared systems/vendors, many-to-many flows, engine run, tests, findings."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from build_vault import write, L, table, VAULT

B = "20 Example - DemoPay"
ORG = "ORG-DEMO"

write(f"{B}/00 About this example.md", dict(type="folder_note"), """
# Worked example - DemoPay Finance Pvt Ltd (fictional)

A digital NBFC lending through its own app, with ~12 lakh borrowers, 450 employees and offices in Bengaluru and Pune. It shows how the framework represents a **graph**:
- The **Salesforce CRM** system serves 3 activities (onboarding follow-up, collections, marketing).
- The **SMS provider** receives data from 3 activities.
- The **Excel collections tracker** is a shadow system found in a workshop.
- The engine output for each activity is in `11 Assessments/Engine Output`.

Everything here is invented for illustration.
""")

write(f"{B}/{ORG} Entity Profile.md", dict(type="entity_profile", org_id=ORG, legal_name="DemoPay Finance Pvt Ltd (fictional)", sectors=[L("SEC-FIN NBFC, Fintech & Payments")],
      entity_role=["data_fiduciary"], sdf_status="not_notified", consent_manager=False, third_schedule=False, children_exposure=False, pwd_exposure=False,
      online_presence=True, cross_border=True, exemptions_claimed=[], regulators=["RBI", "FIU-IND", "CERT-In"], dpo_or_contact="Head - Privacy & Compliance",
      assessment_cycle=L("CYC-DEMO-2026Q4"), tags=["dpdp/entity"]),
      "# DemoPay - Entity Profile\n\nRBI-registered NBFC (digital lending). Not a Third Schedule class. SDF: not notified (monitor). No products for children, but co-applicants' dependants appear in some documents.\n")

write(f"{B}/CYC-DEMO-2026Q4.md", dict(type="assessment_cycle", cycle_id="CYC-DEMO-2026Q4", organisation=L(ORG + " Entity Profile"), scope="Customer lifecycle, HR recruitment, facilities CCTV", start="2026-10-01", end="2026-12-15", lead="Assessor A", status="in_progress"), "# Assessment cycle Q4 2026\n")

systems = [
 ("SYS-DEMO-APP", "DemoPay mobile app & backend", "Web/app backend", True, "Public cloud - India region", "India", "yes", "yes", "mobile, customer_id"),
 ("SYS-DEMO-LOS", "Loan Origination System", "Core/line-of-business application", True, "Public cloud - India region", "India", "yes", "partial", "customer_id, PAN"),
 ("SYS-DEMO-CRM", "Salesforce CRM", "CRM", True, "SaaS - outside India", "USA/Singapore", "yes", "yes", "mobile, email"),
 ("SYS-DEMO-XLS", "Collections tracker (Excel on shared drive)", "Spreadsheet (shadow)", False, "SaaS - outside India", "Unknown", "no", "no", "loan_no"),
 ("SYS-DEMO-ATS", "Applicant Tracking System", "HRMS/Payroll", True, "SaaS - India hosted", "India", "yes", "unknown", "email"),
 ("SYS-DEMO-NVR", "CCTV NVR - Bengaluru office", "Physical security (CCTV/PACS/VMS)", True, "On-prem India", "India", "no", "no", "date/time"),
]
for sid, name, stype, sanc, host, ctry, enc, logs, key in systems:
    write(f"{B}/Systems/{sid}.md", dict(type="system", system_id=sid, title=name, system_type=stype, sanctioned=sanc, owner="", hosting=host, country=ctry,
          encryption_at_rest=enc, access_logging=logs, rights_lookup_key=key, tags=["dpdp/system"]),
          f"# {sid} - {name}\n\n## Activities using this system\n```dataview\nLIST FROM -\"90 Templates\" WHERE type = \"processing_activity\" AND contains(systems, [[{sid}]])\n```\n## Flows from this system\n```dataview\nTABLE to, transfer_type, country FROM -\"90 Templates\" WHERE type = \"data_flow\" AND from_system = [[{sid}]]\n```\n")

tps = [
 ("TP-DEMO-AWS", "AWS (Mumbai region)", "Cloud/IaaS", ["data_processor"], "India", "signed", True, 24),
 ("TP-DEMO-KYC", "KYC & liveness vendor", "KYC/verification vendor", ["data_processor"], "India", "signed", True, 24),
 ("TP-DEMO-BUREAU", "Credit bureau", "Credit bureau", ["data_fiduciary"], "India", "n/a (independent DF under CICRA)", False, None),
 ("TP-DEMO-SF", "Salesforce", "SaaS", ["data_processor"], "USA", "vendor_paper_accepted", True, 72),
 ("TP-DEMO-SMS", "SMS aggregator", "SMS/email/WhatsApp provider", ["data_processor"], "India", "none", False, None),
 ("TP-DEMO-COLL", "Field collection agency", "Collection agency", ["data_processor"], "India", "none", False, None),
 ("TP-DEMO-RECR", "Recruitment agency", "Recruitment agency", ["data_fiduciary", "data_processor"], "India", "none", False, None),
]
for tid, name, ttype, role, ctry, dpa, r6, sla in tps:
    write(f"{B}/Third Parties/{tid}.md", dict(type="third_party", tp_id=tid, name=name, third_party_type=ttype, processing_role=role, country=ctry, dpa_status=dpa,
          dpa_r6_security=r6, breach_notify_sla_hours=sla, tags=["dpdp/third-party"]),
          f"# {tid} - {name}\n\n## Inbound flows\n```dataview\nTABLE from_system, activity, transfer_type FROM -\"90 Templates\" WHERE type = \"data_flow\" AND to = [[{tid}]]\n```\n")

purposes = [
 ("PUR-DEMO-001", "Customer onboarding & KYC", "s7d", "RBI KYC MD / PMLA require CDD"),
 ("PUR-DEMO-002", "Credit assessment & loan decision", "consent", "Bureau pull + bank statement analysis on consent"),
 ("PUR-DEMO-003", "Loan servicing & collections", "s7a", "Borrower voluntarily provided data for loan contract"),
 ("PUR-DEMO-004", "Cross-sell marketing", "consent", "Separate optional consent"),
 ("PUR-DEMO-005", "Recruitment", "consent", "Candidate applies voluntarily; talent pool needs consent"),
 ("PUR-DEMO-006", "Office security (CCTV)", "s7i", "Employees: s.7(i); visitors: s.7(a) with signage"),
]
for pid, t, b, j in purposes:
    write(f"{B}/Purposes/{pid}.md", dict(type="purpose", purpose_id=pid, title=t, lawful_basis=b, basis_justification=j, tags=["dpdp/purpose"]), f"# {pid} - {t}\n")

acts = [
 dict(id="ACT-DEMO-CUS-001", title="App onboarding & e-KYC", dept="Customer Onboarding", proc="FIN-01 Digital onboarding & KYC in app",
      purposes=["PUR-DEMO-001"], basis=["s7d", "consent"], principals=["Customer"], elements=["DE-ID-001 Full name", "DE-GOV-003 PAN", "DE-GOV-001 Aadhaar number", "DE-BIO-002 Face template - facial recognition", "DE-CON-001 Mobile number"],
      systems=["SYS-DEMO-APP", "SYS-DEMO-LOS", "SYS-DEMO-CRM"], tps=["TP-DEMO-AWS", "TP-DEMO-KYC", "TP-DEMO-SF", "TP-DEMO-SMS"],
      flags=["processor", "cross_border", "online_presence", "legacy_data"], ctx=["gov_id", "biometric", "financial"], conf="high"),
 dict(id="ACT-DEMO-CUS-002", title="Underwriting & credit decision", dept="Credit", proc="FIN-02 Underwriting with alternate data",
      purposes=["PUR-DEMO-002"], basis=["consent"], principals=["Applicant"], elements=["DE-FIN-005 Credit score - bureau report", "DE-FIN-006 Transaction history", "DE-FIN-004 Income - salary - CTC"],
      systems=["SYS-DEMO-LOS"], tps=["TP-DEMO-BUREAU", "TP-DEMO-AWS"], flags=["processor", "decision_or_disclosure"], ctx=["financial", "ai"], conf="medium"),
 dict(id="ACT-DEMO-CUS-003", title="Collections (tele & field)", dept="Collections", proc="FIN-03 Servicing, repayment & collections",
      purposes=["PUR-DEMO-003"], basis=["s7a"], principals=["Borrower", "References"], elements=["DE-CON-001 Mobile number", "DE-CON-003 Postal address", "DE-FIN-007 Loan - EMI details"],
      systems=["SYS-DEMO-CRM", "SYS-DEMO-XLS"], tps=["TP-DEMO-COLL", "TP-DEMO-SMS", "TP-DEMO-SF"], flags=["processor", "cross_border"], ctx=["financial", "location"], conf="low"),
 dict(id="ACT-DEMO-MKT-001", title="Cross-sell SMS & email campaigns", dept="Marketing", proc="CMN-MKT-03 Email, SMS, WhatsApp & voice campaigns",
      purposes=["PUR-DEMO-004"], basis=["consent"], principals=["Customer"], elements=["DE-CON-001 Mobile number", "DE-CON-002 Email address", "DE-BEH-002 Inferred segments - propensity scores"],
      systems=["SYS-DEMO-CRM"], tps=["TP-DEMO-SF", "TP-DEMO-SMS"], flags=["processor", "cross_border", "marketing", "legacy_data", "online_presence"], ctx=["ai"], conf="medium"),
 dict(id="ACT-DEMO-HR-001", title="Recruitment via agency & ATS", dept="Human Resources", proc="CMN-HR-01 Recruitment & applicant tracking",
      purposes=["PUR-DEMO-005"], basis=["consent", "s7a"], principals=["Job applicant"], elements=["DE-ID-001 Full name", "DE-EDU-001 Educational qualifications & marksheets", "DE-EMP-002 Employment history"],
      systems=["SYS-DEMO-ATS"], tps=["TP-DEMO-RECR"], flags=["processor", "decision_or_disclosure"], ctx=[], conf="medium"),
 dict(id="ACT-DEMO-ADM-001", title="Office CCTV", dept="Admin & Facilities", proc="CMN-ADM-01 CCTV surveillance",
      purposes=["PUR-DEMO-006"], basis=["s7i", "s7a"], principals=["Employee", "Visitor"], elements=["DE-AV-001 CCTV footage"],
      systems=["SYS-DEMO-NVR"], tps=[], flags=[], ctx=["cctv"], conf="high"),
]
flow_n = 0
for a in acts:
    fl = []
    for s in a["systems"]:
        for t in a["tps"]:
            if (s, t) in [("SYS-DEMO-APP", "TP-DEMO-AWS"), ("SYS-DEMO-APP", "TP-DEMO-KYC"), ("SYS-DEMO-LOS", "TP-DEMO-BUREAU"), ("SYS-DEMO-CRM", "TP-DEMO-SF"),
                          ("SYS-DEMO-CRM", "TP-DEMO-SMS"), ("SYS-DEMO-XLS", "TP-DEMO-COLL"), ("SYS-DEMO-ATS", "TP-DEMO-RECR"), ("SYS-DEMO-LOS", "TP-DEMO-AWS")]:
                flow_n += 1
                fid = f"FLW-DEMO-{flow_n:03d}"
                ctry = [x for x in tps if x[0] == t][0][4]
                ttype = "to independent DF" if t == "TP-DEMO-BUREAU" else ("cross-border to processor" if ctry != "India" else "to processor")
                write(f"{B}/Data Flows/{fid}.md", dict(type="data_flow", flow_id=fid, from_system=L(s), to=L(t), activity=L(a["id"]), transfer_type=ttype,
                      cross_border=ctry != "India", country=ctry, confidence="low" if "XLS" in s else "medium", tags=["dpdp/flow"]), f"# {fid}\n\n{s} -> {t} for [[{a['id']}]]\n")
                fl.append(L(fid))
    fm = dict(type="processing_activity", activity_id=a["id"], title=a["title"], organisation=L(ORG + " Entity Profile"), entity_profile=L(ORG + " Entity Profile"),
              department=a["dept"], process=L(a["proc"]), owner="", processing_role=["data_fiduciary"], purposes=[L(p) for p in a["purposes"]],
              lawful_basis=a["basis"], data_principals=a["principals"], data_elements=[L(e) for e in a["elements"]], digital_state="digital",
              systems=[L(s) for s in a["systems"]], third_parties=[L(t) for t in a["tps"]], data_flows=fl, flags=a["flags"], context_tags=a["ctx"],
              overrides={}, confidence=a["conf"], status="assessed", tags=["dpdp/activity"])
    write(f"{B}/Activities/{a['id']}.md", fm, f"# {a['id']} - {a['title']}\n\nCatalogue template: [[{a['proc']}]]\n\n## Engine output\n![[Applicability - {a['id']}]]\n")

tests = [
 ("TST-DEMO-CTL-NOT-01-01", "CTL-NOT-01", "D05 Notice", ["ACT-DEMO-CUS-001"], "Inspection", 1, "App shows a privacy-policy link only; no standalone itemised notice; no withdraw/Board-complaint link."),
 ("TST-DEMO-CTL-CON-04-01", "CTL-CON-04", "D06 Consent Lifecycle", ["ACT-DEMO-MKT-001"], "Re-performance", 1, "Opt-out via app removed the user from the email list but SMS continued for 9 days (Salesforce -> SMS aggregator sync is manual)."),
 ("TST-DEMO-CTL-TPM-03-01", "CTL-TPM-03", "D13 Processor & Third-Party Management", ["ACT-DEMO-CUS-003", "ACT-DEMO-MKT-001"], "Inspection", 0, "No DPA with the collection agency or SMS aggregator; no breach-notification SLA."),
 ("TST-DEMO-CTL-SEC-02-01", "CTL-SEC-02", "D09 Security Safeguards", ["ACT-DEMO-CUS-003"], "Inspection", 0, "Collections Excel on a shared drive: unencrypted, 38 users have edit access, and it contains borrower + reference contacts."),
 ("TST-DEMO-CTL-SEC-07-01", "CTL-SEC-07", "D09 Security Safeguards", ["ACT-DEMO-ADM-001"], "Inspection", 2, "CCTV retained 30 days; no access logs on the NVR; policy undocumented."),
]
for tid, c, dom, acts_, tt, rating, summ in tests:
    write(f"{B}/Tests/{tid}.md", dict(type="control_test", test_id=tid, cycle=L("CYC-DEMO-2026Q4"), control=L(c), domain=L(dom), activities=[L(x) for x in acts_],
          test_type=tt, tester="Assessor A", test_date="2026-10-20", rating=rating, result_summary=summ, tags=["dpdp/test"]), f"# {tid}\n\n{summ}\n")

findings = [
 ("FND-DEMO-001", "No Rule 3 notice at app onboarding", "ACT-DEMO-CUS-001", ["OBL-NOT-01", "OBL-NOT-02", "OBL-NOT-03", "OBL-NOT-04"], ["CTL-NOT-01"], "P7", 5, 3, "Head - Digital Product"),
 ("FND-DEMO-002", "Marketing withdrawal not propagated to SMS channel", "ACT-DEMO-MKT-001", ["OBL-CON-05", "OBL-PRC-03"], ["CTL-CON-04"], "P7", 4, 3, "Head - Marketing"),
 ("FND-DEMO-003", "Processors engaged without DPA (collections, SMS)", "ACT-DEMO-CUS-003", ["OBL-PRC-01", "OBL-SEC-07", "OBL-PRC-04"], ["CTL-TPM-03"], "P1", 4, 4, "Head - Procurement"),
 ("FND-DEMO-004", "Shadow Excel with borrower & reference data, unencrypted, broad access", "ACT-DEMO-CUS-003", ["OBL-SEC-02", "OBL-SEC-03"], ["CTL-SEC-02", "CTL-SEC-04", "CTL-MAP-03"], "P1", 4, 5, "Head - Collections"),
]
def band(s):
    return "Critical" if s >= 17 else "High" if s >= 10 else "Medium" if s >= 5 else "Low"
for fid, title, act, obls, ctls, pen, lik, imp, owner in findings:
    rid = fid.replace("FND", "REM")
    write(f"{B}/Findings/{fid}.md", dict(type="finding", finding_id=fid, title=title, cycle=L("CYC-DEMO-2026Q4"), organisation=L(ORG + " Entity Profile"), activity=L(act),
          obligations=[L(o) for o in obls], controls=[L(c) for c in ctls], penalty_tier=pen, likelihood=lik, impact=imp, risk_score=lik * imp, severity=band(lik * imp),
          owner=owner, remediation=L(rid), target_date="2027-02-28", status="Accepted - remediation planned", tags=["dpdp/finding"]),
          f"# {fid} - {title}\n\nSee the test notes in `Tests` for the observed condition. Remediation: [[{rid}]]\n")
    write(f"{B}/Remediation/{rid}.md", dict(type="remediation", rem_id=rid, findings=[L(fid)], owner=owner, target_date="2027-02-28", status="Not started", tags=["dpdp/remediation"]), f"# {rid}\n")

write(f"{B}/Dashboard - DemoPay.md", dict(type="dashboard"), f"""
# DemoPay dashboard

## Activities & engine results
```dataview
TABLE applicable_count AS "Applicable", not_applicable_count AS "N/A" FROM "11 Assessments/Engine Output" WHERE contains(string(activity), "DEMO")
```

## System -> activities (graph view in table form)
```dataview
TABLE rows.file.link AS Activities FROM "{B}/Activities" FLATTEN systems AS sys GROUP BY sys
```

## Third party -> activities
```dataview
TABLE rows.file.link AS Activities FROM "{B}/Activities" FLATTEN third_parties AS tp GROUP BY tp
```

## Findings
```dataview
TABLE severity, risk_score, owner, status FROM "{B}/Findings" SORT risk_score DESC
```
""")
print("example built")
