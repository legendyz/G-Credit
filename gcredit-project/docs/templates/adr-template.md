# Architecture Decision Record Template

**ADR Number:** [e.g., 001]  
**Title:** [Short, descriptive title]  
**Date:** [YYYY-MM-DD]  
**Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-XXX]  
**Author(s):** [Names]  
**Deciders:** [Names of decision makers]

---

## Context

### Problem Statement
[Clearly describe the architectural problem or decision that needs to be made. What is the issue that motivates this decision?]

### Background
[Provide relevant background information:]
- Current system state
- Constraints (technical, business, time, budget)
- Assumptions
- Dependencies
- Stakeholders affected

### Goals
[What are we trying to achieve with this decision?]
- Goal 1
- Goal 2
- Goal 3

---

## Decision

### Solution
[Describe the architectural solution or approach chosen. Be specific and concrete.]

### Rationale
[Explain why this solution was chosen. What factors led to this decision?]
- Reason 1
- Reason 2
- Reason 3

### Alternatives Considered
[List and describe alternative solutions that were evaluated]

#### Alternative 1: [Name]
- **Description:** [Brief description]
- **Pros:** 
  - Pro 1
  - Pro 2
- **Cons:**
  - Con 1
  - Con 2
- **Reason for Rejection:** [Why this wasn't chosen]

#### Alternative 2: [Name]
- **Description:** [Brief description]
- **Pros:**
  - Pro 1
- **Cons:**
  - Con 1
- **Reason for Rejection:** [Why this wasn't chosen]

---

## Consequences

### Positive Consequences
[What benefits will result from this decision?]
- Benefit 1
- Benefit 2
- Benefit 3

### Negative Consequences
[What drawbacks or trade-offs does this decision introduce?]
- Drawback 1
- Drawback 2

### Risks
[What risks are associated with this decision?]
- **Risk 1:** [Description]
  - **Mitigation:** [How to mitigate]
- **Risk 2:** [Description]
  - **Mitigation:** [How to mitigate]

---

## Implementation

### Changes Required
[What changes need to be made to implement this decision?]
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Migration Path
[If applicable, how will we migrate from the old approach to the new one?]
1. Step 1
2. Step 2
3. Step 3

### Timeline
[Expected implementation timeline]
- **Start Date:** [YYYY-MM-DD]
- **Target Completion:** [YYYY-MM-DD]
- **Estimated Effort:** [e.g., 2 weeks, 5 person-days]

---

## Validation

### Success Criteria
[How will we know if this decision was successful?]
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Metrics
[What metrics will we track to measure success?]
- Metric 1: [e.g., API response time < 200ms]
- Metric 2: [e.g., Test coverage > 80%]
- Metric 3: [e.g., Developer onboarding time < 2 hours]

### Review Date
[When will we review this decision?]
**Scheduled Review:** [YYYY-MM-DD]

---

## Related

### Related ADRs
- [ADR-XXX: Related Decision Title](./XXX-related-decision.md)

### Related Documents
- [Technical Specification](../architecture/system-design.md)
- [API Documentation](../../backend/docs/api/README.md)

### References
- [External link or resource 1](https://example.com)
- [External link or resource 2](https://example.com)

---

## Notes

### Discussion Log
[Key points from discussions leading to this decision]
- [Date] - [Note]
- [Date] - [Note]

### Update History
[Track changes to this ADR after initial acceptance]
| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | Name | Initial draft |
| YYYY-MM-DD | Name | Updated after review |

---

**Example: How to Use This Template**

See [ADR-002: Lodash Security Risk Acceptance](../../decisions/002-lodash-security-risk-acceptance.md) for a real example.

**Tips:**
1. Keep it concise - aim for 1-2 pages
2. Focus on "why" not just "what"
3. Document alternatives seriously considered
4. Update status as decision evolves
5. Link to related documentation
6. Include concrete examples when helpful
