# Frontend Testing Guide

## Quick Start

The frontend dev server is now running and ready to test!

### Access the Application

**URL**: `http://localhost:5174/`

The application will automatically reload whenever you make changes to any file (Hot Module Replacement - HMR).

---

## Testing the 7 Tabs

### Tab 1: Company Info ✓
1. Go to **Company Info** tab (first tab)
2. Fill in the form fields:
   - Company Name: "Acme Technologies"
   - Website: "https://acme.com"
   - Industry: "SaaS"
   - Description: "Leading AI education platform"
3. Click on topics to select them (AI, EdTech, Education)
4. Choose Brand Tone: "Professional"
5. Click **Save Changes** button
6. You should see a green success banner: "Company information saved successfully"

**What to look for:**
- Form fields are editable
- Topics highlight when selected
- Save button works
- Success message appears

---

### Tab 2: Campaign & Scraper ✓
1. Go to **Campaign & Scraper** tab
2. Fill in the campaign setup:
   - Campaign Name: "Q1 EdTech Outreach"
   - Campaign Type: "PR Outreach"
   - Topic(s): "AI in Education"
   - Geography: "United States"
3. Click **Run Scraper** button
4. Wait 2 seconds - you should see mock results
5. Results table shows sample journalist contacts:
   - Jane Doe, Tech News Daily (95% match)
   - John Smith, Education Weekly (88% match)
6. Select/deselect contacts using checkboxes
7. Click **Save Contacts** button

**What to look for:**
- Loading spinner while "scraping"
- Results table appears with sample data
- Checkboxes work for selecting contacts
- Topic match percentages display

---

### Tab 3: Email Lists ✓
1. Go to **Email Lists** tab
2. Click **Upload CSV** button
3. Filter by status using the dropdown
4. View the sample list:
   - Tech Journalists (156 contacts)
   - Shows 3 unsubscribed, 2 blocked

**What to look for:**
- Upload button is accessible
- Filter dropdown works
- Table displays list information
- Action buttons (Download, Delete) are visible

---

### Tab 4: Generate Personalized Emails ✓
1. Go to **Generate Emails** tab
2. Paste reference content in the textarea
3. Set Email Objective: "Pitch article"
4. Set Tone: "Professional"
5. Set Length: "Medium"
6. Click **Generate Email** button
7. Wait ~2 seconds - preview appears on the right
8. Preview shows:
   - Subject Line
   - Email Body
   - Copy and Save buttons

**What to look for:**
- Form inputs are responsive
- Loading state shows while generating
- Preview panel appears with generated content
- Copy/Save buttons are functional

---

### Tab 5: Send Email Campaign ✓
1. Go to **Send Campaign** tab
2. Select Campaign: "Q1 EdTech Outreach"
3. Email Account shows: "✓ Verified campaigns@dumroo.ai"
4. Choose Sending Speed:
   - Click **Slow** (Safe - 60s apart)
   - Click **Medium** (Standard - 30s apart)
   - Click **Fast** (Quick - 5s apart) - Shows warning
5. Click **Start Campaign** button
6. Progress section appears showing:
   - Sent: 45
   - Remaining: 105
   - Total: 150
   - Progress bar fills

**What to look for:**
- Campaign selector works
- Email account verification badge shows
- Speed buttons highlight when selected
- Fast speed shows yellow warning banner
- Progress updates in real-time
- Pause button appears when sending

---

### Tab 6: Email Tracking ✓
1. Go to **Email Tracking** tab
2. View KPI cards showing:
   - Open Rate: 46.2%
   - Click Rate: 15.9%
   - Bounce Rate: 3.4%
3. Click on tracking status tabs:
   - Delivered (145)
   - Opened (67)
   - Clicked (23)
   - Bounced (5)
   - Responses (12)
   - Unsubscribed (0)
4. Tab buttons highlight when selected

**What to look for:**
- KPI cards display with color coding
- Tab buttons are clickable
- Tab switching works smoothly
- Contact counts update per tab

---

### Tab 7: Respond to Responses ✓
1. Go to **Respond to Responses** tab
2. Left panel shows inbox with 2 sample responses:
   - Jane Doe: "Interested" (green badge)
   - John Smith: "Not Interested" (red badge)
3. Click on a response to view details
4. Right panel shows:
   - Sender information
   - Email thread
   - Reply composer textarea
5. Type a response in the textarea
6. Click **Mark Action** or **Send Reply** buttons

**What to look for:**
- Response list displays with sentiment badges
- Clicking response highlights it
- Detail panel shows full email thread
- Reply composer has focus
- Action buttons are functional

---

## Making Live Changes

The dev server uses **Hot Module Replacement (HMR)**, so you'll see changes instantly!

### Example: Change a Button Color

1. Open `src/pages/CompanyInfo.jsx`
2. Find this line (around line 87):
   ```jsx
   className="btn btn-primary"
   ```
3. Change it to test:
   ```jsx
   className="btn btn-secondary"
   ```
4. **Save the file** - the page auto-refreshes
5. The Save button color changes immediately!

### Example: Change Header Text

1. Open `src/pages/CompanyInfo.jsx`
2. Find the `<h1>` tag:
   ```jsx
   <h1>Company Information</h1>
   ```
3. Change it to:
   ```jsx
   <h1>Company Settings</h1>
   ```
4. **Save** - the change appears instantly

### Example: Add a New Form Field

1. Open `src/pages/CompanyInfo.jsx`
2. In the `formData` state, add:
   ```jsx
   tagline: '',
   ```
3. Add a form group in the JSX:
   ```jsx
   <div className="form-group">
     <label htmlFor="tagline">Company Tagline</label>
     <input
       id="tagline"
       type="text"
       name="tagline"
       value={formData.tagline}
       onChange={handleInputChange}
       placeholder="e.g., Education Through AI"
     />
   </div>
   ```
4. **Save** - the new field appears in the form

---

## Testing Different Screen Sizes

### Responsive Design

1. Open DevTools: **F12** or **Ctrl+Shift+I**
2. Click the device toggle: **Ctrl+Shift+M**
3. Test at different breakpoints:

**Mobile (375px):**
- Sidebar converts to top navigation
- Form fields stack vertically
- Buttons take full width

**Tablet (768px):**
- Two-column layouts become single column
- Table columns hide on small screens
- Compact sidebar

**Desktop (1024px+):**
- Full layout as designed
- All columns visible
- Full sidebar

### Test Interactions

- Try filling forms on mobile
- Check button hover effects
- Test dropdown menus
- Verify modal/popup positioning

---

## Testing Form Validation

### Company Info Tab
1. Try clicking "Save Changes" without entering name
2. Try entering invalid URL format
3. Try clearing a required field

**Expected**: Error messages appear (currently showing placeholder implementation)

### Email Lists Tab
1. Try uploading non-CSV file
2. Try large file upload

**Expected**: File validation (currently shows placeholder)

---

## Testing Navigation

### Tab Switching
1. Click each tab in order
2. Verify sidebar highlights current tab
3. Check that page content changes
4. Verify scroll position resets

### Sidebar on Mobile
1. Toggle to mobile view (375px)
2. Click tabs in horizontal layout
3. Verify no sidebar overlap

---

## Debugging Tips

### Browser Console (F12)
- Check for any JavaScript errors (red X)
- Check for warnings (yellow triangle)
- Look in Network tab for API calls

### React DevTools
1. Install: Chrome extension "React Developer Tools"
2. Open DevTools > Components tab
3. Inspect component props and state
4. Verify state changes when interacting

### Vite DevTools
- DevTools appear in bottom right during development
- Shows module updates
- Click for real-time module info

---

## Modifying Styles

### Global Styles
Edit `src/index.css` for global changes:
- Font sizes
- Colors
- Spacing

### Component Styles
Each component has a `.css` file:
- `src/pages/CompanyInfo.css`
- `src/components/Sidebar.css`
- etc.

**Example: Change primary button color**

Open `src/pages/CompanyInfo.css`, find:
```css
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}
```

Change to:
```css
.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

Save - button color changes to green instantly!

---

## Common Testing Scenarios

### Test 1: Complete Workflow
1. Company Info: Fill and save company details
2. Campaign & Scraper: Create campaign and run scraper
3. Email Lists: View/upload contacts
4. Generate Emails: Create email template
5. Send Campaign: Send emails
6. Tracking: View results
7. Responses: Respond to replies

### Test 2: Error Handling
1. Leave required fields blank
2. Submit forms with invalid data
3. Try actions in wrong order
4. Test edge cases

### Test 3: Performance
1. View with large email lists (scroll performance)
2. Switch tabs rapidly
3. Open DevTools Network tab - check bundle size

### Test 4: Accessibility
1. Use Tab key to navigate
2. Use keyboard to interact with forms
3. Test with screen reader (VoiceOver/NVDA)

---

## Stopping the Dev Server

When done testing, you can stop the server:

```bash
# Kill the process
kill $(lsof -t -i:5174)

# Or if using background process
fg          # Bring to foreground
Ctrl+C      # Exit
```

---

## Next Steps for Integration

Once frontend is tested, you'll need to:

1. **Connect Supabase Auth** - Replace mock user in `useAuth.js`
2. **Connect Backend APIs** - Replace mock data in each tab
3. **Set Environment Variables** - Update `.env` with real credentials
4. **Test E2E Workflows** - Company → Campaign → Send → Track

The UI is ready - now it's time to connect the backend!
