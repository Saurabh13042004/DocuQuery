#!/usr/bin/env python3
"""
Test fontbuffer parameter in insert_text.
"""
import pymupdf as fitz
from pathlib import Path

def test_fontbuffer_param():
    """Test if fontbuffer parameter works with insert_text."""
    print("\n" + "="*80)
    print("TESTING FONTBUFFER PARAMETER")
    print("="*80 + "\n")
    
    fonts_dir = Path("fonts")
    font_file = fonts_dir / "DejaVuSerifCondensed.ttf"
    
    if not font_file.exists():
        print(f"✗ Font file not found: {font_file}\n")
        return
    
    # Load font buffer
    with open(font_file, 'rb') as f:
        font_buffer = f.read()
    
    print(f"Font buffer size: {len(font_buffer) / 1024:.1f} KB\n")
    
    # Test 1: Create document and try insert_text with fontbuffer
    print("Test 1: insert_text with fontbuffer parameter")
    print("-" * 80)
    try:
        doc = fitz.open()
        page = doc.new_page()
        
        point = fitz.Point(50, 100)
        
        # Try with fontbuffer
        result = page.insert_text(
            point,
            "Test with fontbuffer parameter",
            fontname="DejaVuSerifCondensed",
            fontsize=12,
            color=(0, 0, 0),
            fontbuffer=font_buffer
        )
        
        print(f"✓ insert_text returned: {result}")
        
        # Check what font was actually used
        text_dict = page.get_text("dict")
        for block in text_dict.get("blocks", []):
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        actual_font = span.get('font')
                        print(f"✓ Actual font used: {actual_font}")
                        
                        if "DejaVu" in actual_font:
                            print(f"  ✓✓ SUCCESS! DejaVu font was used!")
                        else:
                            print(f"  ✗ Expected DejaVu, got {actual_font}")
    except TypeError as e:
        print(f"✗ TypeError (fontbuffer not recognized): {e}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Check insert_text signature
    print("\n\nTest 2: Check insert_text method signature")
    print("-" * 80)
    try:
        import inspect
        sig = inspect.signature(fitz.Page.insert_text)
        print(f"insert_text parameters:")
        for param_name, param in sig.parameters.items():
            print(f"  - {param_name}: {param.annotation if param.annotation != inspect.Parameter.empty else 'any'}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    test_fontbuffer_param()
