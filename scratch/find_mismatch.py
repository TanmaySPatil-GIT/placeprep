import os

def find_jsx_mismatch():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'pages', 'InterviewRoundPage.jsx'))
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    import re
    tag_regex = re.compile(r'</?([a-zA-Z0-9\.]+)[^>]*>')

    for line_num, line in enumerate(lines, 1):
        # Ignore comments
        clean_line = re.sub(r'\{\/\*.*?\*\/\}', '', line)
        for match in tag_regex.finditer(clean_line):
            full_tag = match.group(0)
            tag_name = match.group(1)
            
            if full_tag.endswith('/>') or full_tag.startswith('<?'):
                continue
            
            if full_tag.startswith('</'):
                if not stack:
                    print(f"Line {line_num}: Unexpected closing tag </{tag_name}>")
                else:
                    top = stack.pop()
                    if top['name'] != tag_name:
                        print(f"Line {line_num}: Mismatch! Expected </{top['name']}> (opened line {top['line']}), but got </{tag_name}>")
            else:
                stack.append({'name': tag_name, 'line': line_num})

    if stack:
        print(f"\nUnclosed tags remaining ({len(stack)}):")
        for item in stack[-10:]:
            print(f"  Line {item['line']}: <{item['name']}>")

if __name__ == '__main__':
    find_jsx_mismatch()
