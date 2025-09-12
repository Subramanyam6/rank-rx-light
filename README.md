# USMLE Applicant Ranking System

## Overview
A lightweight system for parsing and ranking USMLE residency applications using regex-based PDF processing.

## Architecture

### Core Flow
1. **Realistic Test Data** (`synthetic_applicants.json`)
   - 200 diverse synthetic applicants with realistic USMLE performance
   - Covers all edge cases: multiple failures, visa scenarios, ECFMG certification
   - Used for testing and validation, NOT by parse.py

2. **PDF Parsing Engine** (`parse.py`)
   - **DOES NOT read synthetic_applicants.json**
   - Regex-based parsing according to Task_Description.rtf requirements
   - Handles visa status, USMLE Step 1/2 results, ECFMG certification
   - Main function: `parse_pdf_file(pdf_path)` for UI integration

3. **Application Upload** (Future)
   - UI component for users to upload their application PDFs
   - Will call `parse_pdf_file()` from parse.py

4. **Results Display** (Future)
   - UI to show parsed information and ranking
   - Compare uploaded application against synthetic data for ranking

## Files

| File | Purpose |
|------|---------|
| `synthetic_applicants.json` | Realistic test data (200 applicants) |
| `parse.py` | PDF parsing engine with regex |
| `Task_Description.rtf` | Requirements specification |
| `base_clean.txt` | Base template for parsing |
| `Haruya Hirota header cuts.pdf` | Sample PDF for testing |

## Usage

### Test Parsing Engine
```bash
source .venv/bin/activate
python3 parse.py  # Tests with sample PDF and saves to parsed_sample.json
```

### Parse Any PDF (for UI integration)
```python
from parse import parse_pdf_file
result = parse_pdf_file("path/to/your/application.pdf")
print(result)  # Structured data ready for UI display
```

### Verify Test Data
```bash
python3 -c "import json; print(f'Test applicants: {len(json.load(open(\"synthetic_applicants.json\")))}')"
```

### Key Functions for UI Integration
- `parse_pdf_file(pdf_path)` - Main function to parse uploaded PDFs
- Returns structured data: visa info, USMLE results, ECFMG status
- Handles all edge cases from Task_Description.rtf requirements

## Requirements Met
- ✅ Visa status parsing (authorized/work needed/sought)
- ✅ USMLE Step 1 & 2 results (pass/fail, scores, failures)
- ✅ ECFMG certification status
- ✅ Regex-based parsing with comprehensive edge case handling
- ✅ Realistic synthetic data for testing
- ✅ Server-optimized lightweight architecture

## Next Steps
1. Implement UI for PDF upload
2. Add ranking/scoring display
3. Integrate with web framework
4. Deploy to production server
