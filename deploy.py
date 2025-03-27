import os
import shutil
import subprocess
import sys

# Define paths
src_directory = 'src'
repo_root = '.'

# Step 1: Check if 'src' directory exists
if not os.path.exists(src_directory):
    print(f"Error: {src_directory} directory not found!")
    sys.exit(1)
else:
    print(f"{src_directory} directory found.")

# Step 2: List contents of the 'src' directory (for debugging purposes)
print("Listing contents of the 'src' directory:")
for root, dirs, files in os.walk(src_directory):
    for name in files:
        print(os.path.join(root, name))

# Step 3: Setup Git configuration
print("Configuring Git for deployment...")
subprocess.run(['git', 'config', '--global', 'user.name', 'GitHub Actions'], check=True)
subprocess.run(['git', 'config', '--global', 'user.email', 'actions@github.com'], check=True)

# Step 4: Create or switch to 'gh-pages' branch
print("Creating or switching to gh-pages branch...")
subprocess.run(['git', 'checkout', '--orphan', 'gh-pages'], check=True)

# Step 5: Reset the working tree
print("Resetting the working tree...")
subprocess.run(['git', 'reset', '--hard'], check=True)

# Step 6: Copy contents of 'src' to the root
print(f"Copying contents of {src_directory} to the root...")
for item in os.listdir(src_directory):
    s = os.path.join(src_directory, item)
    d = os.path.join(repo_root, item)
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

# Step 7: Commit changes
print("Committing changes...")
subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'Deploy to GitHub Pages'], check=True)

# Step 8: Push changes to the gh-pages branch
print("Pushing changes to gh-pages branch...")
subprocess.run(['git', 'push', '--force', 'origin', 'gh-pages'], check=True)

print("Deployment completed successfully!")
