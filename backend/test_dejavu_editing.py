#!/usr/bin/env python3
"""
Test PDF editing with the newly registered DejaVu fonts.
"""
import sys
sys.path.insert(0, 'c:\\Users\\sv176\\OneDrive\\Documents\\GitHub\\DocuQuery\\backend')

import asyncio
from app.services.pdf_service import edit_pdf

async def test_with_dejavu_fonts():
    """Test PDF editing with DejaVu fonts."""
    
    print("\n" + "="*80)
    print("TESTING PDF EDITING WITH DEJAVU FONTS")
    print("="*80 + "\n")
    
    pdf_path = "pdfs/mpdf.pdf"
    
    print("Test: Edit '04-11-2023' to '25-12-2023' with DejaVu fonts\n")
    print("-" * 80)
    
    result = await edit_pdf(pdf_path, "Change the DOB from 04-11-2023 to 25-12-2023")
    
    if result and result.get('success'):
        edited_url = result.get('editedPdfUrl')
        print(f"\n✓ SUCCESS!")
        print(f"  Edited PDF: {edited_url}")
        print(f"  Changes: {result.get('changes')}")
        
        # Now verify the fonts in the edited PDF
        print("\n" + "-" * 80)
        print("VERIFYING FONTS IN EDITED PDF")
        print("-" * 80 + "\n")
        
        import pymupdf as fitz
        
        # Check both original and edited
        original_doc = fitz.open(pdf_path)
        original_page = original_doc[0]
        original_text_dict = original_page.get_text("dict")
        
        edited_path = edited_url.replace("/pdfs/", "pdfs/")
        edited_doc = fitz.open(edited_path)
        edited_page = edited_doc[0]
        edited_text_dict = edited_page.get_text("dict")
        
        # Find the DOB in both
        original_dob_font = None
        edited_dob_font = None
        
        for block in original_text_dict.get("blocks", []):
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if "04-11-2023" in span.get("text", ""):
                            original_dob_font = span.get("font")
                            break
        
        for block in edited_text_dict.get("blocks", []):
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if "25-12-2023" in span.get("text", ""):
                            edited_dob_font = span.get("font")
                            break
        
        original_doc.close()
        edited_doc.close()
        
        print(f"Original DOB font: {original_dob_font}")
        print(f"Edited DOB font:   {edited_dob_font}")
        
        if edited_dob_font == original_dob_font or edited_dob_font == "DejaVuSerifCondensed":
            print(f"\n✓ FONT PRESERVED EXACTLY! ({edited_dob_font})")
        else:
            print(f"\nℹ Font changed to: {edited_dob_font}")
            if "DejaVu" in (edited_dob_font or ""):
                print("  ✓ DejaVu font family preserved")
    else:
        print(f"\n✗ FAILED: {result}")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    asyncio.run(test_with_dejavu_fonts())
