from PIL import Image
import os

src = r"C:\Users\Edwin\.gemini\antigravity\brain\25fe57fd-e4de-489f-b9a3-89c12284d179\cloudfly_pos_icon_1779399045201.png"
# assets/ está un nivel arriba de scratch/
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "icon.ico")

img = Image.open(src).convert("RGBA").resize((256, 256), Image.LANCZOS)
img.save(dst, format="ICO", sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])
print(f"OK: {dst}")
