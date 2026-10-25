# Video script (English, about 2 minutes 40 seconds)

Guía 7, Estándares y Métricas de Calidad de Software. Speakers: David Zambrano (D) and Samuel Ossa (S).
Read at a calm pace (about 130 words per minute). Show the screen indicated in brackets.

---

**[Slide 1, title]**

**D:** Hi, we are David Zambrano and Samuel Ossa, and this is our summary of Lab Guide 7, about quality standards, version control and software testing, applied to EcoRecicla, our recycling web app for Bogotá.

**[Slide 3, ISO 9000 family]**

**S:** First, the theory. ISO 9000 gives the principles and the vocabulary of quality management. ISO 9001 is the only certifiable standard of the family, and its new edition, ISO 9001:2026, was published in September. One of its main changes is stronger control of changes. ISO 9002 and 9003 were withdrawn in 2000. The big lesson is to move from inspecting at the end to preventing during the whole process.

**[Slide 2, three levels]**

**D:** In our independent research we found that not all ISO standards follow the high-level structure: only management system standards, like ISO 9001 or ISO 27001, do. Product standards, like ISO/IEC 25010, and testing standards, like ISO/IEC/IEEE 29119, do not. In Colombia, companies such as Perficient Latin America and Heinsohn reached CMMI level 5. These certifications do not test software, but they require evidence, and testing produces that evidence.

**[GitHub: pull requests and network graph]**

**S:** In session one we practiced version control with Git and GitHub. Every change follows six steps: issue, branch, commits, pull request, automatic tests with review, and merge. We also created a real merge conflict, editing the same README line from two branches, and solved it by hand.

**[VS Code: tests folder, then GitHub Actions runs]**

**D:** In sessions two and three we executed our test plan. We wrote ninety automated tests with Jest and Supertest, running against an isolated test database. GitHub Actions runs them on every pull request with MySQL 8. The first run failed ten cases and revealed five real defects. For example, a quantity of 0.004 kilograms returned an internal server error, and a date like February 30 was accepted.

**[GitHub: closed issues]**

**S:** Each defect became a GitHub issue, was fixed in its own branch, and was tested again. Now all ninety tests pass and line coverage is eighty-two percent.

**[Slide 10, closing]**

**D:** Our conclusion: ISO 9000 does not test the software, but it asks us to prove quality with evidence.

**S:** Thank you for watching.
