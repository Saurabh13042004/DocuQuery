#!/usr/bin/env python3
"""
Deep PDF font analysis to understand exact font rendering.
"""
import pymupdf as fitz
import json

def analyze_pdf_fonts_detailed(pdf_path):
    """Perform detailed font analysis."""
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    print("=== DETAILED PDF FONT ANALYSIS ===\n")
    
    # Get all text with raw formatting
    text_dict = page.get_text('rawdict')
    
    font_info_collected = {}
    
    for block in text_dict.get('blocks', []):
        if block.get('type') != 0:  # Skip non-text blocks
            continue
            
        for line in block.get('lines', []):
            for span in line.get('spans', []):
                text = span.get('text', '').strip()
                
                # Look for key patterns
                if any(pattern in text for pattern in ['04', '10', '2023', 'NO', 'DATE', 'DOB']):
                    font_key = span.get('font', 'unknown')
                    
                    if font_key not in font_info_collected:
                        font_info_collected[font_key] = {
                            'font': font_key,
                            'sizes': [],
                            'colors': [],
                            'flags': [],
                            'examples': []
                        }
                    
                    font_info_collected[font_key]['sizes'].append(span.get('size'))
                    font_info_collected[font_key]['colors'].append(span.get('color'))
                    font_info_collected[font_key]['flags'].append(span.get('flags'))
                    font_info_collected[font_key]['examples'].append(text[:30])
                    
                    print(f"Found: '{text}'")
                    print(f"  Font: {span.get('font')}")
                    print(f"  Size: {span.get('size')}")
                    print(f"  Color (int): {span.get('color')}")
                    print(f"  Flags (binary): {bin(span.get('flags', 0))}")
                    print(f"  BBox: {span.get('bbox')}")
                    print()
    
    # List all unique fonts in the document
    print("\n=== ALL UNIQUE FONTS IN DOCUMENT ===\n")
    all_fonts = {}
    for block in text_dict.get('blocks', []):
        if block.get('type') == 0:
            for line in block.get('lines', []):
                for span in line.get('spans', []):
                    font = span.get('font', 'unknown')
                    size = span.get('size', 0)
                    if font not in all_fonts:
                        all_fonts[font] = {'sizes': [], 'count': 0}
                    all_fonts[font]['sizes'].append(size)
                    all_fonts[font]['count'] += 1
    
    for font, info in sorted(all_fonts.items()):
        unique_sizes = sorted(set(info['sizes']))
        print(f"Font: {font}")
        print(f"  Occurrences: {info['count']}")
        print(f"  Sizes: {unique_sizes}")
        print()
    
    doc.close()

if __name__ == "__main__":
    analyze_pdf_fonts_detailed('pdfs/mpdf.pdf')
