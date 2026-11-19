# Spec Delta

## Purpose

Lets a person create an account, sign in without a password, and keep their interview preparation private to them.

## ADDED Requirements

### Requirement: Email link sign-in
The system SHALL let a person sign up or sign in by entering an email address and opening a one-time link sent to that address. There SHALL be no password and no anonymous or demo mode.

#### Scenario: New person signs up
- **WHEN** a new person enters their email on the sign-in screen and opens the emailed link
- **THEN** they are signed in and taken to onboarding

#### Scenario: Returning person signs in
- **WHEN** a person who finished onboarding opens a new sign-in link
- **THEN** they are taken to My Jobs

#### Scenario: Expired link
- **WHEN** a person opens a link that has expired or was already used
- **THEN** the system shows a message and a field to send a new link

### Requirement: Protected screens
The system SHALL show only the landing page and sign-in screen to signed-out visitors and redirect every other screen to sign-in.

#### Scenario: Signed-out visitor opens a job page
- **WHEN** a signed-out visitor opens a job page URL
- **THEN** they are redirected to sign-in and returned to that page after signing in

### Requirement: Data isolation
The system SHALL let each person read and change only their own data, enforced by the database, not only by the interface.

#### Scenario: Another person's job
- **WHEN** a signed-in person requests a job id that belongs to someone else
- **THEN** the system returns not found and no data from that job

### Requirement: Settings
The system SHALL provide a Settings screen with profile and resume, theme (Light default, Dark), sign out, and delete account.

#### Scenario: Sign out
- **WHEN** the person chooses Sign out
- **THEN** the session ends and the landing page opens

#### Scenario: Delete account
- **WHEN** the person chooses Delete account and types DELETE to confirm
- **THEN** the system removes their account, jobs, rounds, answers, chats, and resume file, and opens the landing page
