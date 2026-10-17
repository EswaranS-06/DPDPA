---
id: B02
title: Personal Data Breach Intimation to the Data Protection Board of India (Rule 7(2))
category: 6. Breach management
audience: Data Protection Board of India
publish: regulator
legal_basis: [DPDPA s.8(6); Rules r.7(2)(a),(b)]
applies_when: every personal data breach
flags: [Is-SDF, Cross-Border-Transfer]
version: 1.0
review_cycle: on any Board-prescribed format (replace fields if the Board publishes a form)
---

> **Drafting note:** File this through the Board's digital office ([DPB-Breach-Portal]) in whatever format the Board prescribes. If the Board publishes its own form, map these fields onto it. Part A is the initial intimation, filed **without delay** (Rule 7(2)(a)). Part B is the detailed report, filed **within 72 hours of becoming aware** (Rule 7(2)(b)), or within any longer period the Board allows on a written request. Keep proof of the submission time for both.

# PART A: INITIAL INTIMATION (Rule 7(2)(a))

**To:** The Data Protection Board of India
**From:** [Client-Name] (Data Fiduciary), [Client-Registered-Address], CIN [Client-CIN]
**Date & time of intimation:** [Board-Initial-Timestamp]
**Internal breach ID:** [Breach-ID]

| # | Field | Details |
|---|---|---|
| 1 | Data Fiduciary details | [Client-Name]; <!-- IF Is-SDF -->Significant Data Fiduciary (notification [SDF-Notification-Ref])<!-- END IF --><!-- IF NOT Is-SDF -->Data Fiduciary<!-- END IF -->; sector: [Sector] |
| 2 | Contact person for this breach | [DPO-Name] / [Privacy-Contact-Name], [Privacy-Contact-Designation], [Privacy-Contact-Email], [Privacy-Contact-Phone] |
| 3 | **Description: nature** of the breach | [Breach-Nature] (e.g. unauthorised access / accidental disclosure / ransomware / loss of device / alteration / loss of access) |
| 4 | **Extent**: personal data categories involved | [Breach-Data-Categories] |
| 5 | **Extent**: approximate number of Data Principals and records | [Breach-DP-Count] Data Principals; [Breach-Record-Count] records |
| 6 | **Timing**: date & time of occurrence (or estimated window) | [Breach-Occurred-At] |
| 7 | Date & time of becoming aware | [Breach-Aware-At] |
| 8 | **Location**: systems, facilities, processor, geography | [Breach-Location] |
| 9 | **Likely impact** on Data Principals | [Breach-Likely-Impact] |
| 10 | Was a Data Processor involved? | [Breach-Processor-Involved] |
| 11 | Immediate containment steps taken | [Breach-Containment] |
| 12 | Other authorities notified (CERT-In / sector regulator / police) with reference nos. | [Breach-Other-Authorities] |
| 13 | Status of intimation to affected Data Principals | [Breach-DP-Notice-Status] |

Signed: [Board-Filing-Authority], for and on behalf of [Client-Name]

---

# PART B: DETAILED REPORT (Rule 7(2)(b)), within 72 hours of awareness

**Reference to initial intimation:** [Board-Initial-Ref] dated [Board-Initial-Timestamp]
**Date & time of report:** [Board-Detailed-Timestamp]
**Extension:** <!-- IF Board-Extension-Granted -->Filed within the extended period allowed by the Board vide [Board-Extension-Ref]<!-- END IF --><!-- IF NOT Board-Extension-Granted -->Filed within 72 hours of becoming aware<!-- END IF -->

### (i) Updated and detailed description of the breach
[Breach-Detailed-Description]
- Nature: [Breach-Nature]
- Data categories and items: [Breach-Data-Categories]
- Data Principal categories (customers / employees / children / patients …): [Breach-DP-Categories]
- Number of Data Principals: [Breach-DP-Count] (of which children: [Breach-Child-Count])
- Timing: occurred [Breach-Occurred-At]; detected [Breach-Detected-At]; aware [Breach-Aware-At]; contained [Breach-Contained-At]
- Location: [Breach-Location]<!-- IF Cross-Border-Transfer -->; cross-border element: [Breach-Cross-Border]<!-- END IF -->

### (ii) Broad facts: events, circumstances and reasons leading to the breach
[Breach-Root-Cause]
(Attack vector / process failure / human error; timeline of events; controls that failed or were bypassed.)

### (iii) Measures implemented or proposed to mitigate risk
[Breach-Mitigation]
(e.g. credential resets, takedown requests, recall of data, monitoring for misuse, fraud alerts with banks, offering credit monitoring.)

### (iv) Findings regarding the person who caused the breach
[Breach-Actor-Findings]
(Internal / external; identified or unidentified; actions taken: disciplinary action, police complaint no., vendor action.)

### (v) Remedial measures taken to prevent recurrence
[Breach-Remediation]
(Control enhancements, patching, architecture changes, policy and training updates, vendor changes, with completion dates.)

### (vi) Report on intimations given to affected Data Principals
| Item | Details |
|---|---|
| Number of Data Principals intimated | [Breach-DP-Notified-Count] of [Breach-DP-Count] |
| Mode(s) | [Breach-DP-Notice-Modes] (user account / email / SMS / post / call) |
| Date(s) & time(s) | [Breach-DP-Notice-Timestamps] |
| Copy of intimation | Annexure B-1 |
| Undelivered / unreachable: steps taken | [Breach-DP-Unreachable-Steps] |
| Helpline / FAQ | [Breach-Helpline] |

### Annexures
B-1 Copy of the Data Principal intimation (B03) · B-2 Timeline of events · B-3 Forensic summary (if available) · B-4 Copies of CERT-In / regulator reports · B-5 Any extension request and Board response

### Declaration
The information above is true and correct to the best of [Client-Name]'s knowledge as at the date of this report. [Client-Name] will give the Board any further information it requests or that comes to light.

[Board-Filing-Authority], [Board-Filing-Designation], for [Client-Name] · Date [Board-Detailed-Timestamp]

---

# PART C: EXTENSION REQUEST (if needed before the 72-hour deadline)
To the Data Protection Board of India. Re: breach intimation [Board-Initial-Ref]. [Client-Name] requests an extension of [Extension-Requested-Hours] hours to file the detailed report under Rule 7(2)(b), for the following reasons: [Extension-Reasons]. The information available so far is attached. Expected date of the full report: [Extension-Expected-Date].
