#!/usr/bin/env python3
"""
Check the latest edited PDF and compare with original.
"""
import pymupdf as fitz
from pathlib import Path

def check_latest_edit():
    """Check the latest edited PDF."""
    print("\n" + "="*80)
    print("LATEST EDIT - FONT VERIFICATION")
    print("="*80 + "\n")
    
    # Find the latest edited PDF
    pdfs_dir = Path("pdfs")
    edited_pdfs = sorted(pdfs_dir.glob("edited_*.pdf"))
    
    if not edited_pdfs:
        print("No edited PDFs found\n")
        return
    
    latest = edited_pdfs[-1]
    print(f"Latest edited PDF: {latest.name}\n")
    
    # Open both original and edited
    original_doc = fitz.open("pdfs/mpdf.pdf")
    edited_doc = fitz.open(str(latest))
    
    original_page = original_doc[0]
    edited_page = edited_doc[0]
    
    # Find the date text
    print("FONT COMPARISON FOR DATES:")
    print("-" * 80)
    
    original_text_dict = original_page.get_text("dict")
    edited_text_dict = edited_page.get_text("dict")
    
    # Find all dates in original
    original_dates = {}
    for block in original_text_dict.get("blocks", []):
        if block.get("type") == 0:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if any(date_part in text for date_part in ['2023', '2024', '04-', '11-', '24-']):
                        original_dates[text] = {
                            'font': span.get('font'),
                            'size': span.get('size'),
                            'color': span.get('color')
                        }
    
    # Find all dates in edited
    edited_dates = {}
    for block in edited_text_dict.get("blocks", []):
        if block.get("type") == 0:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if any(date_part in text for date_part in ['2023', '2024', '04-', '11-', '24-', '25-', '12-']):
                        edited_dates[text] = {
                            'font': span.get('font'),
                            'size': span.get('size'),
                            'color': span.get('color')
                        }
    
    # Compare
    for text in sorted(set(list(original_dates.keys()) + list(edited_dates.keys()))):
        if text in original_dates and text in edited_dates:
            orig = original_dates[text]
            edit = edited_dates[text]
            match = orig == edit
            symbol = "✓" if match else "✗"
            print(f"\n{symbol} {text}")
            print(f"  Original: {orig['font']} @ {orig['size']:.2f}")
            print(f"  Edited:   {edit['font']} @ {edit['size']:.2f}")
        elif text in original_dates:
            print(f"\n📍 {text} (original only)")
            print(f"  {original_dates[text]}")
        elif text in edited_dates:
            print(f"\n✏️  {text} (edited)")
            print(f"  {edited_dates[text]}")
    
    original_doc.close()
    edited_doc.close()
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    check_latest_edit()
