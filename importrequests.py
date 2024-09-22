import requests
import webbrowser
import json
import os

# Function to create an HTML file and display the links
def create_html_file(links):
    # Create an HTML file name
    html_file_name = 'links.html'
    
    # Create the HTML content
    html_content = '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fetched Links</title>
    </head>
    <body>
        <h1>Fetched Links</h1>
        <ul>
    '''

    for link in links:
        html_content += f'<li><a href="{link}" target="_blank">{link}</a></li>'

    html_content += '''
        </ul>
    </body>
    </html>
    '''

    # Write the HTML content to a file
    with open(html_file_name, 'w') as html_file:
        html_file.write(html_content)

    # Open the HTML file in the web browser
    webbrowser.open_new_tab(f'file://{os.path.abspath(html_file_name)}')

# Function to get links from the server
def fetch_links_from_server(prompt):
    url = 'http://localhost:3001/gemini'  # Ensure your Node.js server is running on this URL and port
    headers = {'Content-Type': 'application/json'}
    data = {'prompt': prompt}

    try:
        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200:
            # Load the response JSON
            json_response = response.json()

            # Extract links from the response
            if 'links' in json_response:
                links = json_response['links']
                print("Links fetched from server:", links)
                return links
            else:
                print("No links found in the response.")
                return []
        else:
            print(f"Failed to fetch the links. Status code: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error occurred while fetching links: {str(e)}")
        return []

# Main function to get the prompt, fetch links, and display them in HTML
def main():
    prompt = input("Enter your prompt: ")
    links = fetch_links_from_server(prompt)

    if links:
        print("Creating HTML file with fetched links...")
        create_html_file(links)
    else:
        print("No valid links to display.")

if __name__ == "__main__":
    main()
