from pathlib import Path

base = Path("data/zvec")
for p in sorted(base.iterdir()):
    if p.is_dir():
        print("Collection folder:", p)
