import os
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content.replace(".toLocaleString('en-IN')", ".toLocaleString('en-IN', { maximumFractionDigits: 0 })")
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('frontend/js'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))

