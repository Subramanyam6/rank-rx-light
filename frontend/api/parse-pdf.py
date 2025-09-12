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

def handler(request):
    """Vercel Python serverless function for PDF parsing"""

    if request.method == 'GET':
        # Health check
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'status': 'healthy',
                'message': 'PDF parsing API is running'
            })
        }

    if request.method == 'POST':
        try:
            # Get the request body (PDF file) - Handle multiple Vercel formats
            body = None

            # Try different ways to access the request body
            if hasattr(request, 'body') and request.body:
                body = request.body
            elif hasattr(request, 'get') and callable(request.get):
                # Try to get body from query parameters
                body_param = request.get('body')
                if body_param:
                    body = body_param
                    # Handle base64 encoded body
                    if isinstance(body, str):
                        try:
                            import base64
                            body = base64.b64decode(body)
                        except:
                            pass  # If it's not base64, use as is
                else:
                    # Try other common parameter names
                    for param in ['file', 'pdf', 'data']:
                        if request.get(param):
                            body = request.get(param)
                            break

            # Additional fallbacks for Vercel environment
            if not body:
                if hasattr(request, 'data'):
                    body = request.data
                elif hasattr(request, 'raw_body'):
                    body = request.raw_body
                elif hasattr(request, 'stream'):
                    body = request.stream.read()

            # Final check for empty body
            if not body or (isinstance(body, (bytes, str)) and len(body) == 0):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    'body': json.dumps({
                        'error': 'No PDF file provided - body is empty',
                        'debug': f'Request method: {request.method}, Has body attr: {hasattr(request, "body")}, Has get method: {hasattr(request, "get")}',
                        'file': 'unknown'
                    })
                }

            # Create a temporary file to save the PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(body)
                temp_file_path = temp_file.name

            try:
                # Parse the PDF
                result = parse_pdf_file(temp_file_path)

                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                    'body': json.dumps(result)
                }

            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

        except Exception as e:
            print(f"Error: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'error': f'Server error: {str(e)}',
                    'file': 'unknown'
                })
            }

    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    # Method not allowed
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'error': 'Method not allowed',
            'allowed_methods': ['GET', 'POST', 'OPTIONS']
        })
    }