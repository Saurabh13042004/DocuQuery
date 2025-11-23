#!/usr/bin/env python3
"""
Debug font insertion - test different methods.
"""
import pymupdf as fitz
from pathlib import Path

def test_font_loading():
    """Test different ways to load and use fonts."""
    print("\n" + "="*80)
    print("TESTING FONT LOADING METHODS")
    print("="*80 + "\n")
    
    fonts_dir = Path("fonts")
    font_file = fonts_dir / "DejaVuSerifCondensed.ttf"
    
    print(f"Font file: {font_file}")
    print(f"Exists: {font_file.exists()}")
    if font_file.exists():
        print(f"Size: {font_file.stat().st_size / 1024:.1f} KB\n")
    
    # Test 1: Load font object with buffer
    print("Test 1: Load Font object with buffer")
    print("-" * 80)
    try:
        with open(font_file, 'rb') as f:
            font_buffer = f.read()
        font1 = fitz.Font(fontname="DejaVuSerifCondensed", fontbuffer=font_buffer)
        print(f"✓ Successfully created Font object: {font1}")
        print(f"  Font name: {font1.name}")
        print(f"  Is standard: {font1.is_standard}")
    except Exception as e:
        print(f"✗ Failed: {e}\n")
    
    # Test 2: Test insert_text with fontname only
    print("\nTest 2: Insert text with fontname only")
    print("-" * 80)
    try:
        doc = fitz.open()
        page = doc.new_page()
        
        point = fitz.Point(50, 100)
        page.insert_text(point, "Test with DejaVuSerifCondensed", fontname="DejaVuSerifCondensed")
        
        print("✓ Text inserted successfully")
        
        # Check what font was actually used
        text_dict = page.get_text("dict")
        for block in text_dict.get("blocks", []):
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        print(f"  Actual font used: {span.get('font')}")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    # Test 3: Insert with font object
    print("\nTest 3: Insert text with Font object")
    print("-" * 80)
    try:
        with open(font_file, 'rb') as f:
            font_buffer = f.read()
        
        doc = fitz.open()
        page = doc.new_page()
        
        # Create font object
        font_obj = fitz.Font(fontname="DejaVuSerifCondensed", fontbuffer=font_buffer)
        
        point = fitz.Point(50, 150)
        page.insert_text(point, "Test with Font object", font=font_obj)
        
        print("✓ Text inserted with Font object")
        
        # Check what font was actually used
        text_dict = page.get_text("dict")
        for block in text_dict.get("blocks", []):
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        print(f"  Actual font used: {span.get('font')}")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    # Test 4: Check available builtin fonts
    print("\nTest 4: List available builtin fonts")
    print("-" * 80)
    try:
        doc = fitz.open()
        page = doc.new_page()
        
        # Try standard fonts
        for fname in ["Helvetica", "Times-Roman", "DejaVuSerifCondensed"]:
            try:
                test_font = fitz.Font(fname)
                print(f"✓ {fname}: Available")
            except Exception as e:
                print(f"✗ {fname}: {str(e)[:50]}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    test_font_loading()
