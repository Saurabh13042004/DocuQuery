#!/usr/bin/env python3
"""
Download and setup DejaVu fonts from SourceForge.
"""
import os
import sys
import requests
import zipfile
from pathlib import Path

def download_dejavu_fonts():
    """Download DejaVu fonts zip from SourceForge."""
    print("\n" + "="*70)
    print("DOWNLOADING DEJAVU FONTS")
    print("="*70 + "\n")
    
    fonts_dir = Path("fonts")
    fonts_dir.mkdir(exist_ok=True)
    
    # SourceForge direct download URL
    zip_url = "https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip/download"
    zip_path = fonts_dir / "dejavu-fonts.zip"
    
    print(f"⏳ Downloading DejaVu fonts...", flush=True)
    try:
        response = requests.get(zip_url, timeout=30, allow_redirects=True)
        if response.status_code == 200:
            with open(zip_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ Downloaded DejaVu fonts ({len(response.content) / (1024*1024):.1f} MB)")
            
            # Extract specific fonts
            print(f"\n⏳ Extracting fonts...", flush=True)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # List all files
                file_list = zip_ref.namelist()
                
                # Extract DejaVuSerifCondensed fonts
                fonts_to_extract = [
                    'DejaVuSerifCondensed.ttf',
                    'DejaVuSerifCondensed-Bold.ttf',
                    'DejaVuSerifCondensed-BoldItalic.ttf',
                    'DejaVuSerifCondensed-Italic.ttf',
                ]
                
                for font_name in fonts_to_extract:
                    # Find the file in the zip (it's in a subfolder)
                    matching_files = [f for f in file_list if f.endswith(font_name)]
                    if matching_files:
                        zip_ref.extract(matching_files[0], fonts_dir)
                        # Move from subfolder to fonts_dir
                        extracted_path = fonts_dir / matching_files[0]
                        final_path = fonts_dir / font_name
                        if extracted_path != final_path and extracted_path.exists():
                            extracted_path.rename(final_path)
                            print(f"✓ Extracted {font_name}")
            
            # Clean up zip
            zip_path.unlink()
            print("\n✓ Font extraction complete")
            return fonts_dir
            
        else:
            print(f"✗ Failed to download (HTTP {response.status_code})")
            return None
    except Exception as e:
        print(f"✗ Download failed: {str(e)}")
        return None

def list_fonts_in_dir():
    """List fonts in fonts directory."""
    fonts_dir = Path("fonts")
    if fonts_dir.exists():
        fonts = list(fonts_dir.glob("*.ttf"))
        print(f"\n✓ Available fonts in {fonts_dir}:")
        for font in sorted(fonts):
            size_kb = font.stat().st_size / 1024
            print(f"  - {font.name} ({size_kb:.1f} KB)")
        return fonts
    return []

if __name__ == "__main__":
    print("\n" + "🔍 Setting up DejaVu Fonts".center(70))
    
    download_dejavu_fonts()
    list_fonts_in_dir()
    
    print("\n" + "✓ Font setup complete!".center(70) + "\n")
