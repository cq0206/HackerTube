from pathlib import Path
import zipfile
import json
import argparse
parser=argparse.ArgumentParser(description='Build developer-install or Chrome Web Store ZIP')
parser.add_argument('--store',action='store_true',help='Put manifest.json at archive root for Chrome Web Store')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
ext=root/'extension'
rows=[json.loads(line) for line in (ext/'data/videos.jsonl').read_text().splitlines()]
assert len(rows)==6454, 'Incomplete dataset'
version=json.loads((ext/'manifest.json').read_text())['version']
kind='webstore' if args.store else 'chrome'
out=root/f'artifacts/hackertube-{kind}-{version}.zip'
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(ext.rglob('*')):
        if p.is_file() and not p.name.startswith('.'):
            name=str(p.relative_to(ext))
            z.write(p,name if args.store else 'hackertube/'+name)
    if not args.store:
        z.write(root/'INSTALL.md','INSTALL.md')
if args.store:
    with zipfile.ZipFile(out) as z:
        assert 'manifest.json' in z.namelist()
        assert len(z.read('data/videos.jsonl').splitlines())==6454
        assert json.loads(z.read('manifest.json'))['version']==version
print(f'{out} ({out.stat().st_size:,} bytes)')
