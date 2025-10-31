# Design System - Bedou App

## Color Palette

### Dark Mode
- Background: `#1F2937`
- Surface/Input: `#374151`
- Border: `#4B5563`
- Text Primary: `#F3F4F6` / `#FFFFFF`
- Text Secondary: `#9CA3AF` / `#D1D5DB`
- Placeholder: `#9CA3AF`

### Light Mode
- Background: `#FFFFFF`
- Surface/Input: `#FFFFFF`
- Border: `#E5E7EB`
- Text Primary: `#111827`
- Text Secondary: `#374151` / `#6B7280`
- Placeholder: `#9CA3AF`

### Accent Colors
- Error: `#EF4444`
- Success: `#10B981`
- Expense Gradient: `["#EF4444", "#DC2626"]`
- Income Gradient: `["#10B981", "#059669"]`
- Primary Blue: `#2563EB`

## Typography

### Labels
- Font Size: `scaleFont(16)`
- Font Weight: `600` (semibold)
- Color: `isDark ? "#F3F4F6" : "#111827"`
- Margin Bottom: `scaleSpacing(8)`

### Input Text
- Font Size: `scaleFont(16)`
- Font Weight: `400` (regular)

### Error Text
- Font Size: `scaleFont(13)`
- Font Weight: `500` (medium)
- Color: `#EF4444`
- Margin Top: `scaleSpacing(6)`

## Form Fields

### Input Field Styling
```typescript
{
  borderRadius: scaleSpacing(12),
  paddingHorizontal: scaleSpacing(16),
  paddingVertical: scaleSpacing(14),
  backgroundColor: isDark ? "#374151" : "#FFFFFF",
  borderColor: isDark ? "#4B5563" : "#E5E7EB",
  borderWidth: 1.5,
  color: isDark ? "#FFFFFF" : "#111827",
  fontSize: scaleFont(16),
}
```

### Field Spacing
- Margin Bottom: `scaleSpacing(28)` between fields

### Error State
- Border Color: `#EF4444`
- Border Width: `1.5`

## Components

### Bottom Sheets
- Border Radius (top): `28px`
- Shadow: Appropriate elevation for platform
- Dark Mode Background: `#1F2937`
- Light Mode Background: `#FFFFFF`

### Buttons
- Border Radius: `12px` (buttons), `24px` (large buttons)
- Padding: Responsive using `scaleSpacing`

### Modals
- Background Overlay: `rgba(0, 0, 0, 0.5)`
- Sheet Border Radius: `28px` (top corners)

## Spacing Scale
- Use `scaleSpacing()` for all spacing
- Standard gaps: `scaleSpacing(8)`, `scaleSpacing(12)`, `scaleSpacing(16)`, `scaleSpacing(20)`, `scaleSpacing(24)`, `scaleSpacing(28)`

## Icons
- Standard sizes: `scaleSize(20)`, `scaleSize(24)`, `scaleSize(28)`
- Colors follow text color rules or category colors when applicable

