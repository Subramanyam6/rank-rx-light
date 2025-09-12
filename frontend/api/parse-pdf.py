from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import tempfile

# Add the current directory and parent directory to the Python path to import parse module
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

print(f"Python path: {sys.path}")
print(f"Current directory: {current_dir}")
print(f"Parent directory: {parent_dir}")

try:
    from parse import parse_pdf_file
    print("Successfully imported parse_pdf_file")
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Available files in parent dir: {os.listdir(parent_dir)}")
    # Fallback if import fails
    def parse_pdf_file(pdf_path):
        return {
            "error": f"Parse module not found: {str(e)}",
            "debug": f"Current dir: {current_dir}, Parent dir: {parent_dir}",
            "file": os.path.basename(pdf_path) if pdf_path else "unknown"
        }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Health check
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps({
            'status': 'healthy',
            'message': 'PDF parsing API is running'
        })
        self.wfile.write(response.encode())
        
    def do_POST(self):
        try:
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            print(f"Content-Length: {content_length}")
            
            if content_length == 0:
                self._send_error(400, 'No PDF file provided - empty request')
                return
                
            # Read the body
            body = self.rfile.read(content_length)
            print(f"Read {len(body)} bytes from request body")
            
            # Validate it's a PDF
            if not body.startswith(b'%PDF'):
                self._send_error(400, f'Invalid PDF file - does not start with PDF header. Starts with: {body[:20].hex() if len(body) >= 20 else body.hex()}')
                return
            
            print(f"Processing PDF with {len(body)} bytes")
            
            # Create a temporary file to save the PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(body)
                temp_file_path = temp_file.name
                
            try:
                # Parse the PDF
                result = parse_pdf_file(temp_file_path)
                print(f"Parse result: {result}")
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                response = json.dumps(result)
                self.wfile.write(response.encode())
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    print(f"Cleaned up temporary file: {temp_file_path}")
                    
        except Exception as e:
            print(f"Error in do_POST: {e}")
            self._send_error(500, f'Server error: {str(e)}')
    
    def do_OPTIONS(self):
        # Handle CORS preflight request
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        
    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps({
            'error': message,
            'file': 'unknown'
        })
        self.wfile.write(response.encode())

# The Handler class above is the main entry point for Vercel