Implement TourneyUp Universal Tournament Points System
Implement a universal Tourney Points (T) system for TourneyUp. The website already has a leaderboard section with Weekly, Monthly, All-time, and game-specific filters. The leaderboard UI and existing functionality are already built, so do not redesign or rebuild them. Integrate the new scoring logic into the existing system.
1. Universal Scoring Rules
Use the same base scoring table across all supported categories: traditional sports, esports, and academic competitions.
Final result
Base points
1st place
100 T
2nd place
70 T
3rd place
50 T
4th–8th place
25 T
Participated but finished outside the top 8
10 T
Registered but did not participate
0 T
Award participation points only when the player has actually participated in at least one valid match or competition round. Registration alone must never generate points.
For team-based competitions, award the appropriate points to every eligible player in the organizer-confirmed roster. Prevent duplicate awards to the same player for the same tournament.
2. Tournament Size Bonus
Use the following initial formula:
Final Points = Base Points × (1 + 0.2 × log10(N))
Where:
Base Points are determined by the final tournament placement.
N is the number of actual participating individuals in individual competitions or participating teams in team competitions.
N must be at least 1.
Round the final result to the nearest whole number.
This bonus rewards participation in larger competitions without considering opponents' previous rankings or skill ratings.
Keep the scoring constants configurable so they can be adjusted later without rewriting the entire scoring system.
3. Organizer Workflow and Automatic Scoring
Integrate scoring with the existing tournament management workflow.
Organizers create tournaments and configure their competition format.
Organizers enter and edit match results through the existing match-management interface.
The system determines participation and final placements from valid, finalized results.
Calculate points automatically when tournament results are finalized.
Do not award points for registrations, unplayed matches, incomplete tournaments, or unconfirmed results.
When an organizer edits finalized results, recalculate the affected tournament scores and leaderboard totals correctly.
When a tournament is cancelled, reverse its previously awarded points.
Store an audit history of score changes, including the reason, timestamp, and organizer responsible.
Do not allow organizers to manually award arbitrary points through the normal result-entry interface.
4. Existing Leaderboard Integration
Preserve the current leaderboard layout, design, navigation, filters, and game-selection functionality.
Connect the existing leaderboard to the scoring system:
Weekly: points earned during the current week.
Monthly: points earned during the current calendar month.
All-time: all valid points earned across completed tournaments.
By Game: points earned in the selected game or competition category.
Use the tournament's official completion/result-finalization timestamp for the time-based filters. Use the project's existing timezone conventions.
Keep all-time totals independent from weekly and monthly views. Weekly and monthly filters must not reset or remove previously earned points.
If the existing leaderboard supports ranking positions, profile images, usernames, or other player information, preserve those features.
5. Fairness and Data Integrity
Apply the same base scoring table to all games and categories.
Use participating teams as N for team competitions and participating individuals as N for individual competitions.
Exclude registered users who never actually participated.
Prevent duplicate scoring when results are submitted more than once.
Recalculate scores safely when match results or final placements change.
Keep score changes consistent with the existing database and avoid double-counting.
Handle ties according to the competition's existing rules. Do not invent tie-breaking rules if the project already defines them.

Do not trust client-side calculations for awarding points; validate and calculate points on the server/backend where available.
6. Implementation Requirements
First inspect the existing codebase, database schema, tournament models, match-result workflow, and leaderboard implementation.
Reuse the current architecture, components, styling, naming conventions, and database structures wherever possible. Do not create duplicate leaderboard pages, duplicate tournament systems, or unnecessary new UI.
Implement the feature end-to-end, including required database changes, scoring logic, leaderboard queries, and integration with organizer result management.
If the project currently uses mock data or does not have a backend, adapt the implementation to its actual architecture and clearly identify any functionality that cannot yet persist real tournament results.
Add tests for:
Each placement's base score.
Registration without participation.
Tournament-size bonus calculation.
Duplicate result submissions.
Result edits and score recalculation.
Cancelled tournaments.
Weekly, monthly, all-time, and game-specific leaderboard totals.
Finally, summarize which files were changed, how the scoring system works, and any backend or database requirements that remain.
# Task: Add a New My Teams Section to TourneyUp

Create a new My Teams section in the existing TourneyUp application.

IMPORTANT:
- My Teams is a new standalone section in the main application navigation.
- Messages already exists and will contain a separate My Teams subsection for team communication.
- This new section manages teams; it is not another messaging page.
- Inspect the existing project structure, design system, authentication, tournament registration flow, and database before implementing.
- Reuse existing components and data models. Do not create duplicate team records or rebuild unrelated features.

## Purpose

My Teams allows users to create and manage multiple teams across sports, esports, and other team-based competitions.

For example, one user may create a football team, a Valorant team, and another team for a different competition. Each team must be managed independently.

## 1. My Teams Dashboard

Create a dashboard displaying the teams the current user owns or belongs to.

Each team card should display:
- Team logo or avatar.
- Team name.
- Game or sport.
- Team owner or captain.
- Number of members.
- Relevant team information.
- A button to open and manage the team.
- A clear indication of the user's role in the team.

Provide a prominent Create Team action.

Include appropriate empty, loading, and error states. When a user has no teams, explain the feature and provide a clear option to create their first team.

## 2. Create Team

Allow users to create a team by entering:
- Team name.
- Game or sport.
- Team logo or avatar, if supported.
- Short description, if appropriate.

Validate required fields and follow the project's existing naming and uniqueness rules.

Assign the creator as the team owner or captain.

Support multiple teams per user, subject to any existing platform limits.

## 3. Team Details and Management

Each team should have its own details page or management view.

Include:
- Team information.
- Member list.
- Member roles.
- Invitations and membership management.
- Team roster.
- Relevant competition participation and team status, where supported.

Team owners or authorized captains should be able to:
- Edit team information.
- Invite teammates.
- Remove members when authorized.
- Manage team roles.
- Transfer ownership if supported by the existing permission model.
- Disband the team, with appropriate confirmation and safeguards.

Regular members should have permissions appropriate to their role and must not be able to perform owner-only actions.

Use secure invitation and membership flows. Prevent duplicate memberships and unauthorized roster changes.

## 4. Team-Based Tournament Integration

Connect My Teams to TourneyUp's existing tournament and registration system.

- When a tournament requires a team, allow eligible users to register one of their existing teams.
- Display the tournament's required roster size and eligibility rules.
- Validate team eligibility before accepting registration.
- Allow only authorized team members to manage or submit team registrations.
- Respect roster locks, registration deadlines, and existing tournament rules.
- Keep team participation and tournament registration records synchronized.
- Do not require a team for individual competitions such as individual chess tournaments unless the existing competition format explicitly requires one.

Do not automatically register every team for tournaments.

## 5. Integration with Messages

Each team must have its own dedicated communication group in the existing Messages section.

Requirements:
- Creating a team should create or initialize its corresponding team communication group, using the existing architecture.
- The team group should appear automatically under Messages → My Teams for its eligible members.
- Do not create a second team or duplicate membership record for messaging.
- Team membership changes must update communication access appropriately.
- Only authorized current team members should access private team conversations.
- Team messages and team management must remain separate interfaces.
If the current messaging backend cannot create persistent groups, implement the integration using the existing architecture and document any missing backend functionality.

## 6. Design Requirements

- Match TourneyUp's current design system, colors, typography, components, and navigation.
- Keep the interface modern, clean, and competitive in feel.
- Use consistent team cards, member avatars, role indicators, and clear action buttons.
- Make team creation and member management straightforward.
- Ensure responsive layouts for desktop and mobile.
- Include confirmation dialogs for destructive actions.
- Implement real loading, success, validation, and error states.

## 7. Data Model and Security

Inspect and reuse existing database models where possible.

Ensure that:
- Each team has a unique identifier.
- Team ownership and membership are stored persistently.
- Membership roles and permissions are enforced on the backend.
- Team membership changes are reflected in the relevant communication groups.
- Team records remain consistent with tournament registrations.
- Deleting or disbanding a team does not silently corrupt historical tournament results or leaderboard records.

Preserve historical tournament records even when a team is later disbanded, according to the existing data model.

## 8. Implementation Workflow

1. Inspect the existing project and navigation.
2. Review authentication, database schema, tournament registration, and Messages integration.
3. Add My Teams to the existing navigation without duplicating routes or components.
4. Implement team creation, listing, details, editing, and member management.
5. Connect teams to team-based tournament registration.
6. Integrate each team with its dedicated Messages group.
7. Add validation, permission checks, and responsive states.
8. Test multiple teams per user, invitations, roster changes, tournament eligibility, and messaging access.

Implement the feature end-to-end using the project's existing stack. Do not replace real functionality with mock data if the backend already supports the required operations.

Finally, summarize the files changed, database changes, completed features, and any remaining backend requirements.
# Task: Redesign and Implement the Existing Messages Section in TourneyUp

The Messages section already exists in the TourneyUp project. Override and replace its current implementation with the communication system described below.

IMPORTANT:
- Inspect the existing codebase and current Messages implementation first.
- Modify the existing Messages section instead of creating a duplicate.
- Preserve TourneyUp's current design system, navigation, authentication, and reusable components wherever appropriate.
- Remove the old messaging UI and functionality that conflicts with this specification.
- Do not implement Discord-style servers, nested channels, unrestricted direct messages, voice calls, or video calls.
- Build a functional interface consistent with the rest of the application, not just a static mockup.

## Messages Layout

Create four main sections within Messages:

### 1. Organization Channels

Display the official announcement channels belonging to tournament organizations.

Each organization channel should support:
- Organization name, logo, and channel information.
- Official announcements and updates from authorized organization admins.
- Tournament announcements, important dates, rules, and other relevant information.
- Chronological posts with timestamps and appropriate announcement formatting.
- Read-only access for regular followers or members, unless the organization explicitly grants additional permissions.

Users should be able to discover and follow relevant organization channels according to the existing platform's permissions and data model.

An organization channel is an announcement space for the organization as a whole, not a group dedicated to a single tournament.

### 2. Tournament Channels

Every tournament can have its own dedicated communication group, separate from its organization's announcement channel.

Required behavior:
- Create or initialize the tournament channel when appropriate within the tournament lifecycle.
- During registration, access and visibility must follow the tournament's existing rules.
- When registration closes and participants are confirmed, automatically add eligible registered players and, for team competitions, eligible team members according to the tournament format.
- Include the tournament organizer and authorized tournament admins in the channel.
- Allow participants, organizers, and authorized admins to send messages according to their roles.
- Allow organizers and admins to publish important announcements, schedules, match instructions, score updates, rule changes, and other tournament information.
- Display the tournament name, status, relevant dates, and participant information.
- Support membership updates when registrations, team rosters, or tournament eligibility change.
- Prevent unauthorized users from joining or reading private tournament channels.
- Handle cancelled tournaments and completed tournaments according to the existing platform's access and retention policies.

The tournament organizer and authorized admins must remain able to communicate with participants in the tournament channel. Do not restrict communication to players only.

Do not create nested child channels inside tournament channels. Each tournament has one dedicated communication group.

### 3. My Teams

Include a My Teams entry within Messages that connects to the user's teams managed by the separate My Teams section.

Requirements:
- Automatically display the teams the current user owns or belongs to.
- Each team should have its own dedicated communication group.
- Show the team name, logo, member information, and recent message preview.
- Allow authorized team members to communicate within their team's group.
- Sync teams and memberships with the actual My Teams data model.
- Do not create separate duplicate team records or require users to create their teams again inside Messages.

If the user has not created or joined any teams, display an appropriate empty state with a link to the My Teams section.

### 4. Support
 Provide a dedicated support interface where users can contact the TourneyUp support team.

Support should allow users to:
- Describe a problem.
- Report tournament-related issues or inappropriate behavior.
- Ask for technical assistance.
- View their existing support conversations and replies.
- Track the status of a support request where supported by the backend.

Support conversations should be private to the user and authorized support personnel. Do not expose support requests to tournament participants or other users.

## Interface and UX

- Preserve TourneyUp's existing visual identity and responsive behavior.
- Provide clear navigation between the four categories.
- Use a clean messaging layout with a conversation/channel list and a selected channel or conversation view.
- Include unread indicators, timestamps, message history, and appropriate loading, empty, and error states.
- Make the layout responsive for desktop and mobile.
- Provide clear role-based visual distinctions for official announcements, admin messages, and participant messages.
- Follow existing accessibility and keyboard-navigation patterns.

## Permissions and Data Integrity

Use the existing authentication and authorization system.

- Organization admins can publish to their authorized organization channels.
- Tournament organizers and authorized tournament admins can manage their tournament channels.
- Eligible tournament participants can access their respective tournament groups.
- Team groups are accessible only to authorized team members.
- Support conversations are accessible only to the requesting user and authorized support staff.
- Never rely exclusively on frontend checks for access control.
- Prevent duplicate channel memberships and duplicate message delivery.
- Use the existing backend and database where possible.

## Implementation Workflow

1. Inspect the existing Messages components, routing, database schema, and permission model.
2. Identify reusable components and conflicting legacy functionality.
3. Implement the new four-part Messages structure.
4. Integrate tournament membership automation with the existing registration and confirmation workflow.
5. Connect My Teams to the shared team and membership data.
6. Implement or integrate the required backend persistence and access controls.
7. Test permissions, automatic membership updates, message sending, unread indicators, and responsive layouts.

Do not rebuild unrelated sections of TourneyUp. Avoid placeholder-only functionality when the existing backend can support real operations. If a required backend capability is missing, implement what is supported by the current architecture and clearly identify the remaining requirement.

At the end, summarize the modified files, implemented behavior, database changes, and any remaining limitations.
Update the existing Results section in TourneyUp into a fully functional Competition section. The website is already built, so modify the existing implementation without rebuilding the site or changing its theme.
1. Competition page structure
The Competition page must support multiple tournaments simultaneously.
Display a list of tournaments with useful information such as:
Tournament name and category
Organizer
Tournament status
Competition format
Number of participants
A clear way to open the tournament
Allow users to search or filter tournaments if consistent with the existing design.
Important navigation flow:
The user opens Competition.
The user sees the available tournaments.
The user selects a tournament.
The selected tournament opens its own competition page or detail view.
Inside that tournament, display three tabs: Overview, Match History, and Schedule.
All three tabs must show data belonging exclusively to the selected tournament. Switching between tournaments must never mix their matches, standings, schedules, or results.
2. Automatic tournament operation
The system itself must handle competition generation and progression. Organizers should not have to manually generate every round or create every match.
When an organizer creates a tournament, they select one of these formats in the existing tournament creation form:
Single Elimination
Double Elimination
Round Robin
Group Stage + Knockout
Swiss System
The organizer configures the tournament as usual and manages registration through the existing system.
When registration closes and the tournament becomes eligible to start, TourneyUp must automatically:
Identify eligible, approved participants according to existing registration and payment rules.
Randomly assign participants to matches where appropriate, respecting any configured seeding rules.
Create and save the initial matches, rounds, and bracket or standings structure.
Automatically update the competition page to display the generated structure.
Allow the organizer to schedule the matches by assigning their dates and times.
The organizer must not need to click a manual "Generate Bracket" button as part of the normal workflow.
Use a reliable server-side mechanism triggered by the tournament lifecycle, such as an appropriate transactional server action or background job if the architecture requires it. Do not rely on the user opening or refreshing a page to trigger generation.
The process must be idempotent: retries, repeated events, and concurrent requests must never create duplicate matches or reshuffle an existing draw.
If registration is cancelled, reopened, or changed after the draw has been created, protect the existing bracket and require an appropriate controlled process for changes.
3. Competition formats
Each format must have its own correct rules and automated progression.
Single Elimination: Automatically create the initial bracket. Winners advance when official results are finalized, and losers are eliminated. Handle byes correctly.
Double Elimination: Automatically manage winners and losers brackets, participant progression, and the grand final.
Round Robin: Automatically create pairings so every participant plays every other participant once. Calculate standings and apply consistent tiebreaking rules.
Group Stage + Knockout: Automatically distribute participants into groups, create group matches, calculate standings, qualify the required participants, and create the knockout bracket when qualification is finalized.
Swiss System: Automatically create each round's pairings based on the current standings. Avoid repeat opponents wherever possible, handle byes, and create the next round only when the previous round's results are finalized.
Do not regenerate completed rounds or change existing pairings simply because a page is refreshed.
4. Organizer responsibilities
Organizers should primarily be responsible for:
Creating and configuring tournaments.
Managing registrations according to existing permissions.
Assigning or adjusting match dates and times.
Recording and confirming official match results.
Correcting errors through a controlled process.
The website should handle match creation, standings, progression, and format-specific rules automatically.
When an organizer records a valid final result, the system must automatically update the relevant bracket, standings, qualification status, and subsequent matches as required by the selected format.
5. Three tabs inside each tournament
Overview: Show the actual competition structure for the selected format, including brackets, groups, or standings.
Match History: Show only matches that have actually been played and finalized, including participants, scores, winners, rounds, and dates. Keep the initial implementation simple; advanced statistics can come later.
Schedule: Show scheduled and upcoming matches, their participants when known, and their dates and times. Clearly distinguish unscheduled matches.
If a tournament has not reached the stage where matches can be created, show an appropriate status and empty state rather than fabricated matches.
6. Reliability and integration
Reuse the existing project architecture, database models, components, authentication, and authorization wherever possible.
Persist all generated matches and competition data. Ensure that each match belongs to the correct tournament and that only authorized organizers can modify official results or schedules.
Use appropriate transactions, constraints, and validation to protect against duplicate generation, invalid results, incorrect advancement, and inconsistent standings.
Keep the existing TourneyUp theme and change only what is necessary for this functionality.
Test the automatic lifecycle, all five formats, multiple tournaments, result finalization, progression, duplicate requests, and relevant edge cases.
Implement the actual working functionality, not merely the interface. At the end, summarize the changes and report any incomplete functionality or failed tests.