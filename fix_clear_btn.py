import re

with open('frontend/css/style.css', 'r') as f:
    css = f.read()

mobile_clear_fix = """
    /* Fix X button floating in navbar when search has text but is closed on mobile */
    #searchClearBtn {
        display: none !important;
    }
"""

css = css.replace(".search-box .search-btn {", f"{mobile_clear_fix}\n    .search-box .search-btn {{", 1)

with open('frontend/css/style.css', 'w') as f:
    f.write(css)

print("Fixed clear button")
