# Screen design

The frontend contains 98 view components. Mobile prioritizes today and quick actions; tablet uses list/detail split panes; desktop exposes timeline and side panels.

| Area | Routes | Goal |
| --- | --- | --- |
| Auth | `/auth/login`, `/auth/signup`, `/auth/onboarding` | identity and mode setup |
| Home | `/`, `/calendar`, `/notifications`, `/dday` | daily summary |
| Planner | `/planner`, `/planner/weekly`, `/planner/monthly` | Plan vs Actual |
| Records | `/events`, `/tasks`, `/routines`, `/diary`, `/memos` | CRUD and filters |
| Insight | `/stats`, `/stats/compare`, `/insight` | trends and comparison |
| Social/Admin | `/share`, `/chat`, `/community`, `/admin` | later-release workflows |

Lists require date, type, category, state, and keyword filters. Maintain keyboard access, visible focus, semantic labels, contrast, and 44px touch targets.

