# Heritage Restaurant — Design System Specification (DESIGN.md)

> Optimized for Google Stitch (`stitch.withgoogle.com`) canvas generation and visual editing.

---

## Brand & Visual Identity

Heritage Indian Cuisine is a royal, high-end fine dining digital storefront. The aesthetic blends regal Indian heritage with contemporary minimalism: warm cream parchments, deep charcoal inks, and luminous gold leaf accents.

---

## Color Tokens

```json
{
  "primary": {
    "gold": "#b8922a",
    "goldLight": "#d4a843",
    "goldDark": "#92711d"
  },
  "neutrals": {
    "cream": "#faf7f0",
    "creamDeep": "#f2ece0",
    "parchment": "#e8dcc8",
    "ink": "#1a1610",
    "inkSoft": "#3d3427"
  },
  "semantic": {
    "veg": "#16a34a",
    "nonVeg": "#dc2626",
    "accentGold": "#d4a843",
    "badgeBg": "#fef3c7"
  }
}
```

---

## Typography

| Role | Font Family | Weight | Usage |
|---|---|---|---|
| **Headings & Hero** | `Cormorant Garamond`, Georgia, serif | 600 / 700 | Brand Title, Category Headers, Dish Names |
| **Body & UI** | `Jost`, system-ui, sans-serif | 400 / 500 / 600 | Prices, Badges, Buttons, Descriptions, Navigation |
| **Accents** | `Cinzel` or `Cormorant Garamond` (Italic) | 400 / 600 | Subtitles, Chef Recommendations |

---

## Component Anatomy

### 1. Navigation Bar
- **Brand Logo:** Fork & Spoon crest icon with *"Heritage"* (Cormorant Garamond, Serif) + *"INDIAN CUISINE"* (Gold uppercase subtitle).
- **Actions:**
  - `Track Orders` (Pill button with clock icon)
  - `Admin Portal` (Pill button with shield icon)
  - `Dining Cart` (Gold solid button with bag icon & badge counter)

### 2. Hero Section
- Clean, centered royal banner with gold filigree divider.
- Tagline: *"Experience Authentic Indian Heritage"*
- Subtitle: Handcrafted delicacies cooked with slow-simmered regional spices.
- CTA: *"Explore Menu"* (Smooth scrolls to menu section).

### 3. Dietary & Category Filters
- **Dietary Filter Pills:**
  - `All Dishes` (Dark ink solid button)
  - `Pure Vegetarian` (Green border with green dot)
  - `Non-Vegetarian` (Red border with red dot)
- **Category Tabs:**
  - `CURRIES`, `STARTERS`, `BREADS`, `BIRYANI`, `DESSERTS`, `BEVERAGES`.

### 4. Menu Card
- **Image:** 16:9 rounded cover photo with zoom-on-hover effect.
- **Dietary Indicator:** Square symbol with centered circle (Green for Veg, Red for Non-Veg).
- **Title:** Cormorant Garamond font, bold, dark ink.
- **Price:** Styled in gold currency (`₹300`).
- **Action:** Quantity control (`- 1 +`) or gold `Add to Cart` button.

### 5. Slide-Out Dining Cart Drawer
- Opens from the right with blur backdrop.
- Lists itemized dishes, quantity adjusters, subtotal, discount badge, and total.
- **Interactive Gamified Discount:** Spin-wheel / 2-phase puzzle to unlock 10%–20% off.
- **Payment Method:** Direct UPI QR Code (`9392767835@ybl`) with screenshot reference upload.

---

## Stitch Prompt Instruction Reference

```text
Create a luxury Indian fine-dining ordering app named 'Heritage Indian Cuisine'.
Use an off-white warm cream background (#faf7f0), charcoal ink text (#1a1610), and polished gold accents (#b8922a).
Use elegant serif typography for headings (Cormorant Garamond) and sleek sans-serif for UI (Jost).
Include a top header with brand emblem and Cart badge, category filter pills (Veg/Non-Veg), and a responsive 4-column dish grid with dietary markers, prices in INR (₹), and 'Add to Order' buttons.
```
