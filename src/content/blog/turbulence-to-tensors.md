---
title: From turbulence to tensors
date: 2026-06-12
tags: [career, physics, machine-learning]
summary: What a PhD in experimental fluid dynamics taught me about machine learning, and the one habit I wish I had picked up earlier.
words: 640
---

My PhD was about bubbles. Specifically, about what bubbles do to the drag on a
wall when the water around them is turbulent, measured with lasers in a tank
the size of a small car. It was slow, wet, and wonderful.

## What carried over

**Measurement is the job.** In the lab, if your instrument is not calibrated
the paper is wrong, full stop. In machine learning the "instrument" is the
evaluation set, and nobody calibrates it. Half of the value I add today is
asking _how do we know this number is right?_ before anyone asks _can we make it
higher?_

**Dimensional analysis still works.** If a model's output depends on the units
of the input, something is broken. This sounds obvious until you meet a feature
pipeline where one column is in seconds and another in milliseconds, and the
model has quietly learned to tell them apart by magnitude.

**Turbulence is a good mental model for production.** Deterministic equations,
chaotic behaviour, and the only tractable questions are statistical ones. If
that does not describe a fleet of microservices I don't know what does.

## The habit I wish I had

Writing things down _as I learn them_. The [TIL section](/til) of this site is
the late correction: five lines, one command, the thing that cost me an hour.
Future me is the audience and he is very grateful.
