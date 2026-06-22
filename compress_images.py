"""
Compress product images that were skipped due to encoding issues.
Uses stdout in binary mode to avoid Windows charmap issues.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PIL import Image
from pathlib import Path

IMAGE_DIR = Path(__file__).parent / 'Product_Images'
MAX_WIDTH = 600
QUALITY = 72

total_before = 0
total_after = 0
count = 0

for img_path in IMAGE_DIR.rglob('*'):
    if img_path.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
        continue

    size_before = img_path.stat().st_size
    total_before += size_before

    try:
        img = Image.open(img_path).convert('RGB')

        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_h = int(img.height * ratio)
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)

        img.save(img_path, 'JPEG', quality=QUALITY, optimize=True)

        size_after = img_path.stat().st_size
        total_after += size_after
        count += 1

    except Exception as e:
        total_after += size_before  # count unchanged

print(f"Done: {count} images compressed")
print(f"Total before: {total_before//1024:,} KB")
print(f"Total after:  {total_after//1024:,} KB")
print(f"Overall saving: {(1 - total_after/total_before)*100:.1f}%")
