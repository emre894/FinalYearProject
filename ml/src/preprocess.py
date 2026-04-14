import re

stop_words = {
    "ref", "id", "pmt", "pmts", "txn", "pos", "dd", "int", "ltd", "inc", "co", "corp", "llc", "plc"
}

def clean_text(text: str) -> str:

    if not isinstance(text, str):
        return ""

    text = text.lower().strip()

    # Replace non letters or numbers with spaces
    text = re.sub(r"[^a-z0-9]", " ", text)

    # Make multiple spaces into a single space
    text = re.sub(r"\s+", " ", text)

    words = text.split()

    words = [w for w in words if w not in stop_words]

    return " ".join(words)