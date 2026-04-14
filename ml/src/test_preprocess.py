from preprocess import clean_text

samples = [
    "TESCO STORE #4832",
    "UBER *TRIP HELP.UBER.COM",
    "DD NETFLIX.COM",
    "PAYPAL *AMAZON",
    "  AMZN MKTPLACE PMTS  ",
    "POS 4832 COSTA"
]

print("=== Preprocessing Test ===\n")

for s in samples:
    cleaned = clean_text(s)
    print(f"Original: {s}")
    print(f"Cleaned : {cleaned}")
    print("-" * 40)