import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Proportional sizing calculations
    scale = size / 128.0
    
    # Create RGBA image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded card background parameters
    bg_margin = int(8 * scale)
    bg_size = size - 2 * bg_margin
    radius = int(24 * scale)
    
    # 1. Draw rounded background with gradient (Vibrant Blue to Indigo-Violet)
    c_start = (0, 122, 255) # Apple Blue
    c_end = (175, 82, 222)   # Apple Violet
    
    # Create mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [bg_margin, bg_margin, size - bg_margin - 1, size - bg_margin - 1], 
        radius=radius, 
        fill=255
    )
    
    # Draw gradient background onto a temporary image
    gradient = Image.new('RGBA', (size, size))
    grad_draw = ImageDraw.Draw(gradient)
    for y in range(size):
        ratio = y / size
        r = int(c_start[0] + (c_end[0] - c_start[0]) * ratio)
        g = int(c_start[1] + (c_end[1] - c_start[1]) * ratio)
        b = int(c_start[2] + (c_end[2] - c_start[2]) * ratio)
        grad_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
    # Paste the gradient onto the main image using the rounded mask
    img.paste(gradient, (0, 0), mask=mask)
    
    # 2. Draw translation speech bubbles inside
    # Bubble 1 (Left - representing source language 'G' for Glossa)
    b1_left = int(26 * scale)
    b1_top = int(48 * scale)
    b1_right = int(74 * scale)
    b1_bottom = int(88 * scale)
    b1_rad = int(8 * scale)
    
    # Bubble 2 (Right - representing target language 'A' for Translation)
    b2_left = int(54 * scale)
    b2_top = int(30 * scale)
    b2_right = int(102 * scale)
    b2_bottom = int(70 * scale)
    b2_rad = int(8 * scale)
    
    # Draw bubble 1 (Left) outline and translucent fill
    draw.rounded_rectangle(
        [b1_left, b1_top, b1_right, b1_bottom],
        radius=b1_rad,
        fill=(255, 255, 255, 35),
        outline=(255, 255, 255, 200),
        width=max(1, int(1.5 * scale))
    )
    
    # Draw bubble 2 (Right) outline and translucent fill
    draw.rounded_rectangle(
        [b2_left, b2_top, b2_right, b2_bottom],
        radius=b2_rad,
        fill=(255, 255, 255, 55),
        outline=(255, 255, 255, 255),
        width=max(1, int(1.5 * scale))
    )
    
    # 3. Add text "G" and "A" inside the bubbles
    try:
        # Load standard system font on macOS
        font_path = "/System/Library/Fonts/Helvetica.ttc"
        
        # Calculate proportional font sizes
        f1_size = int(24 * scale)
        f2_size = int(22 * scale)
        
        font1 = ImageFont.truetype(font_path, f1_size)
        font2 = ImageFont.truetype(font_path, f2_size)
        
        # Draw "G" in bubble 1 (centered)
        box1 = draw.textbbox((0, 0), "G", font=font1)
        w1 = box1[2] - box1[0]
        h1 = box1[3] - box1[1]
        x1 = b1_left + (b1_right - b1_left - w1) // 2
        y1 = b1_top + (b1_bottom - b1_top - h1) // 2 - int(2 * scale)
        draw.text((x1, y1), "G", font=font1, fill=(255, 255, 255, 220))
        
        # Draw "A" in bubble 2 (centered)
        box2 = draw.textbbox((0, 0), "A", font=font2)
        w2 = box2[2] - box2[0]
        h2 = box2[3] - box2[1]
        x2 = b2_left + (b2_right - b2_left - w2) // 2
        y2 = b2_top + (b2_bottom - b2_top - h2) // 2 - int(2 * scale)
        draw.text((x2, y2), "A", font=font2, fill=(255, 255, 255, 255))
        
    except Exception as e:
        print(f"Error loading system font, using simple lines instead: {e}")
        # Simple geometric fallback if font loading fails
        # Draw G shape
        draw.arc([b1_left + int(8*scale), b1_top + int(8*scale), b1_right - int(8*scale), b1_bottom - int(8*scale)], 45, 315, fill=(255,255,255,220), width=max(1, int(2*scale)))
        draw.line([b1_left + int(16*scale), (b1_top+b1_bottom)//2, b1_right - int(8*scale), (b1_top+b1_bottom)//2], fill=(255,255,255,220), width=max(1, int(2*scale)))
        
        # Draw A shape
        draw.line([b2_left + int(8*scale), b2_bottom - int(8*scale), (b2_left+b2_right)//2, b2_top + int(8*scale)], fill=(255,255,255,255), width=max(1, int(2*scale)))
        draw.line([b2_right - int(8*scale), b2_bottom - int(8*scale), (b2_left+b2_right)//2, b2_top + int(8*scale)], fill=(255,255,255,255), width=max(1, int(2*scale)))
        draw.line([b2_left + int(12*scale), b2_bottom - int(16*scale), b2_right - int(12*scale), b2_bottom - int(16*scale)], fill=(255,255,255,255), width=max(1, int(2*scale)))
        
    return img

def main():
    icons_dir = "/Users/akirapf3/Documents/GlossaPop/icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    # Draw at 512x512 resolution for maximum clarity and detail
    high_res_img = create_icon(512)
    
    # Get resample filter compatibly
    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        resample_filter = Image.LANCZOS
    
    # Required sizes for MV3 extensions
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        # Resize using Lanczos filter for high quality downsampling
        img_resized = high_res_img.resize((size, size), resample_filter)
        path = os.path.join(icons_dir, f"icon-{size}.png")
        img_resized.save(path, "PNG")
        print(f"Generated: {path}")

if __name__ == "__main__":
    main()
