import os
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Project Code Export", ln=True, align="C")
        self.ln(5)

def get_code_files(directory, extensions):
    """Fetch all code files from the given directory."""
    code_files = {}
    for root, _, files in os.walk(directory):
        for file in files:
            if file in extensions or any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    code_files[file_path] = f.read()
    return code_files

def create_pdf(code_data, output_pdf="Project_Code.pdf"):
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Courier", size=10)

    for file_path, content in code_data.items():
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, f"File: {file_path}", ln=True, align="L")
        pdf.set_font("Courier", size=8)

        # Handle encoding issues
        content = content.encode("latin-1", "replace").decode("latin-1")
        pdf.multi_cell(0, 5, content)
        pdf.ln(5)

    pdf.output(output_pdf, "F")
    print(f"✅ PDF successfully created: {output_pdf}")

if __name__ == "__main__":
    base_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")  # Target 'src/' folder

    # Extensions based on your project structure
    extensions = {
        ".js", ".jsx", ".css", ".html", ".json", ".md", ".txt",
        ".yml", ".ini", ".config", ".sh", ".dockerignore", "Dockerfile", "license"
    }

    code_files = get_code_files(base_directory, extensions)
    create_pdf(code_files)