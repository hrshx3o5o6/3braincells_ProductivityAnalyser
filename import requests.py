import requests
from bs4 import BeautifulSoup
from collections import Counter
import re
import requests
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

# Example usage
prompt = input("enter ur prompt: ")
generated_words = generate_words_from_prompt(prompt)
print("Generated words based on the prompt:", generated_words)


def open_distracted_tab():
    url = "data:text/html;charset=utf-8,%3Ch1%3EYou're%20getting%20distracted!%3C%2Fh1%3E%3Cp%3EGet%20back%20to%20work!%3C%2Fp%3E"
    webbrowser.open_new_tab(url)

# URL of the webpage you want to scrape

url = f'https://arxiv.org/abs/1706.03762'  # Replace with the target URL
#https://en.wikipedia.org/wiki/{prompt}
# Fetch the HTML content of the page
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Parse the HTML content using BeautifulSoup
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
    
    # Display the headers
    for tag, content in headers.items():
        print(f'\n{tag.upper()} Headers:')
        for header in content:
            print(f'- {header}')
else:
    print(f"Failed to fetch the page. Status code: {response.status_code}")

# Example: Check for the existence of specific words in headers
search_terms = generated_words
found_terms = {
    term: any(term.lower() in header.lower() for headers in headers.values() for header in headers)
    for term in search_terms
}
ctr = sum(found_terms.values())  # Count how many search terms were found

for term, found in found_terms.items():
    print(f"'{term}' found in headers: {found}")

# Check if the count of found terms meets the threshold
threshold = 0.4 * len(search_terms)
if ctr >= threshold:
     print("Productive")
else:
    print("YOUR DISTRACTED!!")
    time.sleep(5)  # Wait for 5 seconds before opening the distracting tab
    open_distracted_tab()


"""
 links to the gemini api, takes the prompt of the user and uses that prompt to create a list 
containing the 100 most common words related to the given prompt and then compares these words
to the words present on the website the user is currently on and if there is a 20 percent match 
with the list of 100 words(productive words) they'd be classified as productive and if the site 
is unproductive it will redirect you to an html page telling them that they were distracted and give
them threads or links to nudge them back into being productive 
"""