#!/usr/bin/env python3
"""
Simple HTTP server to run the FPS game locally.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the script directory
    os.chdir(script_dir)
    
    # Check if game.html exists
    if not os.path.exists('game.html'):
        print("Error: game.html not found in the current directory!")
        print(f"Current directory: {script_dir}")
        sys.exit(1)
    
    # Check if styles.css exists
    if not os.path.exists('styles.css'):
        print("Warning: styles.css not found. The game may not display correctly.")
    
    # Set up the server
    PORT = 8000
    
    # Try to find an available port
    for port in range(8000, 8010):
        try:
            with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as httpd:
                # Get the local IP address
                import socket
                hostname = socket.gethostname()
                local_ip = socket.gethostbyname(hostname)
                
                print(f"Server started at http://localhost:{port}")
                print(f"Network access: http://{local_ip}:{port}")
                print("Opening game in your browser...")
                print("Press Ctrl+C to stop the server")
                print("\nTo share with others on your WiFi:")
                print(f"Give them this URL: http://{local_ip}:{port}/game.html")
                
                # Open the game in the default browser
                webbrowser.open(f'http://localhost:{port}/game.html')
                
                # Start serving
                httpd.serve_forever()
                break
        except OSError:
            if port == 8009:
                print("Error: Could not find an available port between 8000-8009")
                sys.exit(1)
            continue
        except KeyboardInterrupt:
            print("\nServer stopped by user")
            break

if __name__ == "__main__":
    main()
