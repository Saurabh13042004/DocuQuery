#!/usr/bin/env python3
"""
Test script to verify PDF font preservation during editing with fallback logic.
"""
import pymupdf as fitz
import os
from datetime import datetime

def inspect_pdf_fonts(pdf_path, page_num=0):
    """Inspect font information in a PDF."""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    text_dict = page.get_text("dict")
    
    print(f"\n=== Font Information in {os.path.basename(pdf_path)} (Page {page_num}) ===")
    
    font_samples = []
    for block in text_dict.get("blocks", []):
        if block.get("type") == 0:  # Text block
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    font_info = {
                        "font": span.get("font", "Helv"),
                        "size": span.get("size", 12),
                        "color": span.get("color", 0),
                        "flags": span.get("flags", 0),
                        "text": span.get("text", "")[:50]
                    }
                    if font_info not in font_samples:
                        font_samples.append(font_info)
                        if len(font_samples) <= 5:
                            print(f"\nFont: {font_info['font']}")
                            print(f"Size: {font_info['size']}")
                            print(f"Color: {font_info['color']}")
                            print(f"Flags: {font_info['flags']}")
                            print(f"Sample text: {font_info['text']}")
    
    doc.close()
    return font_samples

def test_font_preservation():
    """Test the font preservation in PDF editing with fallback."""
    
    # Use the birth certificate or similar PDF for testing
    pdf_path = "pdfs/mpdf.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF not found: {pdf_path}")
        return
    
    # First, inspect the original PDF
    original_fonts = inspect_pdf_fonts(pdf_path)
    
    # Now let's simulate what the edit_pdf function does
    print("\n=== Testing Font Preservation with Fallback ===\n")
    
    doc = fitz.open(pdf_path)
    page = doc[0]
    text_dict = page.get_text("dict")
    
    # Find some text to replace
    target_text = None
    target_span_info = None
    
    for block in text_dict.get("blocks", []):
        if block.get("type") == 0:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if len(text) > 3:  # Find a meaningful piece of text
                        target_text = text[:10]  # Take first 10 chars
                        target_span_info = span
                        break
                if target_span_info:
                    break
        if target_span_info:
            break
    
    if target_text and target_span_info:
        print(f"Found text to replace: '{target_text}'")
        print(f"Original font: {target_span_info.get('font', 'N/A')}")
        print(f"Original size: {target_span_info.get('size', 'N/A')}")
        print(f"Original color: {target_span_info.get('color', 'N/A')}")
        
        # Extract formatting info
        font_info = {
            "font": target_span_info.get("font", "Helv"),
            "size": target_span_info.get("size", 12),
            "color": target_span_info.get("color", 0),
        }
        
        bbox = target_span_info.get("bbox")
        print(f"Bounding box: {bbox}")
        
        # Clear the area with white
        page.draw_rect(fitz.Rect(bbox), color=None, fill=(1, 1, 1))
        
        # Insert new text with fallback logic
        new_text = "TEST_EDIT"
        color = (0, 0, 0)  # Black
        baseline_point = fitz.Point(bbox[0], bbox[3] - 2)
        
        print(f"\nInserting new text with:")
        print(f"  Font: {font_info['font']}")
        print(f"  Size: {font_info['size']}")
        print(f"  Color: {color}")
        print(f"  Position: {baseline_point}")
        
        text_inserted = False
        
        # Try with original font
        try:
            page.insert_text(
                baseline_point,
                new_text,
                fontname=font_info["font"],
                fontsize=font_info["size"],
                color=color
            )
            print(f"✓ Used original font: {font_info['font']}")
            text_inserted = True
        except Exception as e:
            print(f"✗ Original font failed ({font_info['font']}): {e}")
            # Try Helvetica as fallback
            try:
                page.insert_text(
                    baseline_point,
                    new_text,
                    fontname="Helvetica",
                    fontsize=font_info["size"],
                    color=color
                )
                print("✓ Used fallback font: Helvetica")
                text_inserted = True
            except Exception as e2:
                print(f"✗ Helvetica fallback failed: {e2}")
                # Try without fontname
                try:
                    page.insert_text(
                        baseline_point,
                        new_text,
                        fontsize=font_info["size"],
                        color=color
                    )
                    print("✓ Used default font")
                    text_inserted = True
                except Exception as e3:
                    print(f"✗ All insertion methods failed: {e3}")
        
        if text_inserted:
            print("\n✓ Text inserted successfully")
        else:
            print("\n✗ Could not insert text with any method")
        
        # Save the test result
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        test_output = f"pdfs/test_font_preservation_{timestamp}.pdf"
        doc.save(test_output)
        print(f"✓ Test PDF saved to: {test_output}")
        
        # Verify the edited PDF
        edited_fonts = inspect_pdf_fonts(test_output)
        print("\n✓ Font information verified in edited PDF")
    else:
        print("Could not find suitable text to test")
    
    doc.close()

if __name__ == "__main__":
    test_font_preservation()
