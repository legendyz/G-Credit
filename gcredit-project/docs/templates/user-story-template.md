# User Story Template

**Story ID:** [e.g., US-XXX or Story #X]  
**Epic:** [Epic name/ID]  
**Sprint:** [Sprint number]  
**Priority:** High | Medium | Low  
**Story Points:** [1, 2, 3, 5, 8, 13]  
**Status:** [Backlog | In Progress | In Review | Testing | Done]

---

## User Story

**As a** [type of user/role],  
**I want** [goal/desire],  
**So that** [benefit/value].

### Example:
> As an HR manager,  
> I want to issue badges to multiple employees via CSV upload,  
> So that I can efficiently recognize achievements for large groups.

---

## Background / Context

[Provide context about why this story is needed. Include:]
- Business need
- User pain point
- Current workflow limitations
- Related features or stories

---

## Acceptance Criteria

[Specific, testable criteria that define when the story is complete. Use Given-When-Then format when helpful.]

### AC1: [Short title]
**Given** [initial context]  
**When** [action taken]  
**Then** [expected outcome]

**Example:**
- **Given** I am logged in as an HR admin
- **When** I upload a valid CSV file with 100 badge recipients
- **Then** All 100 badges are created successfully and recipients receive email notifications

### AC2: [Short title]
- [ ] Specific requirement 1
- [ ] Specific requirement 2
- [ ] Specific requirement 3

### AC3: [Short title]
- [ ] Specific requirement 1
- [ ] Specific requirement 2

---

## Non-Functional Requirements

### Performance
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Support for [X] concurrent users

### Security
- [ ] Authentication required: Yes/No
- [ ] Authorization: [Roles that can access]
- [ ] Data encryption: [Required/Not required]
- [ ] Input validation: [Required validations]

### Usability
- [ ] Mobile responsive: Yes/No
- [ ] Accessibility: WCAG 2.1 Level AA
- [ ] Browser support: [Chrome, Firefox, Safari, Edge]
- [ ] Internationalization: [Languages supported]

---

## Technical Details

### API Endpoints
- `[METHOD] /api/endpoint` - [Description]
- `[METHOD] /api/endpoint/:id` - [Description]

### Database Changes
- [ ] New table: [table_name]
- [ ] New columns: [column names]
- [ ] Migration required: Yes/No

### Dependencies
- [ ] External API: [API name]
- [ ] Third-party library: [library name]
- [ ] Internal service: [service name]

### Technical Constraints
- Must use existing authentication system
- Must integrate with Azure Blob Storage
- Must be backward compatible

---

## UI/UX Design

### Wireframes
[Link to Figma/Sketch/mockups]

### User Flow
1. User navigates to [page]
2. User clicks [button/link]
3. System displays [screen/modal]
4. User enters [data]
5. System validates and saves

### Mockups
[Attach or link to visual designs]

---

## Test Plan

### Unit Tests
- [ ] Test case 1: [Description]
- [ ] Test case 2: [Description]
- [ ] Test case 3: [Description]
- **Target Coverage:** > 80%

### E2E Tests
- [ ] Scenario 1: Happy path
- [ ] Scenario 2: Error handling
- [ ] Scenario 3: Edge case

### UAT Test Cases
1. **Test Case 1:** [Description]
   - **Steps:** [Step-by-step]
   - **Expected Result:** [Result]
   - **Status:** [Pass/Fail]

---

## Definition of Done

### Code Complete
- [ ] Code implemented and meets acceptance criteria
- [ ] Code follows coding standards
- [ ] Code reviewed and approved (1+ approval)
- [ ] No linting errors
- [ ] No TypeScript errors

### Testing Complete
- [ ] Unit tests written and passing (>80% coverage)
- [ ] E2E tests written and passing
- [ ] Manual testing completed
- [ ] UAT approved by stakeholder

### Documentation Complete
- [ ] API documentation updated (if applicable)
- [ ] README updated (if applicable)
- [ ] Inline code comments for complex logic
- [ ] User-facing documentation updated

### Deployment Ready
- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] Ready for production deployment

---

## Estimation

### Breakdown
| Task | Hours | Assignee |
|------|-------|----------|
| API endpoint development | 4h | [Name] |
| Database schema & migration | 2h | [Name] |
| Frontend components | 6h | [Name] |
| Unit tests | 3h | [Name] |
| E2E tests | 2h | [Name] |
| Code review & fixes | 2h | [Name] |
| Documentation | 1h | [Name] |
| **Total** | **20h** | |

### Confidence Level
[Low | Medium | High]

[If low confidence, explain uncertainties]

---

## Dependencies

### Depends On
- [ ] Story #X: [Title] - [Status]
- [ ] API integration: [Name] - [Status]
- [ ] Design mockups: [Status]

### Blocks
- [ ] Story #Y: [Title]
- [ ] Feature Z: [Description]

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Plan] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Plan] |

---

## Questions & Assumptions

### Open Questions
- [ ] Question 1: [Question] - [Owner]
- [ ] Question 2: [Question] - [Owner]

### Assumptions
- Assumption 1: [Description]
- Assumption 2: [Description]

---

## Timeline

**Estimated Start:** [Date]  
**Estimated Completion:** [Date]  
**Actual Start:** [Date]  
**Actual Completion:** [Date]

---

## Comments & Discussion

### [Date] - [Author]
[Comment or discussion note]

### [Date] - [Author]
[Comment or discussion note]

---

## Related Links

- **Epic:** [Link to epic]
- **Figma Design:** [Link]
- **API Documentation:** [Link]
- **Related Stories:** [Links]
- **Bug Reports:** [Links]

---

## Story History

| Date | Status | Author | Notes |
|------|--------|--------|-------|
| YYYY-MM-DD | Backlog | [Name] | Story created |
| YYYY-MM-DD | In Progress | [Name] | Development started |
| YYYY-MM-DD | Done | [Name] | Story completed |

---

**Example: Completed Story**

See Sprint 3 stories in [docs/sprints/sprint-3/backlog.md](../../sprints/sprint-3/backlog.md) for real examples.

**Tips for Writing Good User Stories:**
1. Keep stories small (completable in 1-3 days)
2. Focus on user value, not technical implementation
3. Make acceptance criteria testable
4. Include edge cases and error scenarios
5. Collaborate with team on estimation
6. Update status daily during sprint
