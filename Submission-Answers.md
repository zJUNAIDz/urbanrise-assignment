# Urbanrise Pre-screening Assignment

**Candidate:** Junaid Shaikh (<junaidshaikh3967@gmail.com>)
**Role:** Full-stack
**Date:** 18 November 2026

## Part B — Your own work

### 1. The last production problem you fixed

I have not yet owned a customer-facing production incident end to end, so I do not want to present a development issue as a production incident. In my previous work, I built an asynchronous workflow for an AI SEO-audit product using BullMQ and persisted job state in the database. The system needed to handle retries, partial failures and idempotent processing, but I do not have a verified production incident with an exact error, root cause and post-fix measurement to report. I would rather be precise about that gap than invent an incident.

### 2. One number you moved at work

I do not currently have a defensible before-and-after business metric that I can attribute solely to my work. I worked on the implementation of an AI SEO-audit workflow, but I did not own a measured KPI with a reliable baseline and post-change measurement. I would not claim that a feature improved conversion, latency or revenue without instrumentation and evidence. In a new role, I would agree on the metric and measurement window before making a change, then compare like-for-like cohorts.

### 3. A time an AI tool gave you something wrong

While building the AI SEO audit platform, I asked an AI coding assistant to implement a feature based on the existing codebase. It assumed a different architectural flow than the one I had designed, which led to unintended behavior in how the components interacted. Initially, I corrected the resulting code manually, but realized the underlying issue was that the AI lacked the right architectural context. I then explicitly described the intended architecture, data flow, and mechanisms involved, and asked it to work within those constraints. The output became much more consistent. It taught me that AI tools need concrete system context, not just feature-level instructions, and that I still need to verify the result.

### 4. Something you built that you would build differently today

I built RelayCat, a real-time collaboration/chat application with a TypeScript stack, PostgreSQL, Redis, Socket.IO and supporting services. Today I would narrow the first release to one complete vertical slice: sign-in, one conversation, message persistence, delivery acknowledgement and reconnect behavior. I would deploy that slice and test it with real users before expanding into uploads, presence, moderation and other capabilities. That would expose operational and product assumptions earlier and reduce the amount of unfinished surface area. I would still keep shared contracts and clear service boundaries, but I would let validated requirements drive the architecture.

### 5. Which layer are you weakest on today, and how would you close the gap?

My weakest layer is running software in production. I am comfortable building application features and working with databases, but I have less experience owning a customer-facing service through deployment, monitoring, incidents and recovery. In the first 30 days, I would learn the existing deployment path, environments, logs, alerts, release process and rollback procedure. In days 31–60, I would own a small service change from implementation through deployment, with health checks, structured logs and basic latency/error monitoring. In days 61–90, I would practise a rollback and a database restore, review one incident with the team, and document an operational runbook. I would ask for review rather than pretend to know the company's production setup on day one.

## Part C — Business problem: reduce site-visit no-shows

### Approach

I would start with a reminder-and-confirmation workflow connected to the CRM, rather than build a new scheduling system. When a site visit is booked or rescheduled in the CRM, an event should create or update a reminder record with the visit ID, customer contact, project, time and assigned executive. Send a WhatsApp template message 24 hours before the visit with clear **Confirm**, **Reschedule** and **Cancel** actions. Send one shorter reminder a few hours before the slot to customers who confirmed. If a customer cancels or asks to reschedule, update the CRM immediately and release the slot. If there is no response by a defined cutoff, create a pre-sales follow-up task and offer the slot to a waitlist or another customer. Keep the CRM as the source of truth; the reminder service should not maintain a separate competing appointment record.

I would use the company's existing WhatsApp Business provider if it supports approved templates and delivery/status webhooks. The integration should be event-driven and idempotent: duplicate CRM events or webhook retries must not send duplicate reminders or create duplicate tasks. Store message status, customer response, timestamps and the resulting CRM action for auditability. Provide a manual path for executives when a customer calls instead of replying.

### Measure

The primary measure should be the **site-visit no-show rate**: visits marked No show divided by visits that remained scheduled at the agreed cutoff. The brief says roughly half of booked customers currently do not turn up, so I would use **about 50% as the provisional baseline**, then validate it against CRM data before treating it as a measured baseline. A reasonable initial target is **30% or lower within four to six weeks of rollout**. I would also watch the proportion of released slots that are refilled as a guardrail, because reducing no-shows is less useful if cancellations are not surfaced early enough to reuse the slot.

### First two weeks

- Sit with pre-sales and site executives; map how visits are booked, confirmed, cancelled and marked No show today.
- Inspect CRM fields, event/webhook options, WhatsApp provider capabilities, template approval and customer consent requirements.
- Query recent visit history to establish a reliable baseline, including cancellation timing and no-show definitions.
- Agree on statuses, response cutoffs, escalation ownership and the exact customer message with sales operations.
- Design the smallest integration: CRM event in, reminder scheduled, reply/status webhook in, CRM update out.
- Build the reminder worker with idempotency keys, retry/backoff, delivery logging and a manual retry path.
- Add Confirm, Reschedule and Cancel handling; route ambiguous replies to a human instead of guessing.
- Test duplicate events, invalid numbers, undelivered messages, late cancellations and CRM downtime.
- Pilot with one project or a small executive group; keep the existing manual process as fallback.
- Review delivery, response and no-show data with the team, fix workflow friction, and decide whether to expand the pilot.

### What could go wrong

First, contact data may be stale, messages may not be delivered, or customers may not use WhatsApp. I would track delivery failures and provide a pre-sales call or another approved channel as a fallback; I would also respect consent and opt-out requirements. Second, CRM data and real-world changes may be out of sync: a visit can move by phone while a reminder is already queued. I would re-check the current CRM appointment before sending and make all updates idempotent, with a visible manual override. Third, a customer may confirm and still not arrive, or an executive may fail to update the outcome. Confirmation is not attendance, so the workflow must still rely on the executive's post-visit status and measure actual attendance, not message clicks.

## AI-use appendix

**Tool used:** ChatGPT (GPT-6) Free Tier via VS Code Copilot.

**How it was used:** Assignment interpretation; implementation planning; drafting and reviewing the Node.js backend, mobile-first interface and automated tests; identifying test cases; and structuring the Part C proposal. The candidate reviewed the generated implementation and ran the test suite. One incorrect assumption about the executive field format was caught by a failing test and corrected after checking the supplied CSV.

**Prompts / tasks used:**

1. Read the Urbanrise assignment and identify the deliverables, acceptance criteria and submission checklist.
2. Inspect the supplied `visits.csv`; identify its columns, executives, dates, missing values and implications for the UI.
3. Design and implement a small Node.js service to list one executive's visits for one date and update a visit outcome and next action.
4. Enforce the allowed outcome values, mask phone numbers in API responses, and return clear HTTP 400 and 404 errors.
5. Build a mobile-first single-screen interface for viewing visits and saving outcomes.
6. Add automated backend tests for filtering, phone masking, validation, persistence and unknown visit IDs.
7. Draft the README, additional test plan and business proposal for reducing site-visit no-shows.
8. Review the implementation against the assignment requirements and correct issues exposed by tests.

No external customer data or real customer contact details were used; the provided dataset is synthetic.
