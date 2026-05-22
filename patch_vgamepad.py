import os
import sys
import tarfile
import glob
import subprocess
import re

def main():
    print("Starting custom vgamepad patcher for headless CI environment...")
    
    # 1. Download vgamepad source package from PyPI
    print("Downloading vgamepad source from PyPI...")
    subprocess.run([sys.executable, "-m", "pip", "download", "vgamepad", "--no-binary", ":all:"], check=True)
    
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
