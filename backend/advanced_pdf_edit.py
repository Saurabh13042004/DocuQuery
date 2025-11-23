#!/usr/bin/env python3
"""
Advanced PDF editing with proper font preservation and substitution.
"""
import pymupdf as fitz
import os
from datetime import datetime

# Font fallback mapping - maps unavailable fonts to best substitutes
FONT_FALLBACK_MAP = {
    'DejaVuSerifCondensed': 'Helvetica',
    'DejaVuSerifCondensed-Bol': 'Helvetica-Bold',
    'ind_hi_1_001': 'Helvetica',
    'XBZar-Bold': 'Helvetica-Bold',
}

def get_best_font_substitute(font_name):
    """Get the best font substitute for unavailable fonts."""
    if not font_name:
        return 'Helvetica'
    
    # Check direct mapping first
    if font_name in FONT_FALLBACK_MAP:
        return FONT_FALLBACK_MAP[font_name]
    
    # Check if it's a bold variant
    if 'Bold' in font_name or 'bold' in font_name:
        return 'Helvetica-Bold'
    
    # Check if it's an italic variant
    if 'Italic' in font_name or 'Oblique' in font_name:
        return 'Helvetica-Oblique'
    
    # Default fallback
    return 'Helvetica'

def extract_font_family(font_name):
    """Extract font family information."""
    if not font_name:
        return None
    
    # Map embedded fonts to their families
    font_families = {
        'DejaVuSerifCondensed': 'serif',
        'DejaVuSerifCondensed-Bol': 'serif-bold',
        'ind_hi_1_001': 'indic',
        'XBZar-Bold': 'arabic-bold',
    }
    
    return font_families.get(font_name, 'unknown')

def edit_pdf_advanced(file_path, original_text, new_text):
    """
    Edit PDF with advanced font preservation.
    Uses font family detection and intelligent substitution.
    """
    print(f"\n=== PDF Editing Session ===")
    print(f"Finding: '{original_text}'")
    print(f"Replacing with: '{new_text}'")
    print()
    
    doc = fitz.open(file_path)
    changes_made = 0
    font_stats = {'original': [], 'substituted': []}
    
    for page_num, page in enumerate(doc):
        text_dict = page.get_text("dict")
        
        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    
                    if original_text not in span_text:
                        continue
                    
                    # Extract complete font information
                    original_font = span.get("font", "Helv")
                    font_size = span.get("size", 12)
                    font_color = span.get("color", 0)
                    font_flags = span.get("flags", 0)
                    bbox = span.get("bbox", (0, 0, 0, 0))
                    
                    # Analyze font properties
                    font_family = extract_font_family(original_font)
                    best_substitute = get_best_font_substitute(original_font)
                    
                    print(f"Found text: '{span_text}'")
                    print(f"  Original font: {original_font}")
                    print(f"  Font family: {font_family}")
                    print(f"  Font size: {font_size}")
                    print(f"  Font color (int): {font_color}")
                    print(f"  Fallback font: {best_substitute}")
                    print(f"  Position: {bbox}")
                    
                    # Convert color to RGB
                    if isinstance(font_color, int):
                        if font_color == 0:
                            rgb_color = (0, 0, 0)
                        else:
                            r = (font_color >> 16) & 0xff
                            g = (font_color >> 8) & 0xff
                            b = font_color & 0xff
                            rgb_color = (r/255, g/255, b/255)
                    else:
                        rgb_color = font_color if font_color else (0, 0, 0)
                    
                    # Clear the old text area
                    page.draw_rect(fitz.Rect(bbox), color=None, fill=(1, 1, 1))
                    
                    # Calculate baseline position
                    baseline_y = bbox[3] - (font_size * 0.2)
                    baseline_point = fitz.Point(bbox[0], baseline_y)
                    
                    # Try to insert with best available font
                    text_inserted = False
                    font_used = None
                    
                    # Attempt 1: Try the original font
                    try:
                        page.insert_text(
                            baseline_point,
                            new_text,
                            fontname=original_font,
                            fontsize=font_size,
                            color=rgb_color
                        )
                        print(f"  ✓ Used original font: {original_font}")
                        font_used = original_font
                        text_inserted = True
                    except Exception as e:
                        print(f"  ✗ Original font failed: {str(e)[:50]}")
                    
                    # Attempt 2: Try the best substitute
                    if not text_inserted:
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontname=best_substitute,
                                fontsize=font_size,
                                color=rgb_color
                            )
                            print(f"  ✓ Used substitute font: {best_substitute}")
                            font_used = best_substitute
                            text_inserted = True
                        except Exception as e:
                            print(f"  ✗ Substitute font failed: {str(e)[:50]}")
                    
                    # Attempt 3: Try default font
                    if not text_inserted:
                        try:
                            page.insert_text(
                                baseline_point,
                                new_text,
                                fontsize=font_size,
                                color=rgb_color
                            )
                            print(f"  ✓ Used default font")
                            font_used = 'default'
                            text_inserted = True
                        except Exception as e:
                            print(f"  ✗ Default font also failed: {str(e)[:50]}")
                    
                    if text_inserted:
                        changes_made += 1
                        if font_used == original_font:
                            font_stats['original'].append({
                                'text': new_text,
                                'font': original_font,
                                'size': font_size
                            })
                        else:
                            font_stats['substituted'].append({
                                'text': new_text,
                                'original_font': original_font,
                                'substitute_font': font_used,
                                'size': font_size
                            })
                        print()
    
    if changes_made == 0:
        print(f"✗ No changes made - text '{original_text}' not found")
        doc.close()
        return None
    
    # Save the edited PDF
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    file_name = os.path.basename(file_path)
    new_file_name = f"edited_{timestamp}_{file_name}"
    output_path = f"pdfs/{new_file_name}"
    
    doc.save(output_path)
    doc.close()
    
    print(f"✓ PDF saved to: {output_path}")
    print(f"✓ Changes made: {changes_made}")
    print(f"✓ Original fonts preserved: {len(font_stats['original'])}")
    print(f"✓ Font substitutions: {len(font_stats['substituted'])}")
    print()
    
    return output_path

if __name__ == "__main__":
    # Test with the PDF
    result = edit_pdf_advanced(
        'pdfs/mpdf.pdf',
        'NO. 1',
        'TEST_PRESERVE_FONT'
    )
    
    if result:
        print(f"\nTest successful! Edited PDF: {result}")
