# Spec Delta

## Purpose

Turns a job link or a company and role into a researched picture of the hiring process (how many rounds, what each round asks and expects, and what the company wants) that drives every practice session, plan, and piece of feedback.

## ADDED Requirements

### Requirement: My Jobs
The system SHALL show all of the person's jobs on My Jobs, each with company, role, next round and its date, status (Preparing, Offer, Rejected, Withdrawn), and readiness for the next round, plus an Add a job action. Closed jobs SHALL appear in a separate Past jobs list.

#### Scenario: Several jobs
- **WHEN** the person has jobs at Salesforce and Google
- **THEN** both appear as cards, sorted by the date of their next round

#### Scenario: No jobs yet
- **WHEN** the person has no jobs
- **THEN** My Jobs shows only the Add a job prompt with its two input options

### Requirement: Add a job by link or by company and role
The system SHALL let the person add a job by pasting a job posting link, by pasting the posting text, or by entering a company and role title.

#### Scenario: Link works
- **WHEN** the person pastes a public job posting link
- **THEN** the system reads the posting and starts research

#### Scenario: Link cannot be read
- **WHEN** the link needs a login or blocks reading (for example a LinkedIn job page)
- **THEN** the system says it could not read the page and asks the person to paste the posting text, keeping the link for reference

#### Scenario: Company and role only
- **WHEN** the person enters "Salesforce" and "Sales Manager" with no link
- **THEN** the system researches the role at that company and may suggest a current public posting for the person to confirm

### Requirement: Research content
The research SHALL produce: what the company generally wants (values, traits, what it rewards); the role's key skills; the likely number of rounds; and for each round its name, format, length, interviewer type, what is asked (question types and sample questions), and what is expected (how candidates are judged).

#### Scenario: Rounds found
- **WHEN** research completes for Salesforce Sales Manager
- **THEN** the brief lists each likely round with format, length, what is asked, and what is expected, and a company section with what Salesforce looks for

### Requirement: Requirements against the resume
The research SHALL list the job's requirements, taken from the posting when one exists, and mark each one met, partly met, or missing against the person's resume with a short reason.

#### Scenario: Posting with a years requirement
- **WHEN** the posting asks for 7 years of experience and the resume shows 3
- **THEN** that requirement is listed as partly met or missing with the reason

### Requirement: Round scorecard
The research SHALL give each round a scorecard of 3 to 5 criteria, each with what a strong candidate shows and a source tag. A Full interview review for that round SHALL score every criterion from 0 to 10.

#### Scenario: Review against the scorecard
- **WHEN** the person finishes a Full interview for a round with three criteria
- **THEN** the results show a score and a short reason for each of the three

### Requirement: Source check
A fact tagged From the web SHALL cite a page the search returned and SHALL be supported by that page's text. A fact that fails either test SHALL be shown as inferred and not verified. The web tag SHALL show the site name.

#### Scenario: Unsupported claim
- **WHEN** a round question cites a page that does not contain it
- **THEN** the question is shown as inferred and not verified, with no link

### Requirement: Source tags
Every fact in the brief SHALL carry one source tag: From the job post, From the web (with a clickable link), From your resume, or General knowledge. General knowledge items SHALL show a "not verified" label.

#### Scenario: Unverified round structure
- **WHEN** no public source describes the round structure
- **THEN** the rounds are tagged General knowledge, marked not verified, and the brief says the person should confirm them

### Requirement: Research progress
The system SHALL show research progress as a live list of steps (reading the post, searching interview reports, checking company values, matching against the resume) and finish within 90 seconds or show what it has with a retry option.

#### Scenario: Slow research
- **WHEN** research passes 90 seconds
- **THEN** the system shows the partial brief, marks missing sections, and offers to retry them

### Requirement: Confirm rounds and details
Before creating the job, the system SHALL let the person review the brief, add, remove, rename, or reorder rounds, and enter for each round a date (optional), interviewer notes (optional), and whether it is done. It SHALL ask only for details research could not find.

#### Scenario: Create the job
- **WHEN** the person confirms three rounds and sets the final round to Nov 26
- **THEN** the job is created with those rounds and its job page opens

### Requirement: Job and round pages
The job page SHALL show the brief and the rounds as selectable items with status. Selecting a round SHALL open the round page with its details, today's plan task, and the five tools: Full interview, Call, Feedback, Single questions, Chat. The top bar SHALL show the selected job and round and let the person switch.

#### Scenario: Switch round
- **WHEN** the person switches from "Hiring manager" to "Final" in the top bar
- **THEN** the round page, plan, and all five tools use the Final round's content

### Requirement: Research used everywhere
Questions, follow-ups, feedback, and plans for a round SHALL use that round's question types and expectations and the company section of the brief.

#### Scenario: Round-specific question
- **WHEN** the Final round brief says "expects a 30-60-90 day plan"
- **THEN** a full interview for that round includes a question asking for a 30-60-90 day plan

### Requirement: Edit and refresh research
The system SHALL let the person edit any brief item and re-run research for a job, keeping their own edits unless they choose to replace them.

#### Scenario: Re-run research
- **WHEN** the person re-runs research after editing a round's expectations
- **THEN** new findings are shown beside their edit and their edit is kept until they choose otherwise
