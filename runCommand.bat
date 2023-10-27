@echo off
cd "C:\Users\impel\OneDrive\שולחן העבודה\auto-kdp"
npx ts-node src/index.ts --books "Z:\KDP Projects\uploadAutomation\books.csv" --config books.conf --content-dir Z:\ --user-data ./user_data --verbose --keep-open --headless=no
pause
