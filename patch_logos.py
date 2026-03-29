import glob

html_files = glob.glob(r'f:\Codes\Donezo\*.html')
count = 0

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    
    # 1. Favicon
    if '<link rel="icon"' not in content:
        content = content.replace('</head>', '  <link rel="icon" href="assets/favicon.png" type="image/png">\n</head>')
        changed = True

    # 2. Navbar Logo
    nav_old = '<a href="index.html" class="nav-logo">Donezo</a>'
    nav_new = '''<a href="index.html" class="nav-logo">\n        <img src="assets/logo.png" alt="Donezo Logo">\n        <span class="nav-logo-text">Donezo</span>\n      </a>'''
    if nav_old in content:
        content = content.replace(nav_old, nav_new)
        changed = True
        
    # 3. Footer Logo
    foot_old = '<div class="footer-logo">Donezo</div>'
    foot_new = '''<div class="footer-logo">\n          <img src="assets/logo.png" alt="Donezo Logo">\n          <span class="footer-logo-text">Donezo</span>\n        </div>'''
    if foot_old in content:
        content = content.replace(foot_old, foot_new)
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        count += 1

print(f"Patched {count} HTML files.")
