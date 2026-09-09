---
id: "005"
title: Get a morning brief from your calendar, inbox and the news before you wake
category: Builds
type: Prompt
platforms: [Cowork, Claude]
added: 2026-09-09
updated: 2026-09-09
---

/morning

Run the morning brief for today in Australia/Melbourne, Australian English.

Gather from whichever of these respond: Microsoft 365 Outlook calendar, Outlook email, Teams, Gmail, [CUSTOM MAIL CONNECTOR]. Skip connector suggestion cards on this run.

Style the page with the francis-valente-brand skill, keeping the morning structure: orange #ff5c00 only on Needs attention numerals and action buttons (hover #cc4a07), greyscale terrain, Gladiator headline at 28px minimum, JetBrains Mono for everything else, no gradients, shadows or em dashes.

Include action buttons.

Sections:
- Overnight leads: dealer referrals and lead notifications (aggregator document or application emails), last 24 hours, oldest waiting first.
- Navaro and Recharge: website intake, chatbot leads or enquiries for those two businesses, last 24 hours, drop the section when empty.
- Settlements and commissions: remittances and lender settlement or commission emails, what landed and what is pending.
- Going stale: my sent emails to clients, lenders, BDMs, referral partners and networking contacts with no reply after 2 to 3 days, plus admin or committee threads I started and have not closed off.
- New reviews: Google Business Profile review notifications, last 24 hours, stars and opening line.
- News worth my time, last on the page: 3 to 6 items across rates and macro, Australian lending industry, auto and asset finance (EV, FBT, novated), AI from a consultancy lens, small business conditions. Each with a why-it-matters-to-me line and a source link. Sources in strict order: primary (RBA, ABS, ASIC, APRA, ATO, Treasury, FCAI, lender and aggregator announcements, Anthropic, OpenAI and DeepMind blogs), then wires (Reuters, AP, Bloomberg), then trade press (Australian Broker, The Adviser, Mortgage Business, Drive, CarExpert, SmartCompany, Simon Willison, The Batch, Ars Technica). Never ABC, never Sky News, never opinion or editorial.

No weather.

Publish to the existing Morning Brief artifact so the URL stays stable: [ARTIFACT URL].

Then email me at [EMAIL] via [CUSTOM MAIL CONNECTOR] (Microsoft 365 if unreachable), subject "Morning brief" plus the date, body: the headline, Needs attention as a plain numbered list, the page link, nothing else.
