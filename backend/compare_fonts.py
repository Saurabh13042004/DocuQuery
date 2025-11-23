#!/usr/bin/env python3
"""
Compare fonts between original and edited PDF for specific text.
Focus on date '04-11-2023' and similar patterns.
"""
import pymupdf as fitz
import os

def find_text_and_font(pdf_path, search_text=None):
    """Find specific text and extract font information."""
    doc = fitz.open(pdf_path)
    page = doc[0]
    text_dict = page.get_text("dict")
    
    results = []
    
    for block in text_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                
                # If searching for specific text
                if search_text:
                    if search_text in text or search_text in span.get("text", ""):
                        results.append({
                            "text": span.get("text", ""),
                            "font": span.get("font", "N/A"),
                            "size": span.get("size", "N/A"),
                            "color": span.get("color", "N/A"),
                            "bbox": span.get("bbox", "N/A"),
                            "flags": span.get("flags", "N/A")
                        })
                # Otherwise collect all
                else:
                    if any(pattern in text for pattern in ["04", "11", "2023", "date", "Date", "DATE"]):
                        results.append({
                            "text": span.get("text", ""),
                            "font": span.get("font", "N/A"),
                            "size": span.get("size", "N/A"),
                            "color": span.get("color", "N/A"),
                            "bbox": span.get("bbox", "N/A"),
                            "flags": span.get("flags", "N/A")
                        })
    
    doc.close()
    return results

def main():
    print("\n" + "="*80)
    print("PDF FONT COMPARISON: Original vs Edited")
    print("="*80 + "\n")
    
    original_pdf = "pdfs/mpdf.pdf"
    edited_pdf = "pdfs/edited_20251123175730_mpdf.pdf"
    
    # Check if files exist
    if not os.path.exists(original_pdf):
        print(f"✗ Original PDF not found: {original_pdf}")
        return
    
    if not os.path.exists(edited_pdf):
        print(f"✗ Edited PDF not found: {edited_pdf}")
        return
    
    print(f"Original PDF: {original_pdf}")
    print(f"Edited PDF:   {edited_pdf}\n")
    
    # Search for date pattern
    search_patterns = ["04-11-2023", "04", "11", "2023"]
    
    for pattern in search_patterns:
        print(f"\n{'='*80}")
        print(f"Searching for: '{pattern}'")
        print(f"{'='*80}\n")
        
        print(f"--- ORIGINAL PDF ---")
        original_results = find_text_and_font(original_pdf, pattern)
        
        if original_results:
            for i, result in enumerate(original_results, 1):
                print(f"\nMatch {i}:")
                print(f"  Text:  '{result['text']}'")
                print(f"  Font:  {result['font']}")
                print(f"  Size:  {result['size']}")
                print(f"  Color: {result['color']}")
                print(f"  Flags: {result['flags']}")
                print(f"  BBox:  {result['bbox']}")
        else:
            print("  No matches found")
        
        print(f"\n--- EDITED PDF ---")
        edited_results = find_text_and_font(edited_pdf, pattern)
        
        if edited_results:
            for i, result in enumerate(edited_results, 1):
                print(f"\nMatch {i}:")
                print(f"  Text:  '{result['text']}'")
                print(f"  Font:  {result['font']}")
                print(f"  Size:  {result['size']}")
                print(f"  Color: {result['color']}")
                print(f"  Flags: {result['flags']}")
                print(f"  BBox:  {result['bbox']}")
        else:
            print("  No matches found")
        
        # Compare
        if original_results and edited_results:
            print(f"\n--- COMPARISON ---")
            
            # Compare first result
            orig = original_results[0]
            edit = edited_results[0]
            
            font_match = orig['font'] == edit['font']
            size_match = abs(float(orig['size']) - float(edit['size'])) < 0.1 if isinstance(orig['size'], (int, float)) and isinstance(edit['size'], (int, float)) else False
            color_match = orig['color'] == edit['color']
            
            print(f"  Font match:  {font_match} ({orig['font']} vs {edit['font']})")
            print(f"  Size match:  {size_match} ({orig['size']} vs {edit['size']})")
            print(f"  Color match: {color_match} ({orig['color']} vs {edit['color']})")
            
            if font_match and size_match and color_match:
                print("\n  ✓ ALL FORMATTING PRESERVED!")
            else:
                print("\n  ⚠ Some formatting changed")

if __name__ == "__main__":
    main()
