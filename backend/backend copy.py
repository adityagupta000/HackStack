import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

def get_code_files(directory, extensions):
    """Fetch all code files from the given directory, excluding node_modules."""
    code_files = {}
    for root, dirs, files in os.walk(directory):
        # Skip node_modules
        if 'node_modules' in dirs:
            dirs.remove('node_modules')

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_files[file_path] = f.readlines()
                except Exception as e:
                    print(f"❌ Error reading {file_path}: {e}")
    return code_files

def create_pdf(code_data, output_pdf="backend.pdf"):
    c = canvas.Canvas(output_pdf, pagesize=A4)
    width, height = A4
    margin = 20 * mm
    line_height = 10
    y = height - margin

    c.setFont("Courier", 8)

    for file_path, lines in code_data.items():
        print(f"📄 Adding: {file_path}")

        # Page break if needed
        if y < margin + 2 * line_height:
            c.showPage()
            c.setFont("Courier", 8)
            y = height - margin

        # File header
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y, f"File: {file_path}")
        y -= line_height
        c.setFont("Courier", 8)

        for line in lines:
            line = line.strip("\n").encode("latin-1", "replace").decode("latin-1")
            if y < margin:
                c.showPage()
                c.setFont("Courier", 8)
                y = height - margin
            c.drawString(margin, y, line[:300])
            y -= line_height

        y -= line_height  # Space between files

    c.save()
    print(f"✅ PDF successfully created: {output_pdf}")

if __name__ == "__main__":
    directory = os.path.dirname(os.path.abspath(__file__))

    # Only include .js files
    extensions = {".js"}

    code_files = get_code_files(directory, extensions)
    create_pdf(code_files)
