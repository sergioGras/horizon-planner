# 2026 Roadmap Data

## Purpose

This document contains the canonical roadmap data for the personal timeline application.

It represents:
- strategic commitments
- learning tracks
- personal planning initiatives
- milestone sequencing across 2026

This is not a task tracker.

The roadmap focuses on:
- multi-week initiatives
- cognitive bandwidth allocation
- milestone progression
- quarter-level planning

Avoid translating this into:
- tickets
- sprint tasks
- daily todos
- dependency-heavy project management

---

# Timeline Philosophy

The roadmap uses two planning categories:

## Commitment

High-confidence execution target.

Characteristics:
- expected to happen
- scheduled intentionally
- consumes meaningful focus
- should appear prominently in the timeline

Visual direction:
- solid bars
- stronger contrast

---

## Intention

Directional or exploratory initiative.

Characteristics:
- lower certainty
- flexible scope
- exploratory or adaptive
- should remain visually lighter

Visual direction:
- dashed bars
- lower emphasis

---

# Lane Definitions

## TreePlet (Core)

Primary product and technical execution lane.

Contains:
- IoT infrastructure
- connectivity
- firmware
- backend integration
- prototype evolution
- deployment preparation

This is the dominant execution lane for 2026.

---

## Learning

Longer-term technical learning and capability expansion.

Focus areas:
- AI systems
- transformers
- cloud/data engineering
- electronics fundamentals
- algorithmic practice

Learning should support strategic leverage rather than fragmented consumption.

---

## Personal Strategic

Longer-horizon personal planning and decision systems.

Focus areas:
- housing exploration
- car decisions
- financial modeling
- scenario analysis
- strategic life constraints

This lane exists to reduce decision ambiguity over time.

---

## Optional / Sandbox

Low-commitment exploratory space.

Rules:
- empty by default
- only populated intentionally
- should never dominate the roadmap

---

# Roadmap Blocks

## TREEPLET (CORE)

### Connectivity Stabilization

- Type: Commitment
- Quarter: Q2
- Dates: 2026-04-15 → 2026-05-31

Description:
MQTT communication, certificates, reliable ingestion pipeline, device connectivity stabilization.

Success criteria:
- stable MQTT connection
- certificate flow working
- reliable message delivery
- backend receives telemetry consistently

Milestone:
- M1 — Connectivity Working
- Target: 2026-05-31

---

### Backend Integration Loop

- Type: Commitment
- Quarter: Q2
- Dates: 2026-05-15 → 2026-06-30

Description:
Establish complete device → cloud → storage → validation loop.

Success criteria:
- data persisted correctly
- validation path operational
- backend integration stable
- observability acceptable

---

### Full Device Loop Implementation

- Type: Commitment
- Quarter: Q3
- Dates: 2026-07-01 → 2026-07-31

Description:
Sensor reading, transmission cycle, and operational loop functioning end-to-end.

Success criteria:
- successful sensing cycle
- successful transmission cycle
- successful recovery cycle
- stable operation across repeated runs

Milestone:
- M2 — Full Loop Working
- Target: 2026-07-31

---

### Autonomous Device Optimization

- Type: Commitment
- Quarter: Q3
- Dates: 2026-08-01 → 2026-09-30

Description:
Power optimization, deep sleep behavior, battery efficiency, and operational stability improvements.

Success criteria:
- deep sleep functioning
- reduced power usage
- acceptable battery behavior
- long-duration stability

Milestone:
- M3 — Autonomous Device
- Target: 2026-09-30

---

### Integrated Prototype Build

- Type: Commitment
- Quarter: Q4
- Dates: 2026-10-01 → 2026-11-15

Description:
Hardware, enclosure, firmware, and backend integrated into a cohesive prototype.

Success criteria:
- enclosure integrated
- stable physical build
- full-stack functionality working
- deployable prototype state

Milestone:
- M4 — Integrated Prototype
- Target: 2026-11-15

---

### Pilot Preparation

- Type: Commitment
- Quarter: Q4
- Dates: 2026-11-15 → 2026-12-20

Description:
Validation and operational hardening toward deploy-ready status.

Success criteria:
- operational validation complete
- deployment checklist acceptable
- major instability removed
- pilot scenario feasible

Milestone:
- M5 — Pilot Ready
- Target: 2026-12-20

---

# LEARNING

### Karpathy AI (Transformers / GPT)

- Type: Commitment
- Quarter: Q2
- Dates: 2026-04-20 → 2026-06-15

Description:
Complete videos, reproduce implementations, and deeply understand transformer systems.

Focus:
- transformers
- GPT architecture
- tokenization
- attention
- training intuition

---

### Circuits Fundamentals (Light)

- Type: Intention
- Quarter: Q2 → Q4
- Dates: 2026-05-01 → 2026-12-31

Description:
Light but continuous exposure to electronics fundamentals.

Focus:
- RLC intuition
- signal behavior
- analog concepts
- practical circuit reasoning

---

### AWS Data Engineering Path

- Type: Commitment
- Quarter: Q3
- Dates: 2026-07-15 → 2026-09-30

Description:
AWS Skill Builder path, labs, and practical cloud data engineering exposure.

Focus:
- data pipelines
- cloud storage
- orchestration
- analytics services
- architecture understanding

---

### Learning Flex Slot

- Type: Intention
- Quarter: Q4
- Dates: 2026-10-01 → 2026-12-31

Description:
Adaptive learning allocation based on TreePlet bottlenecks or emerging strategic gaps.

---

### DSA Practice (KPI)

- Type: Intention
- Quarter: Q2 → Q4
- Dates: Continuous

Description:
Maintain algorithmic fluency through low-frequency but consistent practice.

Target:
- 1–2 problems per week
- lightweight notes consolidation

---

# PERSONAL STRATEGIC

### Housing & Car Exploration

- Type: Intention
- Quarter: Q2
- Dates: 2026-05-01 → 2026-06-30

Description:
Research housing and mobility options, define constraints, and clarify preferences.

Focus:
- affordability
- commute implications
- ownership constraints
- quality-of-life impact

---

### Decision Modeling System

- Type: Intention
- Quarter: Q3
- Dates: 2026-07-01 → 2026-08-31

Description:
Build a lightweight scenario-analysis tool for evaluating strategic personal decisions.

Focus:
- weighted trade-offs
- scenario comparison
- cost modeling
- decision clarity

---

### Financial & Scenario Analysis

- Type: Intention
- Quarter: Q3
- Dates: 2026-08-01 → 2026-09-30

Description:
Evaluate long-term affordability and strategic trade-offs across possible decisions.

Focus:
- savings trajectories
- investment trade-offs
- housing scenarios
- transportation costs

---

### Decision Convergence

- Type: Intention
- Quarter: Q4
- Dates: 2026-10-01 → 2026-12-31

Description:
Converge toward a final strategic direction.

Possible outcomes:
- buy
- wait
- reduce scope
- adjust timeline
- preserve optionality

---

# Optional Machine-Friendly Structure

```json
{
  "lanes": [
    "TreePlet Core",
    "Learning",
    "Personal Strategic",
    "Optional / Sandbox"
  ]
}
```