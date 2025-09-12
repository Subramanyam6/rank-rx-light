import json
import sys
import os
from http.server import BaseHTTPRequestHandler
import tempfile
import io

# Add the parent directory to the Python path to import parse module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from parse import parse_pdf_file
except ImportError:
    # Fallback if import fails
    def parse_pdf_file(pdf_path):
        return {"error": "Parse module not found", "file": "unknown"}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            
            # Read the request body
            post_data = self.rfile.read(content_length)
            
            # For now, we'll handle this as a simple file upload
            # In a real implementation, you'd parse multipart/form-data
            
            # Create a temporary file to save the PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(post_data)
                temp_file_path = temp_file.name
            
            try:
                # Parse the PDF
                result = parse_pdf_file(temp_file_path)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                response = json.dumps(result, indent=2)
                self.wfile.write(response.encode())
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            # Error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = json.dumps({
                "error": f"Server error: {str(e)}",
                "file": "unknown"
            })
            self.wfile.write(error_response.encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        # Simple health check
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps({
            "status": "healthy",
            "message": "PDF parsing API is running"
        })
        self.wfile.write(response.encode())
