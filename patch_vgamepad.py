import os
import sys
import tarfile
import glob
import subprocess
import re

def main():
    print("Starting custom vgamepad patcher for headless CI environment...")
    
    # 1. Download vgamepad source package from PyPI via HTTP to avoid running setup.py which hangs on Windows GHA
    print("Downloading vgamepad source from PyPI via HTTP...")
    import urllib.request
    import json
    
    try:
        url = "https://pypi.org/pypi/vgamepad/json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        tgz_url = None
        for u in data['urls']:
            if u['packagetype'] == 'sdist' and u['filename'].endswith('.tar.gz'):
                tgz_url = u['url']
                break
        
        if not tgz_url:
            raise ValueError("No sdist found")
    except Exception as e:
        print(f"Warning: PyPI JSON API failed ({e}). Using fallback.")
        tgz_url = "https://files.pythonhosted.org/packages/b8/b2/24584285b0d099951659779df52c1efec0082987a0701041b6be9c5123fc/vgamepad-0.1.0.tar.gz"
        
    print(f"Downloading from: {tgz_url}")
    urllib.request.urlretrieve(tgz_url, "vgamepad-0.1.0.tar.gz")
    print("Download completed successfully!")
    
    # Find the downloaded archive
    archives = glob.glob("vgamepad-*.tar.gz")
    if not archives:
        print("Error: Could not find vgamepad tar.gz archive")
        sys.exit(1)
    archive_path = archives[0]
    print(f"Found archive: {archive_path}")
    
    # 2. Extract the archive
    print("Extracting archive...")
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall()
    
    # Find the extracted folder
    dirs = glob.glob("vgamepad-*/")
    if not dirs:
        print("Error: Could not find extracted vgamepad directory")
        sys.exit(1)
    extracted_dir = dirs[0]
    print(f"Extracted to: {extracted_dir}")
    
    setup_path = os.path.join(extracted_dir, "setup.py")
    
    # 3. Patch setup.py
    print("Patching setup.py...")
    with open(setup_path, "r", encoding="utf-8") as f:
        setup_code = f.read()
        
    # We want to completely disable the registry query and driver installation.
    # The registry query uses reg query and check_output.
    # The installer uses msiexec and subprocess.call.
    
    # Replace the reg query check_output command with a dummy command
    patched_code = setup_code.replace(
        "['reg', 'query', r'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\', '/s']",
        "['cmd', '/c', 'echo registry_mock']" if os.name == 'nt' else "['echo', 'registry_mock']"
    )
    
    # Replace the msiexec installation call with a dummy echo mock
    patched_code = patched_code.replace(
        "['msiexec', '/i', '%s' % str(pathMsi)]",
        "['cmd', '/c', 'echo msiexec_mock']" if os.name == 'nt' else "['echo', 'msiexec_mock']"
    )
    
    # Force vigem_installed to be True so the driver installation block is never entered
    patched_code = re.sub(
        r"vigem_installed\s*=\s*False",
        "vigem_installed = True",
        patched_code
    )
    
    # Save the patched setup.py
    with open(setup_path, "w", encoding="utf-8") as f:
        f.write(patched_code)
        
    print("setup.py successfully patched.")
    
    # 4. Install the patched package
    print("Installing patched vgamepad...")
    subprocess.run([sys.executable, "-m", "pip", "install", extracted_dir], check=True)
    print("vgamepad installed successfully!")

if __name__ == "__main__":
    main()
