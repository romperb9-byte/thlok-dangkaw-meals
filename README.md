# ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងអាហារពេលព្រឹកសិស្ស — សាលាបឋមសិក្សាថ្លុកដង្កោ

ប្រព័ន្ធនេះត្រូវបានរៀបចំឡើងជា **Dual-Mode** ដែលអាចដំណើរការបានយ៉ាងរលូនទាំងនៅលើ **Google Apps Script Web App** និង **GitHub Pages** ដោយភ្ជាប់ទិន្នន័យផ្ទាល់ជាមួយ Google Sheets (Auto Live Sync)។

---

## 📁 រចនាសម្ព័ន្ធឯកសារក្នុងគម្រោង

```
thlok-dangkaw-meals/
├── index.html        # ផ្ទាំងផ្ទៃខាងមុខ (Frontend) សម្រាប់ GitHub Pages & Mobile Fullscreen
├── Code.gs           # កូដ Google Apps Script Backend (API + Sheets Sync)
├── appsscript.json   # កំណត់រចនាសម្ព័ន្ធ Web App Manifest
└── README.md         # ការណែនាំអំពីការដំឡើង និងដំណើរការជាមួយ GitHub
```

---

## 🚀 របៀបដាក់ឱ្យដំណើរការជាមួយ GitHub (GitHub Pages)

### ជំហានទី ១៖ បង្កើត Repository ថ្មីនៅលើ GitHub
1. ចូលទៅកាន់គេហទំព័រ [GitHub](https://github.com/) រួច Login គណនីរបស់អ្នក។
2. ចុចសញ្ញា **+** នៅជ្រុងខាងលើស្តាំដៃ រួចជ្រើសរើស **New repository**។
3. ដាក់ឈ្មោះ Repository (ឧទាហរណ៍៖ `thlok-dangkaw-meals`)។
4. កំណត់វាជា **Public** រួចចុច **Create repository**។

---

### ជំហានទី ២៖ Upload ឯកសារទៅកាន់ GitHub
លោកអ្នកអាចប្រើ Git Command ឬ Upload ផ្ទាល់នៅលើ GitHub Website៖

#### វិធីទី ១៖ ប្រើ Git Command (ផ្ដល់អនុសាសន៍)
បើក Terminal / PowerShell នៅលើកុំព្យូទ័ររបស់អ្នកក្នុងថតគម្រោងនេះ៖
```bash
git init
git add .
git commit -m "Initial commit for School Feeding System"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/thlok-dangkaw-meals.git
git push -u origin main
```
*(ជំនួស `<YOUR-USERNAME>` ដោយឈ្មោះគណនី GitHub របស់អ្នក)*

#### វិធីទី ២៖ Upload ផ្ទាល់លើ Browser
1. នៅក្នុង Repository ដែលទើបបង្កើត ចុចលើពាក្យ **uploading an existing file**។
2. Drag & Drop (អូសទម្លាក់) ឯកសារ `index.html`, `Code.gs`, `appsscript.json`, និង `README.md` ចូល។
3. ចុច **Commit changes**។

---

### ជំហានទី ៣៖ បើកដំណើរការ GitHub Pages (Free Web Hosting)
1. នៅក្នុង Repository របស់អ្នក ចុចលើ Tab **Settings**។
2. នៅម៉ឺនុយខាងឆ្វេងដៃ ចុចលើពាក្យ **Pages**។
3. នៅក្រោមផ្នែក **Build and deployment > Branch**៖
   - ជ្រើសរើស Branch: **main**
   - ជ្រើសរើស Folder: **/ (root)**
4. ចុចប៊ូតុង **Save**។
5. រង់ចាំប្រហែល ១ នាទី GitHub នឹងផ្ដល់ Link គេហទំព័រផ្ទាល់របស់អ្នក ឧទាហរណ៍៖  
   👉 `https://<YOUR-USERNAME>.github.io/thlok-dangkaw-meals/`

---

### ជំហានទី ៤៖ ភ្ជាប់ជាមួយ Google Apps Script Web App
1. ចូលទៅកាន់ Google Sheet របស់អ្នក > ចុច **Extensions** > **Apps Script**។
2. ចម្លងកូដក្នុងឯកសារ `Code.gs` ដាក់ជំនួសកូដចាស់។
3. ចុចប៊ូតុង **Deploy (ដាក់ឱ្យប្រើប្រាស់)** > **New deployment** > ជ្រើសរើសប្រភេទ **Web app**៖
   - **Execute as:** `Me` (គណនីរបស់អ្នក)
   - **Who has access:** `Anyone` (អ្នកណាក៏ដោយ)
4. ចុច **Deploy** រួចចម្លងយក **Web app URL** (មានទម្រង់៖ `https://script.google.com/macros/s/.../exec`)។
5. បើកគេហទំព័រលើ GitHub Pages របស់អ្នក > ចុចប៊ូតុង **⚙️ API** នៅជ្រុងខាងលើស្តាំដៃ រួចបិទភ្ជាប់ (Paste) Web App URL នោះចូលជាការស្រេច!

---

## ✨ លក្ខណៈពិសេសៗនៃប្រព័ន្ធ
- 📱 **Mobile Fullscreen & Modern UI:** ស្រស់ស្អាត ពេញអេក្រង់ទូរសព្ទ ងាយស្រួលចុចដោយមេដៃ។
- ⚡ **Auto Live Sync:** ទាញទិន្នន័យប្រចាំថ្ងៃ និងសរុបប្រចាំខែផ្ទាល់ពី Google Sheets។
- 🍲 **រូបមន្តអាហារូបត្ថម្ភស្តង់ដារ៖**
  - អង្ករ = $0.115 \text{ គ.ក្រ} \times \text{សិស្សហូប}$
  - ប្រេងឆា = $0.005 \text{ លីត្រ} \times \text{សិស្សហូប}$
  - អំបិល/គ្រឿងទេស = $0.001 \text{ គ.ក្រ} \times \text{សិស្សហូប}$
- 🔒 **ការការពារការបញ្ចូលស្ទួន៖** ចាក់សោថ្នាក់ដែលបានបញ្ចូលរួចរាល់ប្រចាំថ្ងៃ (អាចដោះសោកែប្រែបាន)។
- ➕ **បន្ថែមថ្នាក់ស្វ័យប្រវត្តិក្នងប្រព័ន្ធ (Auto System Sync):** បន្ថែមថ្នាក់ថ្មីជាប់ក្នុង Google Sheet ជាអចិន្ត្រៃយ៍។
- 📄 **ទាញយករបាយការណ៍សាលា៖** ទាញយកជា PDF (A4 Landscape) និង Excel (.xlsx) រក្សាទម្រង់ក្បាល និងជើងក្រោម ១០០% ដោយគ្មានបញ្ហា Permission។
