import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

def get_code_files(directory, excluded_files=None, excluded_dirs=None):
    """Fetch all JS/JSX project files excluding sensitive configuration files."""
    if excluded_files is None:
        # Added sensitive files to exclusion list
        excluded_files = {
            'package-lock.json',
            'yarn.lock',
            '.DS_Store',
            'Thumbs.db',
            'Desktop.ini',
            # Sensitive configuration files
            '.env',
            '.env.development',
            '.env.production',
            '.env.local',
            '.env.staging',
            '.env.test',
            'keys.js',
            'secrets.js',
            'config.js',
            'db.js',
            'database.js',
            'auth.config.js',
            'firebase.config.js',
            'aws.config.js',
            'api.config.js'
        }
    
    if excluded_dirs is None:
        excluded_dirs = {
            'node_modules',
            '.git', 
            '__pycache__',
            'build',
            'dist',
            '.next',
            'coverage',
            '.nyc_output',
            'logs',
            'uploads',  # Exclude uploads directory with user files
            'config',   # Exclude config directory
            'secrets',  # Exclude secrets directory
            '.env.d'    # Exclude .env directory if it exists
        }
    
    code_files = {}
    
    # Define JS/JSX file extensions we want to include
    js_extensions = {'.js', '.jsx'}
    
    # Define safe configuration files to include (non-sensitive)
    safe_config_files = {
        'package.json',
        'tailwind.config.js',
        'postcss.config.js',
        'webpack.config.js',
        'vite.config.js',
        'next.config.js',
        'babel.config.js',
        'eslint.config.js',
        '.eslintrc.js',
        'prettier.config.js'
    }
    
    for root, dirs, files in os.walk(directory):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        
        # Skip if current directory is an excluded directory
        if any(excluded_dir in root.split(os.sep) for excluded_dir in excluded_dirs):
            continue
            
        for file in files:
            # Skip excluded files
            if file in excluded_files:
                continue
                
            # Additional check for any file containing sensitive patterns
            if any(pattern in file.lower() for pattern in ['.env', 'secret', 'key', 'password', 'token']):
                continue
                
            file_path = os.path.join(root, file)
            
            # Get file extension
            _, ext = os.path.splitext(file)
            
            # Only include JS/JSX files OR safe configuration files
            if ext.lower() in js_extensions or file in safe_config_files:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_files[file_path] = f.readlines()
                        
                except Exception as e:
                    print(f"❌ Error reading {file_path}: {e}")
                    code_files[file_path] = [f"[Error reading file: {str(e)}]"]
    
    return code_files


def create_pdf(code_data, output_pdf="JS_JSX_Code_Export.pdf"):
    c = canvas.Canvas(output_pdf, pagesize=A4)
    width, height = A4
    margin = 20 * mm
    line_height = 10
    y = height - margin

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, "📁 JS/JSX Project Code Export")
    y -= 2 * line_height
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "📁 JavaScript/JSX Files & Safe Config:")
    y -= 2 * line_height

    file_paths = sorted(list(code_data.keys()))

    # 1. File list with file type indicators
    c.setFont("Courier", 8)
    for path in file_paths:
        if y < margin:
            c.showPage()
            c.setFont("Courier", 8)
            y = height - margin
        
        display_path = os.path.relpath(path)
        
        # Add file type indicator
        if display_path.endswith('.js'):
            file_type = "[JS]"
        elif display_path.endswith('.jsx'):
            file_type = "[JSX]"
        elif display_path.endswith('package.json'):
            file_type = "[PKG]"
        elif display_path.endswith('.config.js'):
            file_type = "[CFG]"
        else:
            file_type = "[CONFIG]"
        
        c.drawString(margin, y, f"- {file_type} {display_path}")
        y -= line_height

    # Add page break before code content
    c.showPage()
    y = height - margin

    # 2. File contents
    for file_path in file_paths:
        lines = code_data[file_path]
        print(f"📄 Adding: {file_path}")

        if y < margin + 3 * line_height:
            c.showPage()
            y = height - margin

        # File header
        rel_path = os.path.relpath(file_path)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y, f"📄 File: {rel_path}")
        y -= line_height
        
        # Add separator line
        c.setFont("Courier", 8)
        c.drawString(margin, y, "=" * 80)
        y -= line_height

        # File content with line numbers
        for line_num, line in enumerate(lines, 1):
            if y < margin:
                c.showPage()
                c.setFont("Courier", 8)
                y = height - margin
            
            # Clean and truncate line
            line = line.strip("\n").encode("latin-1", "replace").decode("latin-1")
            
            # Add line numbers for all files
            display_line = f"{line_num:3d}: {line[:280]}"
            
            c.drawString(margin, y, display_line)
            y -= line_height

        # Add spacing between files
        y -= line_height
        if y > margin:
            c.setFont("Courier", 8)
            c.drawString(margin, y, "-" * 80)
            y -= 2 * line_height

    c.save()
    print(f"✅ PDF successfully created: {output_pdf}")
    print(f"📊 Total files processed: {len(code_data)}")
    print(f"📁 File breakdown:")
    
    # Print file type breakdown
    js_count = sum(1 for f in code_data.keys() if f.endswith('.js'))
    jsx_count = sum(1 for f in code_data.keys() if f.endswith('.jsx'))
    config_count = len(code_data) - js_count - jsx_count
    
    print(f"   - JavaScript files: {js_count}")
    print(f"   - JSX files: {jsx_count}")
    print(f"   - Safe configuration files: {config_count}")


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Expanded exclusions to include sensitive files
    excluded_files = {
        'package-lock.json',
        'yarn.lock',
        '.DS_Store',
        'Thumbs.db',
        'Desktop.ini',
        # Sensitive files
        '.env',
        '.env.development',
        '.env.production',
        '.env.local',
        '.env.staging',
        '.env.test',
        'keys.js',
        'secrets.js',
        'config.js',
        'db.js',
        'database.js',
        'auth.config.js',
        'firebase.config.js',
        'aws.config.js',
        'api.config.js'
    }
    
    # Directories to exclude (including sensitive directories)
    excluded_dirs = {
        'node_modules',
        '.git', 
        '__pycache__',
        'build',
        'dist',
        '.next',
        'coverage',
        '.nyc_output',
        'logs',
        'uploads',
        'config',
        'secrets',
        '.env.d'
    }
    
    print("🔍 Scanning for JS/JSX files and safe configuration files...")
    print("🔒 Sensitive files (.env, keys, secrets, etc.) will be excluded")
    
    code_files = get_code_files(root_dir, excluded_files, excluded_dirs)
    
    if not code_files:
        print("❌ No JS/JSX files found to process!")
        return
    
    print(f"📁 Found {len(code_files)} files to include in PDF")
    
    # Show user what files will be included
    print("\n📋 Files to be included:")
    for file_path in sorted(code_files.keys()):
        rel_path = os.path.relpath(file_path)
        print(f"   📄 {rel_path}")
    
    create_pdf(code_files)


if __name__ == "__main__":
    main()