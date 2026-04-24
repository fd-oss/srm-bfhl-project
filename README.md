 BFHL — Node Hierarchy Analyzer

SRM Full Stack Engineering Challenge · Round 1

## 🗂 Project Structure

```
bfhl-project/
├── backend/
│   ├── index.js        ← Express REST API
│   └── package.json
└── frontend/
    └── index.html      ← Single-page UI
```

---

## ⚙️ Setup (Local)

### Backend

```bash
cd backend
npm install
node index.js
# Runs on http://localhost:3000
# POST http://localhost:3000/bfhl
```

### Frontend

Open `frontend/index.html` in your browser (or serve it via any static server).  
Set the API URL field to your hosted backend URL.

---

## 🚀 Deployment

### Backend → Render (recommended free tier)

1. Push this repo to GitHub (public)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. Deploy → copy your URL (e.g. `https://yourname-bfhl.onrender.com`)

### Frontend → Netlify / Vercel

**Netlify:**
1. Drag and drop the `frontend/` folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Done — instant URL

**Vercel:**
1. `npx vercel` in the `frontend/` folder
2. Or import repo at vercel.com and set root to `frontend/`

---

## 📝 Before Deploying

Edit `backend/index.js` lines 7–9:

```js
const USER_ID = "yourname_ddmmyyyy";       // e.g. "johndoe_17091999"
const EMAIL_ID = "yourname@srmist.edu.in"; // your college email
const COLLEGE_ROLL = "RA2111000000000";     // your roll number
```

---

## ✅ API Spec

**POST /bfhl**

Request:
```json
{ "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"] }
```

Response includes:
- `user_id`, `email_id`, `college_roll_number`
- `hierarchies` — array of tree/cycle objects
- `invalid_entries` — entries that failed validation
- `duplicate_edges` — repeated edges (first occurrence kept)
- `summary` — `total_trees`, `total_cycles`, `largest_tree_root`

---

## 🔒 CORS

CORS is enabled for all origins via the `cors` npm package.
