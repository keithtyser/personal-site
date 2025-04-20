#!/bin/bash

# Maximum allowed line count
MAX_LINES=250

# Flag to track if any file exceeds the limit
FAILED=0

# Files to check (HTML anywhere in public, CSS/JS only in public/assets)
# Using find with -o for OR logic and -prune to exclude blog CSS/JS
find public \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -print0 | while IFS= read -r -d $'\0' file; do
  # Exclude CSS/JS files inside any 'blog' subdirectory directly under public/pages or public/assets (or anywhere else)
  # A simpler approach: check specific allowed directories for CSS/JS
  if [[ "$file" == *.css || "$file" == *.js ]]; then
    if [[ "$file" != public/assets/css/* && "$file" != public/assets/js/* ]]; then
      # Skip CSS/JS files not in the allowed directories 
      # This implicitly excludes blog CSS/JS if they existed
      continue
    fi
  fi

  LINES=$(wc -l < "$file")
  
  echo -n "Checking $file ... "
  if [ $LINES -gt $MAX_LINES ]; then
    echo -e "\033[0;31mFAILED\033[0m ($LINES lines > $MAX_LINES)"
    FAILED=1
  else
    echo -e "\033[0;32mOK\033[0m ($LINES lines)"
  fi
done

if [ $FAILED -eq 1 ]; then
  echo -e "\n\033[0;31mError: One or more files exceed the $MAX_LINES line limit.\033[0m"
  exit 1
else
  echo -e "\n\033[0;32mAll checked files are within the $MAX_LINES line limit.\033[0m"
  exit 0
fi 