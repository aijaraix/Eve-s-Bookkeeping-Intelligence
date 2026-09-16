#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
import argparse, hashlib, json
import PIL
from PIL import Image, ImageDraw, ImageFont
EXPECTED='12.3.0'; FONT='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'; BASE_SHA='bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436'
def h(b): return hashlib.sha256(b).hexdigest()
def image_hash(img,box): return h(img.crop(box).tobytes())
def save(img,path):
 b=BytesIO();img.save(b,'PNG',optimize=True);data=b.getvalue();path.write_bytes(data);return data
def render_material():
 rows=[('EVE TEST MARKET',BOLD,42),('123 ACADEMY WAY',FONT,30),('MIAMI FL 33101',FONT,30),('RECEIPT R-2026-0916',FONT,30),('DATE 09/16/2026',FONT,30),('OFFICE SUPPLIES $24.50',FONT,30),('PRINTER PAPER $18.00',FONT,30),('COFFEE $7.25',FONT,30),('SUBTOTAL $59.10',FONT,30),('SALES TAX $4.13',FONT,30),('TOTAL $63.23',BOLD,40),('VISA 4242 $63.23',FONT,30)]
 img=Image.new('L',(900,1000),255);d=ImageDraw.Draw(img);y=60
 for text,fp,size in rows:d.text((60,y),text,font=ImageFont.truetype(fp,size),fill=0);y+=size+18
 return img
p=argparse.ArgumentParser();p.add_argument('output_dir');a=p.parse_args();root=Path(a.output_dir);root.mkdir(parents=True,exist_ok=True)
base_path=root/'receipt.png';data=base_path.read_bytes();assert h(data)==BASE_SHA;base=Image.open(base_path).convert('L')
(root/'dup-image-base.png').write_bytes(data);(root/'dup-image-exact-copy.png').write_bytes(data)
cos=base.copy();ImageDraw.Draw(cos).rectangle((880,980,883,983),fill=245);cos_data=save(cos,root/'dup-image-cosmetic.png')
mat=render_material();mat_data=save(mat,root/'dup-image-material-conflict.png')
identity={'documentType':'RECEIPT','issuer':'EVE TEST MARKET','documentNumber':'R-2026-0916','documentDate':'09/16/2026','currency':'USD'}
base_m={'subtotal':49.75,'salesTax':3.48,'total':53.23,'paymentAmount':53.23};changed={'subtotal':59.10,'salesTax':4.13,'total':63.23,'paymentAmount':63.23}
region=lambda lit:{'imageWidth':900,'imageHeight':1000,'boundingBox':{'x':60/900,'y':559/1000,'width':289/900,'height':37/1000,'unit':'NORMALIZED'},'rawLiteral':lit}
files={
 'image-base':{'filename':'dup-image-base.png','sha256':h(data),'identity':identity,'material':base_m,'identityVisualHash':image_hash(base,(0,0,860,420)),'materialVisualHash':image_hash(base,(40,430,860,720)),'region':region('TOTAL $53.23')},
 'image-exact':{'filename':'dup-image-exact-copy.png','sha256':h(data),'identity':identity,'material':base_m,'identityVisualHash':image_hash(base,(0,0,860,420)),'materialVisualHash':image_hash(base,(40,430,860,720)),'region':region('TOTAL $53.23')},
 'image-cosmetic':{'filename':'dup-image-cosmetic.png','sha256':h(cos_data),'identity':identity,'material':base_m,'identityVisualHash':image_hash(cos,(0,0,860,420)),'materialVisualHash':image_hash(cos,(40,430,860,720)),'region':region('TOTAL $53.23')},
 'image-material':{'filename':'dup-image-material-conflict.png','sha256':h(mat_data),'identity':identity,'material':changed,'identityVisualHash':image_hash(mat,(0,0,860,420)),'materialVisualHash':image_hash(mat,(40,430,860,720)),'region':region('TOTAL $63.23')},
}
assert files['image-base']['sha256']==files['image-exact']['sha256'];assert files['image-base']['sha256']!=files['image-cosmetic']['sha256'];assert files['image-base']['identityVisualHash']==files['image-cosmetic']['identityVisualHash']==files['image-material']['identityVisualHash'];assert files['image-base']['materialVisualHash']==files['image-cosmetic']['materialVisualHash'];assert files['image-base']['materialVisualHash']!=files['image-material']['materialVisualHash']
(root/'duplicate-image-manifest.json').write_text(json.dumps({'pillow':PIL.__version__,'files':files},indent=2));print('DUPLICATE_EVIDENCE_IMAGE_FIXTURES=PASS')
