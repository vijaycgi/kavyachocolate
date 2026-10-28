---
name: Kavya Chocolat
description: A chocolate atelier counter — cream paper, burgundy fields, ruled editorial type, and bars presented like specimens.
colors:
  burgundy: "#75212f"
  burgundy-deep: "#4b101c"
  burgundy-soft: "#8a3040"
  paper: "#f6efe3"
  paper-2: "#efe3d1"
  cream: "#fcf8f0"
  ink: "#24140f"
  ink-2: "#5b463b"
  cocoa: "#3a2018"
  brass: "#b08a57"
  brass-ink: "#7a5726"
  brass-light: "#dcb98a"
  line: "#d8c6ac"
typography:
  display:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 4.6vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 3.7vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
  data:
    fontFamily: "Sen, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariantNumeric: "tabular-nums"
rounded:
  xs: "2px"
  sm: "4px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "10": "40px"
  "16": "64px"
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
components:
  button-primary:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xs}"
    padding: "0.85rem 1.5rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.burgundy-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xs}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0.85rem 1.5rem"
    height: "3rem"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.xs}"
    padding: "0.85rem 1.5rem"
    height: "3rem"
  field:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0.72rem 0.9rem"
    height: "3rem"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.5rem"
  product-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0"
  admin-stat:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "1rem"
---

# Design System: Kavya Chocolat

## Overview

**Creative North Star: "The Chocolate Atelier Counter"**

Kavya Chocolat should feel like standing at a small chocolate studio's counter: a sheet of warm cream paper, a burgundy lacquer panel, a brass ruler, and four bars laid out like specimens with their tasting notes. The system is editorial rather than promotional. It uses ruled structure, generous margins, and one confident typeface to make a modest catalogue feel considered. It refuses the centred-hero-plus-three-icon-cards storefront, glossy gradients, floating rounded cards, and decoration that does not carry information.

Burgundy is a **field**, not a highlight: the announcement rule, the footer, the admin rail, the hero plate, and selected panels. Cream paper carries most of the page. Brass is a drafting line — borders, rules, small numerals — and has a separate, darker text variant so it never fails contrast on paper. Photography is large, warm, and quiet; the interface stays out of its way.

Motion is restrained: a single rise-and-fade on first paint, 160–180ms state transitions, and nothing that loops. The fixed paper grain is the only ambient texture.

**Key Characteristics:**
- Warm cream paper (`#f6efe3`) with a 3.5% fixed grain overlay.
- Burgundy (`#75212f`) as structural field, not accent sprinkles.
- Sharp 2px corners; 1px brass-toned hairlines; no rounded cards.
- One family (Sen) for display, UI, body, and money — hierarchy from weight, size, and case.
- Sen 600 headlines at tight tracking; 400 body; 600 uppercase labels. No second face, no italic.
- Flat by default; depth from tonal fields and hairlines, not drop shadows.

## Colors

A warm, low-chroma palette built from paper, cocoa, and burgundy, with brass used as a rule rather than a fill.

### Primary
- **Atelier Burgundy** (`#75212f`): the brand field. Announcement bar, footer, admin sidebar, hero plate, primary buttons, emphasis words in headlines, active states. Large areas are acceptable; scattered small accents are not.
- **Cellar Burgundy** (`#4b101c`): hover/pressed primary, gradient scrims over photography, the deepest field behind images.
- **Lacquer Burgundy** (`#8a3040`): reserved secondary tint for small emphasis where deep burgundy would go flat.

### Secondary
- **Brass Rule** (`#b08a57`): hairlines, borders on dark fields, the short rule before an eyebrow, numerals on burgundy. **Decorative and border use only on light grounds** — it is 2.8:1 on paper and must not carry text there.
- **Brass Ink** (`#7a5726`): the text-safe brass for numerals and eyebrows on paper and cream (5.7:1 on paper). Use this whenever brass-colored text sits on a light ground.
- **Brass Light** (`#dcb98a`): the text-safe brass for dark burgundy grounds (5.6:1).

### Neutral
- **Counter Paper** (`#f6efe3`): the page ground. Most of the storefront.
- **Ledger Paper** (`#efe3d1`): secondary ground for image wells, hover rows, and alternating blocks.
- **Fresh Cream** (`#fcf8f0`): cards, panels, form fields, and admin surfaces that need to lift slightly off the paper.
- **Cocoa Ink** (`#24140f`): primary text, headings, and dark chips.
- **Soft Cocoa** (`#5b463b`): secondary text, labels, helper copy, table headers.
- **Deep Cocoa** (`#3a2018`): image overlays and the darkest photographic ground.
- **Hairline** (`#d8c6ac`): every 1px border, table rule, and divider.

### Named Rules

**The Burgundy Field Rule.** Burgundy is applied as a complete field — a bar, a rail, a plate, a footer — not as confetti. A screen may have several burgundy fields; it should not have burgundy dots, pills, and underlines scattered between them.

**The Brass Contrast Rule.** Brass `#b08a57` is a line color on light grounds, never a text color. Text that should read as brass uses Brass Ink on paper and Brass Light on burgundy.

**The Paper Majority Rule.** Cream paper remains the dominant surface. If burgundy covers more than roughly a third of a storefront screen, the screen is probably a campaign surface, not a catalogue page.

## Typography

**Display & Body Font:** Sen (with ui-sans-serif, system-ui, sans-serif)

**Character:** One warm humanist sans, worked as a ledger rather than a greeting card. Sen's open forms, sturdy caps, and even rhythm give the shop the plain authority of a specimen sheet or an apothecary label, and the same face stays legible in a price, a form field, or a stock count. Hierarchy is built from weight, size, case, and tracking — never from a second family — so the page reads as one considered hand at several volumes. Sen has no italic, and no synthetic oblique is used anywhere.

### Hierarchy

- **Display** (600, `clamp(2.6rem, 4.6vw, 4.2rem)`, 1.04, `-0.03em`): the home hero and major closing statements. Tight tracking is what gives the sans its editorial weight; line-height stays just above 1 so descenders do not collide.
- **Section** (600, `clamp(2.1rem, 3.7vw, 3.4rem)`, 1.08, `-0.025em`): section headings. Usually paired with an eyebrow and a short rule.
- **Title** (600, 1.4rem, 1.16, `-0.02em`): card titles, product names, panel headings, admin page titles.
- **Body** (400, 1rem, 1.6): paragraphs. Long copy is capped around 48–65ch; product descriptions stay under ~60ch.
- **Label** (600, 0.6875rem, `0.14–0.22em`, uppercase): eyebrows, field labels, table headers, button text, nav. Never below 11px.
- **Data** (600, tabular, `-0.01em`): prices, totals, stock counts, and admin metrics. Same family as body, separated by weight and tabular figures rather than a face change.

### Named Rules

**The 11px Floor Rule.** Functional text — links, labels, buttons, table cells, metadata that carries meaning — never goes below 11px, including inside the footer. Only non-interactive legal smallprint may sit at 10px, and even that is discouraged.

**The One-Family Rule.** Sen carries every word on the page. Display headings are Sen 600 with tight tracking, labels are Sen 600 uppercase and tracked, body is Sen 400. A second typeface, a script face, or a fabricated italic is off-system.

**The Mixed-Case Body Rule.** Body copy is sentence case. Uppercase is reserved for short labels, eyebrows, and buttons, with tracking added to compensate.

## Layout

The storefront is a single centred column capped at **80rem**. Page gutters are 20px on mobile, 32px at `sm` (640px), and 48px at `lg` (1024px). Sections use a vertical rhythm of roughly 64–96px (`py-16` to `py-24`), with ruled dividers instead of cards to separate ideas.

- **Home hero:** a 58/42 split at `lg`; a full-bleed image plate below the copy on mobile. The headline leads; the photograph supports.
- **Product grid:** 4-up at `lg`, 2-up at `sm`, 1-up on mobile. Cards are image-first with a 4:5 plate, then a ruled caption block.
- **Product detail:** image plate and purchase column split at `lg`; purchase controls stack under the image on mobile.
- **Checkout:** form and sticky order summary split at `lg`; summary follows the form on mobile.
- **Admin:** a fixed 15rem burgundy rail at `lg`, collapsing to a slide-over menu below it. The content column has its own sticky header. Tables scroll horizontally rather than crushing columns.
- **Breakpoints:** 640px, 768px, 1024px, 1280px. The design is verified at 390px and 1440px.

**The Ruled Not Boxed Rule.** Prefer a 1px rule and spacing over a bordered, shadowed card. Panels are for forms, admin data, and the cart drawer; editorial content sits directly on paper.

## Elevation & Depth

The system is **flat by default**. Depth comes from tonal layering — paper, cream, paper-2, burgundy — and from 1px hairlines. Shadows are exceptional and soft, used only for the cart drawer, floating tasting card, and image plates that need to sit above a field.

### Shadow Vocabulary

- **Plate** (`--shadow-plate: 0 24px 60px -28px rgb(36 20 15 / 0.45), 0 2px 0 rgb(36 20 15 / 0.06)`): large photography plates and floating cards over a burgundy field.
- **Soft** (`--shadow-soft: 0 18px 40px -26px rgb(36 20 15 / 0.4)`): the cart drawer and compact overlays.

**The Flat-By-Default Rule.** If a surface can be separated with a rule or a tonal shift, do not give it a shadow. Shadows signal something floating above the page, not a section boundary.

## Shapes

The form language is **cut paper and drafting lines**. Corners are 2px on buttons, fields, panels, and image plates; 4px is available for small controls that need a touch more softness. Cards are never rounded beyond 2px. Borders are always 1px and use the hairline color.

The only pill shape is the small tag/chip (`999px`), used for allergens, fulfilment labels, and variant chips. Circular geometry is otherwise reserved for the logo's cocoa-pod mark and icon buttons that need a compact hit area.

Photography is cropped in upright 4:5 (product cards, product plates) or 3:4/4:3 editorial rectangles. No blob masks, no arch shapes, no rotated cards.

**The Two-Corner Rule.** Everything structural is 2px; only tags and status pills go round. A rounded content card is off-system.

## Components

### Buttons

- **Shape:** 2px corners, 1px border, uppercase 11px label with `0.18em` tracking, minimum height 48px.
- **Primary:** burgundy field, paper text, `0.85rem 1.5rem` padding. Used once per decision area.
- **Hover / Focus:** primary deepens to Cellar Burgundy over 180ms; focus uses a 2px burgundy outline with 3px offset (paper outline on dark fields). Active state translates down 1px.
- **Secondary:** transparent field, ink text, 28%-opacity ink border; hover inverts to ink field with paper text.
- **Light:** paper field with burgundy text, for use on burgundy. **Ghost light:** transparent with a 42%-paper border for secondary actions on dark.
- **Small:** 40px minimum height, 11px label. Never used for the primary checkout action.

### Chips

- **Variant chips:** rectangular, 2px corners, 1px hairline, cream ground. Selected becomes burgundy with paper text; the selected label includes size and price. Not pill-shaped.
- **Tags:** pill-shaped, transparent ground, hairline border, 11px uppercase Soft Cocoa text. Used for allergen/fulfilment metadata, not for filters.

### Cards / Containers

- **Product card:** no panel background. A 4:5 image plate with a hairline border and a small paper index label; below it, a ruled caption block with collection label, product name, weight, and price range. Hover lifts the image slightly and reveals the detail image. The whole card is one link.
- **Panel:** cream ground, 1px hairline, 2px corners, 24–32px padding. Used for forms, summaries, and admin modules.
- **Admin stat card:** cream, hairline, 2px corners, 16px padding; one emphasized stat uses a solid burgundy field with paper text.

### Inputs / Fields

- **Style:** cream ground, 1px hairline, 2px corners, 48px minimum height, 1rem Sen text (16px keeps iOS from zooming on focus). Labels sit above in 11px uppercase Soft Cocoa.
- **Focus:** border shifts to burgundy with a 3px 14%-burgundy halo; the native outline is removed only when this substitute is present.
- **Error:** a form-level alert with a burgundy border, 5%-burgundy ground, and 14px burgundy text, marked `role="alert"`. Field borders do not turn red; the message names the problem and the field keeps its normal focus treatment. Disabled fields drop to 60% opacity.

### Navigation

- **Storefront header:** cream ground with a thin bottom rule, logo left, uppercase 11px links with `0.17em` tracking, bag action on the right behind a hairline divider. A burgundy announcement bar sits above it. Mobile uses a full-width slide-down menu with 44px rows.
- **Footer:** solid burgundy field with the knockout logo, a display-weight closing line, and three ruled link columns. Text on burgundy is paper at 75–80% opacity minimum.
- **Admin:** burgundy rail with a 2px brass left border on the active item and paper text; inactive items at 80% paper. Mobile replaces the rail with a slide-over panel and a 40px menu button.

### Product Purchase Panel

The signature storefront component. Price in Sen semibold with tabular numerals, a compare-at price struck through, and a mandatory 11px line reading "Placeholder price · tax not configured" until real tax configuration exists. Size chips below, then a quantity stepper and one primary "Add to bag" action. Stock state is explicit ("Only N left", "Sold out") and the add action is disabled when unavailable.

## Do's and Don'ts

### Do:
- **Do** keep cream paper as the majority surface and use burgundy as a complete field.
- **Do** use 11px as the functional-text floor and 12px+ for body metadata where space allows.
- **Do** use Brass Ink for text on paper and Brass Light for text on burgundy.
- **Do** separate sections with 1px hairlines and spacing before reaching for a card or shadow.
- **Do** label placeholders visibly: "Placeholder price · tax not configured", "placeholder photograph" in alt text, "Tax (not configured)".
- **Do** keep one primary button per decision area and make the next action obvious.
- **Do** preserve the logo's proportions and clear space; use the knockout version on burgundy.
- **Do** keep numbers tabular (`.num`) in prices, totals, stock, and tables.

### Don't:
- **Don't** use brass `#b08a57` as text on paper or cream; it fails 4.5:1.
- **Don't** set functional text below 11px, including footer links and metadata.
- **Don't** round content cards, images, or panels beyond 2px, or introduce a second corner language.
- **Don't** scatter burgundy across small dots, pills, and underlines instead of committing to a field.
- **Don't** use gradients except as photographic scrims over images.
- **Don't** introduce a second typeface, a script face, or a synthetic italic; Sen's variable weights carry display, notes, and UI.
- **Don't** invent reviews, ratings, certifications, nutrition panels, or health claims to fill a layout.
- **Don't** describe jaggery as sugar-free, or an order as paid, or an email as sent while email is unconfigured.
- **Don't** hide admin actions behind navigation alone; every protected action is server-verified, and the UI should reflect that seriousness.
