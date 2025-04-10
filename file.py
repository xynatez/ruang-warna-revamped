import os

# Struktur direktori dan file untuk ruang-warna-revamped
structure = {
    "ruang-warna-revamped": [
        "index.html",
        "screening-selection.html",
        "screening.html",
        "results.html",
        "chat.html",
        "education.html",
        "professional-help.html",
        {"css": ["style.css"]},
        {"js": [
            "main.js",
            "screening-data.js",
            "screening.js",
            "results.js",
            "chat.js"
        ]},
        {"assets": [
            {"images": [
                "illustration-hero.svg",
                "illustration-chat-bg.svg",
                "icon-mood.svg",
                "icon-burnout.svg",
                "icon-postpartum.svg",
                "avatar-ai.svg"
            ]},
            {"logo": ["logo-ruangwarna.svg"]}
        ]},
        "tailwind.config.js",
        "package.json",
        {"src": ["input.css"]}
    ]
}

def create_structure(base_path, items):
    for item in items:
        if isinstance(item, str):
            file_path = os.path.join(base_path, item)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                pass
        elif isinstance(item, dict):
            for folder_name, contents in item.items():
                folder_path = os.path.join(base_path, folder_name)
                os.makedirs(folder_path, exist_ok=True)
                create_structure(folder_path, contents)

# Eksekusi
create_structure('.', structure["ruang-warna-revamped"])
