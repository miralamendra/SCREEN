# SCREEN Research Portal — AI Design & Development Rules v1.0

## ROLE
You are not a UI generator. You are the senior product designer + frontend architect responsible for creating SCREEN Research Portal.
Your goal is to build a world-class research operating system with the quality level of premium software products.
Think like: Apple Human Interface Guidelines, Linear precision, Notion information clarity, Vercel simplicity, Arc Browser creativity.
Create SCREEN's own identity: **Scientific Elegance** (intelligent, calm, precise, trustworthy, minimal, research-focused).
It must NOT feel like a generic SaaS dashboard, AI-generated interface, admin panel template, or flashy startup landing page.

## CORE DESIGN PHILOSOPHY
The interface exists to support human thinking. The user's research is the hero. The UI is the environment.
Every design decision must answer: "Does this help the user understand, decide, or work faster?" If not, remove it.
Prioritize: Clarity, Consistency, Purpose, Restraint.

## UX PSYCHOLOGY RULES
1. **Cognitive Load Theory**: Reduce unnecessary mental effort. Complex info should be revealed progressively.
2. **Hick's Law**: More choices increase decision time. Avoid showing too many actions simultaneously.
3. **Fitts' Law**: Primary actions should be visible, reachable, large enough, and near relevant content.
4. **Miller's Law**: Avoid overwhelming users. Navigation should contain only important categories.
5. **Gestalt Principles**: Apply Proximity, Similarity, Continuity, and Figure/Ground.
6. **Recognition Over Recall**: Show context. Users should recognize information instead of remembering commands.
7. **Jakob's Law**: Do not create unusual interactions for common tasks.
8. **Peak-End Rule**: Make moments like first login, creating entry, and completing tasks excellent.

## VISUAL IDENTITY & COLOR SYSTEM
Overall Feeling: "Scientific Elegance".
Use existing tokens only. Never hardcode colors (e.g. no `bg-[#121212]`).
- Base (`#0c0d0e`): Main application background.
- Surface (`#141618`): Panels and navigation.
- Elevated (`#1b1e21`): Dialogs and floating elements.
- Border (`#23272b`): Only subtle separation.
- Accent (`#059669`): Emerald green. Maximum 5% of interface. Never create glowing buttons or neon effects.

## SPACING SYSTEM
Use only: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px.
4-12px (small internal spacing), 16-24px (component spacing), 32-48px (section spacing), 64px+ (major page separation).

## LAYOUT SYSTEM
Desktop: Maximum content width `1280px` (`max-w-[1280px] mx-auto`). Desktop padding: 32-48px. Tablet: 24px. Mobile: 16px.
Use grid and flex. Avoid absolute positioning unless necessary.

## TYPOGRAPHY SYSTEM
Primary font: Geist (Fallback: Inter, system-ui).
Weights: 400 Regular, 500 Medium, 600 Semibold, 650 Strong.
Sizes: Display (72px), Page title (36px), Section heading (28px), Subheading (22px), Small heading (18px), Body (15px), Large body (17px), Caption (12px).
Typography creates hierarchy. Do not use color to create hierarchy.

## CARD, BORDER & SHADOW RULES
Avoid card explosion (no card inside card inside card). Use whitespace, typography, and grouping.
Cards are only for independent objects (Task, Meeting, Research Entry).
Use minimal borders. Whitespace is the separator.
Avoid shadows (subtle elevation allowed only for modal, dropdown, command palette).
Border Radius: 6px, 10px, 14px, 20px. Avoid `rounded-3xl` or `rounded-full` everywhere.

## MOTION SYSTEM
Motion must communicate change. Never animate for decoration.
Timing: Instant (80ms), Quick (120ms), Standard (180ms), Slow (280ms).
Default easing: `cubic-bezier(0.22,1,0.36,1)`.
Use `opacity` and `transform`. Avoid animating width/height/top/left.
Workspace motion must be calm. No bouncing, spinning, or flashy effects.

## LANDING PAGE RULES
Theme: Research knowledge network (intelligent particle system, knowledge graph, organic data flow).
Animation should be slow, elegant, premium. Desktop: 60FPS. Avoid generic floating blobs, cyberpunk style, glassmorphism.

## TECHNICAL RULES
- React 19, TypeScript, Vite, Tailwind CSS v4, Motion, GSAP, React Three Fiber, Supabase.
- Tailwind: Use theme tokens. Never inline arbitrary values (e.g. `p-[27px]`).
- Animation Libraries: Use Motion for React UI transitions, GSAP for complex timelines, React Three Fiber for 3D/WebGL. Never mix animation libraries on the same element.
- React: Build reusable components. Separate UI, logic, data, state. Avoid unnecessary re-renders.

## AI CODING BEHAVIOR
Before creating UI:
1. Understand user workflow.
2. Check existing components.
3. Follow SCREEN design rules.
4. Reuse tokens.
5. Avoid creating unnecessary components.

Design Review Checklist before finishing:
✓ Is hierarchy clear?
✓ Is spacing consistent?
✓ Are colors controlled?
✓ Does it avoid AI dashboard patterns?
✓ Is the UX intuitive?
✓ Is mobile considered?
✓ Is accessibility considered?

Final Principle: SCREEN should feel Quiet, Intelligent, Precise, Human. Create software users trust after using it for five years.

---

# SCREEN UX Foundation
# Typography, Spacing & Visual Psychology Rules

## Purpose
SCREEN is designed for researchers who work with complex information.
The interface must reduce cognitive effort and improve comprehension.
Every choice of font size, spacing, width, alignment, and density must support human perception.

---

# 1. Typography Psychology

## Humans do not read interfaces first
Users scan before reading.
The eye searches for:
1. What is this?
2. What matters?
3. What changed?
4. What action is possible?

Typography creates this path.
A good interface can communicate hierarchy even if users cannot read the words.

---

# 2. Visual Hierarchy Principle

Every screen must have:

### Primary Layer
The most important information (e.g., page title, research name, critical status).
- Largest size, highest contrast, strongest weight.

### Secondary Layer
Supporting explanation (e.g., description, context, summary).
- Smaller, softer contrast.

### Tertiary Layer
Metadata (e.g., timestamps, author, categories).
- Smallest, lowest contrast.

Never make all text visually equal.

---

# 3. Font Size Psychology

## Large Text (32px+)
- **Purpose**: Orientation. The brain recognizes large text first.
- **Use for**: Page titles, major statements, landing hero.
- **Psychological effect**: Confidence, importance, direction.
- **Rule**: Do not use large text everywhere. If everything is large, nothing feels important.

## Page Title (36px)
- **Weight**: 600-650
- **Line height**: 44px
- **Reason**: Large enough for orientation, small enough for productivity.

## Section Heading (28px)
- **Weight**: 600
- **Line height**: 36px
- **Purpose**: Creates mental chapters.

## Subsection Heading (22px)
- **Weight**: 600
- **Line height**: 30px
- **Purpose**: Organizes related information.

## Body Text (15-17px)
- **Why**: Research interfaces contain reading.
- **Below 14px**: Increases eye strain, slows reading, reduces accessibility.
- **Above 18px**: Reduces information density.
- **Optimal**: 15-17px.

## Metadata Text (12-13px)
- **Purpose**: Information exists but should not compete (e.g., "Updated yesterday", "Created by Miral", "Last synchronized").

---

# 4. Line Height Psychology
Line height controls reading comfort.
- **Too small**: Text feels crowded. Brain spends more effort separating lines.
- **Too large**: Relationships between lines become weak.

## UI Text
- **Font**: 15px
- **Line height**: 24px (Ratio: 1.6)

## Long Reading Content
- **Font**: 17px
- **Line height**: 28px (Ratio: 1.65)
Research documents should prioritize readability.

---

# 5. Letter Spacing Psychology
Large text needs tighter spacing.
- **Reason**: Large letters create more visual separation.
- **36px title**: -0.02em
- **72px hero**: -0.04em
- **Body**: 0
- **Small labels**: +0.02em

---

# 6. Spacing Psychology
Whitespace is not empty. Whitespace creates:
- grouping
- importance
- calmness
- comprehension

A crowded interface forces the brain to work harder.

---

# 7. The Spacing Hierarchy

## Micro Spacing (4px - 8px)
- **Purpose**: Elements that belong together (e.g., Icon + text, Button icon + label). The brain sees them as one object.

## Small Spacing (12px - 16px)
- **Purpose**: Inside components (e.g., Input padding, Menu items, Small cards).

## Medium Spacing (24px - 32px)
- **Purpose**: Separate related groups (e.g., Title + description, Sections inside pages).

## Large Spacing (40px - 64px)
- **Purpose**: Separate different ideas (e.g., Research sections, Dashboard areas).

## Extra Large Spacing (80px+)
- **Purpose**: Create importance (e.g., Landing page sections, Major transitions).

---

# 8. The Law of Proximity
Objects close together are perceived as related.
- **Good**:
  Title
  Description
  Action
  (Brain groups them)
- **Bad**:
  Title
  
  [Large empty space]
  
  Description
  (Relationship becomes unclear)

---

# 9. Content Width Psychology
Humans cannot comfortably read unlimited width. Wide text causes slower scanning, losing position, and reduced comprehension.
- **Reading width (Max 720px)**: Ideal for reports, notes, reflections.
- **Application width (Max 1280px)**: Ideal for dashboards, tables, workflows.

---

# 10. Screen Composition Psychology
Every screen has three zones:
- **Zone 1 (Orientation)**: Top area (page title, context, primary action). Answers: *"Where am I?"*
- **Zone 2 (Work Area)**: Main content. Answers: *"What am I doing?"*
- **Zone 3 (Supporting Information)**: Secondary details. Answers: *"What else do I need?"*

---

# 11. Above The Fold Psychology
Important information must appear without scrolling. First viewport should contain identity, purpose, current state, and primary action. Do not force users to search.

---

# 12. Density Psychology
SCREEN uses three density modes:
- **Dense (8-12px spacing)**: Fast scanning (tables, command palette, navigation).
- **Comfortable (16-24px spacing)**: Daily work default (workspace, research entries).
- **Spacious (40-96px spacing)**: Emotional impact (landing page, important transition moments).

---

# 13. Alignment Psychology
Humans trust aligned objects. Misalignment creates subconscious discomfort.
- Titles align with content.
- Buttons align with actions.
- Tables align numbers.
- Sections share common edges.
- Avoid random placement.

---

# 14. Fit-To-Screen Rules
The interface must respect the user's viewport.

## Desktop (1280px+ width)
- Content Max: 1280px
- Side margins: 32-48px

## Laptop (1024-1279px)
- Reduce spacing, columns, and secondary information.

## Tablet (768-1023px)
- Collapse secondary panels and extra navigation.

## Mobile (320-767px)
- Margin padding: 16px
- Touch targets: Min 44px
- Typography reduction: Desktop title 36px → Mobile title 28px

---

# 15. Visual Balance Rule
Every screen should feel balanced. Avoid too much information at top, visual weight inequality, or too much empty space. The eye should move naturally:
`Title` → `Context` → `Action` → `Content` → `Details`

---

# 16. Cognitive Comfort Checklist
Before approving a page, ask:
- Can users understand the purpose in 5 seconds?
- Can users find the main action immediately?
- Is important information visually dominant?
- Is supporting information quiet?
- Does the layout breathe?
- Does it feel calm?
If not, redesign.

---

## Final Rule
Good design is not making everything visible. Good design is making the right things visible at the right time.
