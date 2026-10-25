# Video script (English, about 2 minutes 45 seconds)

Guía 7, Estándares y Métricas de Calidad de Software. Speaker: Samuel Ossa Escobar.

How to record: open `Video_Guia07_EcoRecicla.pptx` in slide show mode, start the
screen recording and read one block per slide. Everything that must be shown is
already on the slides, so there is no need to open GitHub or VS Code. Speak calmly
(about 130 words per minute). The same text is in the speaker notes of each slide.

---

**Slide 1 (title)**

Hi, I'm Samuel Ossa. With my teammate David Zambrano, I will summarize Lab Guide 7: quality standards, version control and software testing, applied to EcoRecicla, our recycling web app for Bogotá.

**Slide 2 (ISO 9000)**

First, the theory. ISO 9000 gives the principles and the vocabulary of quality management, and ISO 9001 is the only certifiable standard of the family. Its new edition, published in September 2026, asks for a stronger control of changes. The big lesson is to move from inspecting at the end to preventing during the whole process.

**Slide 3 (independent research)**

In our research we found that not all ISO standards follow the high-level structure: only management system standards, like ISO 9001, do. In Colombia, companies such as Perficient Latin America and Heinsohn reached CMMI level 5. These certifications do not test software, but they require evidence, and testing produces that evidence.

**Slide 4 (version control)**

In session one we practiced version control with Git and GitHub. Every change follows six steps: issue, branch, commits, pull request, automatic tests with review, and merge. Here are our pull requests and the branch graph.

**Slide 5 (merge conflict)**

We also created a real merge conflict. Two branches changed the same line of the README. Git marked the conflict, and we solved it by hand, combining both changes.

**Slide 6 (automated tests)**

In sessions two and three we executed our test plan. We wrote ninety automated tests with Jest and Supertest. This test checks the limits of the recycled quantity: valid values must be saved, and invalid values must be rejected without saving anything.

**Slide 7 (continuous integration)**

GitHub Actions runs all the tests on every pull request with MySQL 8. The first run failed and revealed five real defects. For example, a quantity of 0.004 kilograms caused an internal server error, and a date like February 30 was accepted.

**Slide 8 (defects and fixes)**

Each defect became a GitHub issue, was fixed in its own branch and was tested again. This is the fix for the dates: it rebuilds the date and checks that it really exists in the calendar.

**Slide 9 (results and conclusion)**

Now all ninety tests pass, and line coverage is eighty-two percent. Our conclusion: ISO 9000 does not test the software, but it asks us to prove quality with evidence. Thank you for watching.
