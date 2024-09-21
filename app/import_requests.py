import requests
from bs4 import BeautifulSoup
from collections import Counter
import re
import webbrowser
import time

def generate_words_from_prompt(prompt):
    # Replace spaces in the prompt with underscores to form the Wikipedia URL
    prompt_query = prompt.replace(' ', '_')
    url = f'https://en.wikipedia.org/wiki/{prompt_query}'

    # Fetch the HTML content of the page
    response = requests.get(url)

    if response.status_code == 200:
        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        # Extract all text content from the page
        text = soup.get_text(separator=' ').lower()
        # Remove special characters and split the text into words
        words = re.findall(r'\b\w+\b', text)
        # Count the frequency of each word
        word_counts = Counter(words)
        # Get the 100 most common words, excluding stop words
        common_words = [word for word, count in word_counts.most_common(100)]
        return common_words
    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return []

def analyze_prompt(prompt, url):  # Add url as a parameter
    generated_words = generate_words_from_prompt(prompt)
    print("Generated words based on the prompt:", generated_words)

    # Use the provided URL instead of a hardcoded one
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract keywords from meta tags
        keywords_meta = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_meta:
            keywords = keywords_meta.get('content', '').split(',')
            print('Keywords:', [keyword.strip() for keyword in keywords])
        else:
            print('No keywords found.')

        # Extract main headers (h1, h2, etc.)
        headers = {}
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            headers[tag] = [header.get_text(strip=True) for header in soup.find_all(tag)]

        # Display headers
        for tag, content in headers.items():
            print(f'\n{tag.upper()} Headers:')
            for header in content:
                print(f'- {header}')

        # Check for existence of specific words in headers
        search_terms = generated_words
        found_terms = {
            term: any(term.lower() in header.lower() for headers in headers.values() for header in headers)
            for term in search_terms
        }

        ctr = sum(found_terms.values())  # Count how many search terms were found

        for term, found in found_terms.items():
            print(f"'{term}' found in headers: {found}")

        # Check if count of found terms meets threshold
        threshold = 0.4 * len(search_terms)
        
        if ctr >= threshold:
            print("Productive")
        else:
            print("YOUR DISTRACTED!!")
            time.sleep(5)  # Wait before opening distracting tab
            open_distracted_tab()
    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")

def open_distracted_tab():
    url = "data:text/html;charset=utf-8,%3Ch1%3EYou're%20getting%20distracted!%3C%2Fh1%3E%3Cp%3EGet%20back%20to%20work!%3C%2Fp%3E"
    webbrowser.open_new_tab(url)

# Example usage (this will be replaced by your frontend input)
# analyze_prompt("Your task here")  # Call this function with user input from frontend
