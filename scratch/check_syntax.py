import os
import subprocess

def check_js_syntax():
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'services', 'faceDetector.js'))
    print(f"Checking JS syntax for: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for line 71 syntax error
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        if 'console.log' in line and 'videoElement?.readyState' in line:
            print(f"Line {idx+1}: {line}")

if __name__ == '__main__':
    check_js_syntax()
