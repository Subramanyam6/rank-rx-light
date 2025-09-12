# RankRx Light - ERAS Application Ranking System

## 🎯 What This Application Does

**RankRx Light** is a comprehensive tool for USMLE residency applicants to:
- **Upload and analyze** their ERAS application PDFs using advanced AI-powered parsing
- **Get instant rankings** by comparing their performance against 200+ synthetic applicants
- **Receive actionable insights** about their competitiveness in the residency match
- **Understand their position** with detailed percentile rankings and statistics

### Key Features
- ✅ **PDF Upload & Parsing**: Drag-and-drop interface with instant analysis
- ✅ **Smart Ranking**: Compare against realistic synthetic applicant data
- ✅ **Professional UI**: Modern, responsive design with smooth animations
- ✅ **Real-time Results**: Instant parsing and ranking calculation
- ✅ **Edge Case Handling**: Robust parsing for all visa types, failure scenarios, and ECFMG statuses

## 🏗️ Architecture Overview

### Complete Application Flow
1. **User Uploads PDF** → Drag-and-drop interface validates and processes files
2. **AI-Powered Parsing** → Python backend extracts visa status, USMLE scores, ECFMG certification
3. **Ranking Calculation** → Frontend compares parsed data against 200 synthetic applicants
4. **Results Display** → Professional UI shows parsed info, rank, percentile, and insights

### Core Components
1. **Frontend (Next.js + React)**
   - Modern UI with Tailwind CSS styling
   - PDF upload with drag-and-drop
   - Real-time parsing and ranking display
   - Responsive design for all devices

2. **Backend Parsing Engine** (`parse.py`)
   - Regex-based PDF parsing according to Task_Description.rtf specifications
   - Handles complex visa scenarios, USMLE results, ECFMG certification
   - Main function: `parse_pdf_file(pdf_path)` returns structured JSON data

3. **Ranking System** (`synthetic_applicants.json`)
   - **200 diverse synthetic applicants** with realistic USMLE performance data
   - Covers all edge cases: multiple exam failures, visa sponsorship needs, ECFMG scenarios
   - Used for percentile ranking and competitive analysis
   - Provides statistical comparison baseline for uploaded applications

4. **Deployment Infrastructure**
   - Python API deployed on Vercel serverless functions
   - Frontend deployed on Vercel with automatic builds
   - Secure file processing with automatic cleanup

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/` | Complete Next.js React application with modern UI |
| `synthetic_applicants.json` | **200 realistic synthetic applicants** for ranking comparison |
| `parse.py` | Core PDF parsing engine with advanced regex patterns |
| `Task_Description.rtf` | Detailed requirements specification for parsing logic |
| `base_clean.txt` | Template structure for consistent parsing output |
| `Haruya Hirota header cuts.pdf` | Sample ERAS application PDF for testing |

## 🚀 Quick Start

### For Users (Web Application)
1. **Visit the deployed application** at your Vercel URL
2. **Upload your ERAS application PDF** using drag-and-drop
3. **Get instant analysis** with ranking against 200+ synthetic applicants
4. **View detailed insights** about your competitive position

### For Developers (Local Development)

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs at http://localhost:3000
```

#### Backend Testing
```bash
# Test the PDF parsing engine
python3 parse.py

# Parse any PDF programmatically
python3 -c "
from parse import parse_pdf_file
result = parse_pdf_file('path/to/your/application.pdf')
print(result)
"
```

## 🎯 How the Ranking Works

The application uses a **weighted scoring system** to rank your application:

### Scoring Formula
```
Score = 0.55 × Step 2 CK Performance +
        0.25 × Step 1 Pass Rate +
        0.10 × Failure History Factor +
        0.05 × Visa Status Factor +
        0.05 × ECFMG Certification
```

### Ranking Process
1. **Parse your PDF** → Extract visa status, USMLE scores, ECFMG status
2. **Calculate your score** → Apply the weighted formula above
3. **Compare against synthetic data** → Rank against 200 diverse applicants
4. **Generate percentile** → Show where you stand statistically
5. **Provide insights** → Actionable recommendations for improvement

## ✅ Features & Capabilities

- **📄 PDF Parsing**: Advanced regex-based extraction of complex application data
- **🏆 Smart Ranking**: Statistical comparison against realistic applicant pool
- **🎨 Modern UI**: Professional, responsive design with smooth animations
- **⚡ Real-time Processing**: Instant results with professional loading states
- **🔒 Secure**: Client-side processing with automatic file cleanup
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **🧪 Comprehensive Testing**: 200 synthetic applicants cover all edge cases

## 🛠️ Technical Implementation

### Scoring Details
- **Step 2 CK**: Score normalized to 0-1 scale (180-300 range)
- **Step 1**: Binary pass/fail with failure penalty
- **Visa Status**: Penalty for sponsorship requirements
- **ECFMG**: Bonus for certification completion
- **Failure History**: Progressive penalties for multiple attempts

### Edge Cases Handled
- Multiple exam failures and retakes
- Various visa sponsorship scenarios
- ECFMG certification statuses
- Incomplete or missing data fields
- Different PDF formats and layouts

## 🤝 For Residency Applicants

This tool helps you:
- **Understand your competitiveness** with data-driven rankings
- **Identify strengths and weaknesses** in your application
- **Make informed decisions** about retakes or program choices
- **Compare against peers** with realistic statistical analysis
- **Get actionable insights** for application strategy

---

**Ready to analyze your ERAS application? Upload your PDF and get instant, professional ranking insights!** 🚀
