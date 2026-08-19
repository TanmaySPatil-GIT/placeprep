import subprocess

cmd = ['npx', 'esbuild', 'src/pages/InterviewRoundPage.jsx', '--jsx=transform']
result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
print("STDOUT:", result.stdout[:500])
print("STDERR:", result.stderr)
