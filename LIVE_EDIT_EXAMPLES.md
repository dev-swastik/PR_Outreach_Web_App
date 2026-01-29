# Live Edit Examples - See Changes Instantly

The dev server has **Hot Module Replacement (HMR)** enabled. This means:
- Make changes to any `.jsx`, `.css`, or `.js` file
- **Save the file** (Ctrl+S)
- Changes appear in browser instantly **without page refresh**
- Your form input values are preserved

---

## Example 1: Change Button Text

### Before
File: `src/pages/CompanyInfo.jsx` (line 87)
```jsx
<button
  className="btn btn-primary"
  onClick={handleSave}
  disabled={loading || saved}
>
  {loading ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
  {(loading || saved) && <span className={loading ? 'spinner' : 'checkmark'}>•</span>}
</button>
```

### After
```jsx
<button
  className="btn btn-primary"
  onClick={handleSave}
  disabled={loading || saved}
>
  {loading ? 'Processing...' : saved ? 'Saved Successfully!' : 'Save Your Company Info'}
  {(loading || saved) && <span className={loading ? 'spinner' : 'checkmark'}>•</span>}
</button>
```

### Result
After saving the file: Button text updates in real-time!

---

## Example 2: Change Button Color

### Before
File: `src/pages/CompanyInfo.css` (line 117)
```css
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
```

### After (Green)
```css
.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
```

### Result
All buttons with `btn-primary` class turn green instantly!

---

## Example 3: Add a New Field

### Before
File: `src/pages/CompanyInfo.jsx` (line 11)
```jsx
const [formData, setFormData] = useState({
  companyName: '',
  description: '',
  website: '',
  industry: '',
  targetTopics: [],
  brandTone: 'Professional',
});
```

### After
```jsx
const [formData, setFormData] = useState({
  companyName: '',
  description: '',
  website: '',
  industry: '',
  targetTopics: [],
  brandTone: 'Professional',
  companySize: 'Small',  // NEW
  foundingYear: 2020,    // NEW
});
```

### Add to JSX (after industry field, around line 64)
```jsx
<div className="form-group">
  <label htmlFor="companySize">Company Size</label>
  <select
    id="companySize"
    name="companySize"
    value={formData.companySize}
    onChange={handleInputChange}
  >
    <option>Small (1-50)</option>
    <option>Medium (51-500)</option>
    <option>Large (500+)</option>
  </select>
</div>

<div className="form-group">
  <label htmlFor="foundingYear">Founded</label>
  <input
    id="foundingYear"
    type="number"
    name="foundingYear"
    value={formData.foundingYear}
    onChange={handleInputChange}
  />
</div>
```

### Result
New fields appear instantly in the form!

---

## Example 4: Change Section Title

### Before
File: `src/pages/EmailTracking.jsx` (line 42)
```jsx
<h1>Email Tracking Dashboard</h1>
<p>Monitor campaign performance and email engagement</p>
```

### After
```jsx
<h1>Campaign Performance Analytics</h1>
<p>Real-time metrics for all your outreach campaigns</p>
```

### Result
Page title and subtitle update instantly!

---

## Example 5: Add a New Tab (More Complex)

### Step 1: Add Tab Definition
File: `src/App.jsx` (line 11)
```jsx
const TABS = [
  { id: 'company', label: 'Company Info', icon: Home },
  { id: 'campaign', label: 'Campaign & Scraper', icon: Layout },
  { id: 'lists', label: 'Email Lists', icon: Mail },
  { id: 'generate', label: 'Generate Emails', icon: Mail },
  { id: 'send', label: 'Send Campaign', icon: Send },
  { id: 'tracking', label: 'Email Tracking', icon: BarChart3 },
  { id: 'responses', label: 'Respond', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }, // NEW
];
```

### Step 2: Add Component
Create: `src/pages/Analytics.jsx`
```jsx
export default function Analytics() {
  return (
    <div className="analytics">
      <div className="page-header">
        <h1>Advanced Analytics</h1>
        <p>Detailed campaign analysis and insights</p>
      </div>
      <div style={{ padding: '2rem', background: 'white', borderRadius: '12px' }}>
        <p>Analytics dashboard coming soon!</p>
      </div>
    </div>
  );
}
```

### Step 3: Import and Add to App
File: `src/App.jsx` (line 6)
```jsx
import Analytics from './pages/Analytics'; // NEW
```

And in the render section (line 66):
```jsx
{activeTab === 'analytics' && <Analytics />}
```

### Result
New "Analytics" tab appears in sidebar and is fully functional!

---

## Example 6: Change Colors & Styling

### Before
File: `src/components/Sidebar.css` (line 7)
```css
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  ...
}
```

### After (Lighter theme)
```css
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #4c1d95 0%, #2d1b4e 100%);
  color: white;
  ...
}
```

### Result
Sidebar background color changes instantly!

---

## Example 7: Update KPI Cards

### Before
File: `src/pages/EmailTracking.jsx` (line 20)
```jsx
const kpis = [
  { label: 'Open Rate', value: '46.2%', color: 'blue' },
  { label: 'Click Rate', value: '15.9%', color: 'purple' },
  { label: 'Bounce Rate', value: '3.4%', color: 'red' },
];
```

### After
```jsx
const kpis = [
  { label: 'Open Rate', value: '62.8%', color: 'blue' },
  { label: 'Click Rate', value: '28.5%', color: 'purple' },
  { label: 'Bounce Rate', value: '1.2%', color: 'red' },
  { label: 'Reply Rate', value: '8.3%', color: 'green' },
];
```

### Result
KPI values and a new KPI card appear instantly!

---

## Example 8: Quick Test - Change Form Placeholder

### Before
File: `src/pages/CompanyInfo.jsx` (line 50)
```jsx
<input
  id="companyName"
  type="text"
  name="companyName"
  value={formData.companyName}
  onChange={handleInputChange}
  placeholder="e.g., Acme Corp"
/>
```

### After
```jsx
<input
  id="companyName"
  type="text"
  name="companyName"
  value={formData.companyName}
  onChange={handleInputChange}
  placeholder="Your awesome company name"
/>
```

### Result
Placeholder text updates instantly!

---

## Tips for Testing Hot Reload

### ✓ What Works (Instant Updates)
- Text content changes
- CSS/styling changes
- JSX structure changes
- New components added
- Form placeholders
- Button labels
- Colors and fonts

### ⚠ Requires Refresh
- Major state structure changes
- Breaking import errors
- Environment variable changes
- TypeScript type errors (if strict mode)

### 🔥 How to Trigger Refresh If Needed
- Save an import statement change
- Change `package.json` and run `npm install`
- Or manually press F5 in browser

---

## Common Edit Workflow

1. **See what you want to change** in the browser
2. **Open the file** in your editor
3. **Make the change**
4. **Save** (Ctrl+S or Cmd+S)
5. **Watch the browser** - change appears instantly!
6. **No refresh needed** - your form data is preserved

---

## Try It Now!

The dev server is running. Pick any example above and:
1. Open the file in your editor
2. Make the change shown in the "After" section
3. Save the file
4. Watch your browser update instantly!

This is the power of Vite + React HMR! 🚀
