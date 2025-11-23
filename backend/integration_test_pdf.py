#!/usr/bin/env python3
"""
Integration test for the improved PDF editing with font preservation.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, 'c:\\Users\\sv176\\OneDrive\\Documents\\GitHub\\DocuQuery\\backend')

import asyncio
from app.services.pdf_service import edit_pdf

async def test_pdf_editing():
    """Test the improved edit_pdf function."""
    
    print("\n" + "="*60)
    print("Testing Advanced PDF Editing with Font Preservation")
    print("="*60 + "\n")
    
    pdf_path = "pdfs/mpdf.pdf"
    
    # Test 1: Edit NO. 1
    print("TEST 1: Editing 'NO. 1' to 'TEST_FONT_PRESERVE'")
    print("-" * 60)
    
    result = await edit_pdf(pdf_path, "Change NO. 1 to TEST_FONT_PRESERVE")
    
    if result and result.get('success'):
        print(f"✓ Success!")
        print(f"  Edited PDF: {result.get('editedPdfUrl')}")
        print(f"  Changes: {result.get('changes')}")
    else:
        print(f"✗ Failed: {result}")
    
    print("\n")
    
    # Test 2: Edit multiple instances
    print("TEST 2: Editing '04' to 'XX' (date test)")
    print("-" * 60)
    
    result = await edit_pdf(pdf_path, "Change 04 to XX")
    
    if result and result.get('success'):
        print(f"✓ Success!")
        print(f"  Edited PDF: {result.get('editedPdfUrl')}")
        print(f"  Changes: {result.get('changes')}")
    else:
        print(f"✗ Failed: {result}")
    
    print("\n" + "="*60)
    print("Font Preservation Tests Complete")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(test_pdf_editing())
