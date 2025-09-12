import json
import sys
import os
import tempfile

# Add the root directory to the Python path to import parse module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))))))

try:
    from parse import parse_pdf_file
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback if import fails
    def parse_pdf_file(pdf_path):
        return {"error": "Parse module not found", "file": "unknown"}

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
            # Get the request body (PDF file)
            body = request.get('body', b'')

            if not body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    'body': json.dumps({
                        'error': 'No PDF file provided',
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

    # Method not allowed
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'error': 'Method not allowed',
            'allowed_methods': ['GET', 'POST']
        })
    }