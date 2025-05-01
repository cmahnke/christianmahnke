---
date: 2025-02-25T15:52:22+02:00
title: 'AI and software "development"'
description: "Or: Academic software publishers"
tags:
- SoftwareDevelopment
- ProjectIdea
- CulturalPolicy
- DigitalLibrary
- AI
---

Over the past year, I have occasionally worked with AI to enrich my blogs with additional features and also to accelerate their further development.
<!--more-->

Most of the examples are in the background, in the scripts that do things like image post-processing, optimisation and transformation. AI makes it relatively easy to translate methods into Python and embed them in the workflow.

All of this reminded me of a phase about 15 years ago when I was professionally involved in a large research project on optical character recognition. At that time, it was new for many of the functionalities originating directly from research to ‘talk’ to each other in a way that corresponded to the expertise of the target user group.

The problems were manifold:
* Code that was ‘over-optimised’, e.g. C with inline assembler
* Code that was not optimised at all, e.g. performance-critical, but written in an interpreted language
* Code that was not scaled, e.g. over more than one CPU / core, is not thread-safe, etc.

As the aim at the time was also to use the various implementations for mass digitisation, there was a way of scaling the various state-of-the-art tools and equipping them with standardised interfaces.

The solution at the time: a generator that conjures up a web service from a machine-readable description of the command line interface of the corresponding tool. In other words, it creates an additional overhead without solving structural problems...

According to my current experience (see above), a more elegant solution could be to transfer such algorithms / function blocks directly from research using AI into a form that simplifies or optimises operation in an application context.

Ultimately, the framework conditions are becoming increasingly complex and having scientists (co-)manage them is more of a waste of resources, as they would be better off taking care of implementing the specific solutions to their problems:
* Operating environments such as Docker / Kubernetes / Cloud
* Requirements for logging and monitoring the application
* Quality assurance and maintainability (of the software itself)
* Metrics
* Data management

And these are just the more or less technical requirements, there are many more from the areas of
* Security / data protection
* EU product liability directive
* Usability
* Documentation

Both lists are not even complete.

# Academic software publishers

One can imagine a (business) model here in which a university software publisher is institutionalised in the same way as the university publishers for publications: An institution or competence centre that turns problem solutions from research into real products. And even if many of these requirements can now be solved by AI-supported methods, a certain level of expertise is required. This is because the requirements are not static, they will change and, above all, increase in scope. It will therefore be necessary to train models, follow standards, regulations and best practices, etc.

And this is where the expertise of the university software publisher would lie!
At the same time, it would also be conceivable that the integration / provision could be co-financed via a kind of publication fee, thus creating an economic incentive for more standardised platforms (technically and organisationally).
