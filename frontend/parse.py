import re, json, time
import pdfplumber
from pathlib import Path

FLAGS = re.I | re.M | re.S
STATUS = r"(?:P\s*A\s*S\s*S|F\s*A\s*I\s*L)"

# Precompile patterns
RE = {
    "auth": re.compile(r"Authorized\s*to\s*Work\s*in\s*the\s*U\.?S\.?\s*:\s*(Yes|No)", FLAGS),
    "work_auth": re.compile(r"Current\s*Work\s*Authorization\s*:\s*([^\n]+)", FLAGS),
    "visa_needed": re.compile(r"Visa\s*Sponsorship\s*Need(?:ed)?\s*:\s*(Yes|No)", FLAGS),
    "visa_sought": re.compile(r"Visa\s*Sponsorship\s*Sought\s*:\s*([^\n]+)", FLAGS),
    "step1_blk": re.compile(r"USMLE\s*STEP\s*1[^\n]*(?:\n(?!USMLE\s*STEP\s*2)[^\n]*)*", FLAGS),
    "step2_blk": re.compile(r"USMLE\s*STEP\s*2[^\n]*(?:\n(?!USMLE\s*STEP\s*1|USMLE\s*STEP\s*3|ECFMG)[^\n]*)*", FLAGS),
    "row": re.compile(r"(\d{1,2}/\d{1,2}/\d{2,4})[^\r\n]*?\b(" + STATUS + r")\b(?!/)\s*(?:[^\r\n]*?\((\d{3})\))?", re.I),
    "row_alt": re.compile(r"(\d{1,2}/\d{1,2}/\d{2,4})\s+(" + STATUS + r")\b(?:.*?\b(\d{3})\b)?", re.I),
    "ecfmg": re.compile(r"ECFMG\s*Certified\s*:\s*(Yes|No|Not Available)", FLAGS),
}

def text_of(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        raw = "\n".join(p.extract_text() or "" for p in pdf.pages)
    # Normalize NBSP and odd spacing that split tokens like "P ass"
    raw = raw.replace("\u00a0", " ")
    raw = re.sub(r"[ \t]+", " ", raw)
    return raw

# Note: Step 2 pass does not imply Step 1 pass; each step is parsed independently.
def parse_step(blocks):
    """
    Extract outcomes for a given step.
    - blocks: list[str] from primary block regex
    """
    if not blocks:
        primary = ""
    else:
        primary = "\n".join(blocks)
    scan_txt = primary

    # Line-wise extraction keyed by dated lines within this step block
    lines = [ln.strip() for ln in scan_txt.splitlines() if ln.strip()]
    date_pat = re.compile(r"\d{1,2}/\d{1,2}/\d{2,4}\b", re.I | re.M)
    status_pat = re.compile(r"\b" + STATUS + r"\b", re.I | re.M)
    score_paren = re.compile(r"\((\d{3})\)")
    score_space = re.compile(r"\s(\d{3})(?:\s|$)")
    
    # Use a dict to track unique exam attempts by date to avoid double-counting
    exam_attempts = {}
    
    for ln in lines:
        if not date_pat.search(ln):
            continue
        m_status = status_pat.search(ln)
        if not m_status:
            continue
        
        date = date_pat.search(ln).group(0)
        st_raw = re.sub(r"\s+", "", m_status.group(0)).upper()
        
        # Normalize date format to handle variations like "2/2/2021" vs "2/02/2021"
        date_parts = date.split('/')
        if len(date_parts) == 3:
            normalized_date = f"{int(date_parts[0])}/{int(date_parts[1])}/{date_parts[2]}"
        else:
            normalized_date = date
        
        # Only record this attempt if we haven't seen this date before, or if it's a PASS (passes override fails for same date)
        if normalized_date not in exam_attempts or st_raw == "PASS":
            score = None
            m_sc = score_paren.search(ln)
            if m_sc:
                score = m_sc.group(1)
            else:
                m_sc = score_space.search(ln)
                if m_sc:
                    score = m_sc.group(1)
            
            exam_attempts[normalized_date] = {
                "status": st_raw,
                "score": score,
                "original_date": date
            }

    # Count failures and collect pass information
    failures = sum(1 for attempt in exam_attempts.values() if attempt["status"] == "FAIL")
    pass_dates = [attempt["original_date"] for attempt in exam_attempts.values() if attempt["status"] == "PASS"]
    scores = [attempt["score"] for attempt in exam_attempts.values() if attempt["status"] == "PASS" and attempt["score"]]

    passed = bool(pass_dates)
    pass_date = pass_dates[-1] if pass_dates else None
    score = scores[-1] if scores else None

    present = bool(blocks)
    return {
        "present": present,
        "passed": passed,
        "pass_date": pass_date,
        "score": score,
        "failures": failures,
    }

def parse(txt):
    visa = {
        "authorized_to_work_us": (m := RE["auth"].search(txt)) and m.group(1),
        "current_work_authorization": (m := RE["work_auth"].search(txt)) and m.group(1),
        "visa_sponsorship_needed": (m := RE["visa_needed"].search(txt)) and m.group(1),
        "visa_sponsorship_sought": (m := RE["visa_sought"].search(txt)) and m.group(1),
    }
    s1 = parse_step(RE["step1_blk"].findall(txt))
    s2 = parse_step(RE["step2_blk"].findall(txt))
    ecfmg_match = RE["ecfmg"].search(txt)
    ecfmg = {"present": bool(ecfmg_match), "certified": ecfmg_match.group(1) if ecfmg_match else "Not Available"}
    return {"visa": visa, "usmle": {"step1": s1, "step2_ck": s2}, "ecfmg_status_report": ecfmg}

def parse_pdf_file(pdf_path):
    """
    Parse a PDF file and return structured data.
    This is the main function that will be called by the UI.

    Args:
        pdf_path (str): Path to the PDF file to parse

    Returns:
        dict: Parsed application data
    """
    try:
        pdf_text = text_of(pdf_path)
        result = parse(pdf_text)
        result["file"] = Path(pdf_path).name
        return result
    except Exception as e:
        return {"error": f"Failed to parse PDF: {str(e)}", "file": Path(pdf_path).name}

if __name__ == "__main__":
    # Test with the sample PDF we have
    sample_pdf = Path("Haruya Hirota header cuts.pdf")
    if sample_pdf.exists():
        t0 = time.time()
        result = parse_pdf_file(str(sample_pdf))
        Path("parsed_sample.json").write_text(json.dumps([result], indent=2))
        print(f"Parsed 1 sample PDF in {time.time() - t0:.2f}s")
        print("Result saved to parsed_sample.json")
    else:
        print("Sample PDF not found. Please ensure 'Haruya Hirota header cuts.pdf' exists.")