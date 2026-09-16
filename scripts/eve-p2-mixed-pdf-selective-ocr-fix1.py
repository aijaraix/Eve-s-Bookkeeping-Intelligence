#!/usr/bin/env python3
from pathlib import Path
p=Path('services/local_ocr/app.py')
text=p.read_text()
p.write_text(text.rstrip()+'\n')
print('MIXED_PDF_APP_EOF_FORMAT_FIX=PASS')
