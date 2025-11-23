#!/usr/bin/env python3
"""
Check fonts in a specific edited PDF.
"""
import pymupdf as fitz
from pathlib import Path

def check_pdf_fonts(pdf_path):
    """Check all fonts in a PDF."""
    print("\n" + "="*80)
    print(f"FONT ANALYSIS: {Path(pdf_path).name}")
    print("="*80 + "\n")
    
    if not Path(pdf_path).exists():
        print(f"✗ PDF not found: {pdf_path}\n")
        return
    
    doc = fitz.open(pdf_path)
    page = doc[0]
    text_dict = page.get_text("dict")
    
    # Collect all fonts
    fonts_found = {}
    date_info = []
    
    for block in text_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                font = span.get("font", "unknown")
                size = span.get("size", 0)
                
                # Track all fonts
                if font not in fonts_found:
                    fonts_found[font] = {
                        "count": 0,
                        "sizes": [],
                        "examples": []
                    }
                
                fonts_found[font]["count"] += 1
                if size not in fonts_found[font]["sizes"]:
                    fonts_found[font]["sizes"].append(size)
                if len(fonts_found[font]["examples"]) < 3 and text:
                    fonts_found[font]["examples"].append(text[:30])
                
                # Look for dates
                if any(c.isdigit() for c in text):
                    date_info.append({
                        "text": text,
                        "font": font,
                        "size": size,
                        "color": span.get("color", 0),
                        "bbox": span.get("bbox", ())
                    })
    
    # Display fonts
    print("📊 FONTS FOUND IN PDF:")
    print("-" * 80)
    for font_name in sorted(fonts_found.keys()):
        info = fonts_found[font_name]
        print(f"\nFont: {font_name}")
        print(f"  Occurrences: {info['count']}")
        print(f"  Sizes: {sorted(set(info['sizes']))}")
        if info['examples']:
            print(f"  Examples: {', '.join(info['examples'][:2])}")
    
    # Display dates/numbers
    print("\n\n📅 DATES AND NUMBERS FOUND:")
    print("-" * 80)
    dates_shown = set()
    for item in date_info:
        text = item['text']
        if any(c in text for c in ['2023', '2024', '2025', '04', '11', '12', '25', '10']):
            if text not in dates_shown:
                print(f"\nText: '{text}'")
                print(f"  Font: {item['font']}")
                print(f"  Size: {item['size']:.2f}")
                print(f"  Color: {item['color']}")
                dates_shown.add(text)
    
    doc.close()
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    # Check the specific edited PDF
    pdf_path = "pdfs/edited_20251123181512_mpdf.pdf"
    check_pdf_fonts(pdf_path)
    
    # Also check if it exists, list similar files
    if not Path(pdf_path).exists():
        print("Looking for similar files...")
        pdfs_dir = Path("pdfs")
        matching = list(pdfs_dir.glob("edited_20251123181*mpdf.pdf"))
        if matching:
            print(f"Found {len(matching)} similar files:")
            for pdf in sorted(matching):
                print(f"  - {pdf.name}")
                check_pdf_fonts(str(pdf))
