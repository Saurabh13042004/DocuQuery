#!/usr/bin/env python3
"""
Download and install DejaVu fonts for PDF editing.
This ensures edited text uses the exact original fonts.
"""
import os
import sys
import requests
from pathlib import Path

# Font URLs - Using multiple sources
DEJAVU_FONTS = {
    'DejaVuSerifCondensed.ttf': 'https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip',
    'DejaVuSerifCondensed-Bold.ttf': 'https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip',
    'DejaVuSerifCondensed-BoldItalic.ttf': 'https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip',
    'DejaVuSerifCondensed-Italic.ttf': 'https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip',
    'DejaVuSerif.ttf': 'https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip',
}

def download_fonts():
    """Download DejaVu fonts."""
    print("\n" + "="*70)
    print("DOWNLOADING DEJAVU FONTS")
    print("="*70 + "\n")
    
    # Create fonts directory
    fonts_dir = Path("fonts")
    fonts_dir.mkdir(exist_ok=True)
    
    for font_name, url in DEJAVU_FONTS.items():
        font_path = fonts_dir / font_name
        
        if font_path.exists():
            print(f"✓ {font_name} already exists")
            continue
        
        print(f"⏳ Downloading {font_name}...", end=" ", flush=True)
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                with open(font_path, 'wb') as f:
                    f.write(response.content)
                print(f"✓ Downloaded ({len(response.content) / 1024:.1f} KB)")
            else:
                print(f"✗ Failed (HTTP {response.status_code})")
        except Exception as e:
            print(f"✗ Error: {str(e)[:50]}")
    
    print("\n" + "="*70)
    print("Font Download Complete")
    print("="*70 + "\n")
    
    return fonts_dir

def register_fonts_with_pymupdf():
    """Register fonts with PyMuPDF."""
    import pymupdf as fitz
    
    print("\n" + "="*70)
    print("REGISTERING FONTS WITH PYMUPDF")
    print("="*70 + "\n")
    
    fonts_dir = Path("fonts")
    
    if not fonts_dir.exists():
        print("✗ Fonts directory not found. Download fonts first!")
        return False
    
    font_map = {
        'DejaVuSerifCondensed': 'DejaVuSerifCondensed.ttf',
        'DejaVuSerifCondensed-Bold': 'DejaVuSerifCondensed-Bold.ttf',
        'DejaVuSerifCondensed-BoldItalic': 'DejaVuSerifCondensed-BoldItalic.ttf',
        'DejaVuSerifCondensed-Italic': 'DejaVuSerifCondensed-Italic.ttf',
    }
    
    for font_name, file_name in font_map.items():
        font_path = fonts_dir / file_name
        
        if not font_path.exists():
            print(f"✗ {file_name} not found")
            continue
        
        try:
            # Register the font with PyMuPDF
            fitz.Font(font_name, font_path)
            print(f"✓ Registered {font_name} from {font_path}")
        except Exception as e:
            print(f"✗ Failed to register {font_name}: {str(e)[:50]}")
    
    print("\n" + "="*70)
    print("Font Registration Complete")
    print("="*70 + "\n")
    
    return True

def test_fonts():
    """Test if fonts are available."""
    import pymupdf as fitz
    
    print("\n" + "="*70)
    print("TESTING FONT AVAILABILITY")
    print("="*70 + "\n")
    
    fonts_to_test = [
        'DejaVuSerifCondensed',
        'DejaVuSerifCondensed-Bold',
        'Helvetica',
        'Times-Roman',
    ]
    
    for font_name in fonts_to_test:
        try:
            font = fitz.Font(font_name)
            print(f"✓ {font_name}: Available")
        except Exception as e:
            print(f"✗ {font_name}: Not available ({str(e)[:40]})")
    
    print("\n" + "="*70)
    print("Font Test Complete")
    print("="*70 + "\n")

if __name__ == "__main__":
    print("\n" + "🔍 DejaVu Font Installation Script".center(70))
    
    # Step 1: Download fonts
    fonts_dir = download_fonts()
    
    # Step 2: Register with PyMuPDF
    register_fonts_with_pymupdf()
    
    # Step 3: Test fonts
    test_fonts()
    
    print("\n" + "✓ Setup Complete! You can now edit PDFs with original fonts.".center(70) + "\n")
