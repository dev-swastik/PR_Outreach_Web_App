# Quick Test Checklist

## Server Status
- [ ] Dev server running at `http://localhost:5174/`
- [ ] No console errors
- [ ] Sidebar loads with all 7 tabs

---

## Tab 1: Company Info
- [ ] Form fields render
- [ ] Can type in all inputs
- [ ] Topics can be selected/deselected
- [ ] Brand tone dropdown works
- [ ] Save button works
- [ ] Success message appears

---

## Tab 2: Campaign & Scraper
- [ ] Campaign form inputs visible
- [ ] Campaign type dropdown works
- [ ] Run Scraper button clickable
- [ ] Loading spinner appears
- [ ] Results table shows 2 sample contacts
- [ ] Checkboxes work for selection
- [ ] Save Contacts button present

---

## Tab 3: Email Lists
- [ ] Upload CSV button visible
- [ ] Filter dropdown works
- [ ] Sample list displays
- [ ] Table shows columns: Name, Source, Contacts, Unsubscribed, Blocked, Status
- [ ] Action buttons visible

---

## Tab 4: Generate Personalized Emails
- [ ] Form inputs render
- [ ] Objective, Tone, Length dropdowns work
- [ ] Generate button works
- [ ] Loading spinner shows
- [ ] Preview panel appears with:
  - [ ] Subject line
  - [ ] Email body
  - [ ] Copy button
  - [ ] Save button

---

## Tab 5: Send Email Campaign
- [ ] Campaign selector works
- [ ] Email account shows "✓ Verified campaigns@dumroo.ai"
- [ ] Speed buttons (Slow/Medium/Fast) selectable
- [ ] Fast speed shows warning
- [ ] Start Campaign button works
- [ ] Progress section appears with stats
- [ ] Progress bar fills
- [ ] Pause button visible when sending

---

## Tab 6: Email Tracking
- [ ] 3 KPI cards display (Open Rate, Click Rate, Bounce Rate)
- [ ] KPI cards have color-coded borders
- [ ] Tracking tabs visible (Delivered, Opened, Clicked, etc.)
- [ ] Tabs are clickable
- [ ] Active tab highlights
- [ ] Contact count updates per tab
- [ ] Table header visible

---

## Tab 7: Respond to Responses
- [ ] Left panel shows inbox with responses
- [ ] Sentiment badges color-coded:
  - [ ] Green for "Interested"
  - [ ] Red for "Not Interested"
- [ ] Clicking response highlights it
- [ ] Right panel shows:
  - [ ] Sender name and email
  - [ ] Email thread
  - [ ] Reply composer
- [ ] Action buttons present (Mark Action, Send Reply)

---

## Navigation & UI
- [ ] Sidebar sticky on scroll
- [ ] Tab transitions smooth
- [ ] No broken images
- [ ] All text readable
- [ ] Mobile responsive (F12 → Ctrl+Shift+M to test)
- [ ] Color contrast sufficient
- [ ] Icons render properly (Lucide)

---

## Live Changes Test
- [ ] Edit a component file (e.g., change button color)
- [ ] Save file
- [ ] Browser auto-refreshes
- [ ] Changes appear instantly (no manual refresh needed)

---

## Performance
- [ ] Page loads in < 2 seconds
- [ ] Tab switching is instant
- [ ] No lag when typing in forms
- [ ] Scrolling is smooth
- [ ] No layout shift/jank

---

## Errors & Console
- [ ] No red errors in console (F12)
- [ ] No 404s for missing resources
- [ ] No CORS errors
- [ ] Warnings are acceptable for now

---

## Ready for Next Phase?
Once all checks pass:
- [ ] Backend API integration
- [ ] Supabase authentication
- [ ] Real database connections
- [ ] Email service integration

**Total Items**: 50+ checks ✓
