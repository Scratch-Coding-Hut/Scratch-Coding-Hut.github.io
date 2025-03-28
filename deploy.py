import os
import requests

# GitHub repository details
repo_owner = 'Scratch-Coding-Hut'
repo_name = 'Scratch-Coding-Hut'
branch = 'main'  # or any other branch you want to target
path = 'src'  # folder name in the repo

# GitHub API URL to fetch content of 'src' folder
url = f'https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}?ref={branch}'

# Make GET request to GitHub API
response = requests.get(url)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    print(f"Successfully fetched contents of '{path}' directory from {repo_owner}/{repo_name} on branch {branch}")
    
    # Print the raw JSON response to check if files are being returned correctly
    files = response.json()
    print("Files returned from the API:", files)
    
    # Iterate through the files and create the file path for each
    for file in files:
        # Check if it's a file (not a directory)
        if file['type'] == 'file':
            # Get file name and download URL
            file_name = file['name']
            download_url = file['download_url']
            
            # Construct the relative file path within the 'src' directory
            file_path = os.path.join(path, file_name)
            
            # Print the file path and download URL
            print(f"File path: {file_path}")
            print(f"Download URL: {download_url}")
else:
    print(f"Failed to fetch directory content. Status code: {response.status_code}")
