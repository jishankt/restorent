import re

# Simulate app1.py logic
alias = "companyone"
pattern = f"(^|['\"\\s,\\[]){re.escape(str(alias))}(['\"\\s,\\]]|$)"
print("Regex pattern:", pattern)
match = re.search(pattern, "All, companyone", re.IGNORECASE)
print("Match result:", bool(match))
