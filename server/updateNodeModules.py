import subprocess
import json
import os
import sys


def check_npm():
    # Try to find npm location
    if sys.platform == "win32":
        npm_command = "where npm"
    else:
        npm_command = "which npm"

    npm_locations = []
    try:
        result = subprocess.run(npm_command.split(), capture_output=True, text=True)
        # print(f"npm location: {result.stdout}")
        parts = result.stdout.split("\n")
        for p in parts:
            npm_locations.append(p)
    except Exception as e:
        print(f"Error finding npm: {e}")

    # Try running npm version
    for npm in npm_locations:
        try:
            version = subprocess.run([npm, "--version"], capture_output=True, text=True)
            # print(f"npm version: {version.stdout}")
            correct_npm = npm
            break
        except Exception as e:
            pass
            # print(f"Error running npm: {e}")
    return correct_npm


def get_outdated_modules(npmPath):
    try:
        # Run 'npm outdated' and get JSON output
        result = subprocess.run([npmPath, "outdated", "--json"], capture_output=True, text=True, shell=True)  # Try with shell=True

        if result.returncode not in (0, 1):
            print("Error running 'npm outdated':", result.stderr)
            return {}

        if not result.stdout.strip():
            print("All packages are up to date.")
            return {}

        data = json.loads(result.stdout)
        return data

    except Exception as e:
        print(f"Error: {e}")
        print(f"stderr: {getattr(e, 'stderr', 'N/A')}")
        return {}


def update_module(module_name):
    print(f"Updating {module_name} to latest version...")
    try:
        npm_path = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_path, "install", f"{module_name}@latest"], check=True, shell=True)
        print(f"{module_name} updated successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Failed to update {module_name}: {e}\n")


def main():
    print("Checking npm installation...")
    npmPath = check_npm()
    print(f"Found npm in {npmPath}")

    print("\nGetting outdated modules...")
    outdated = get_outdated_modules(npmPath)

    if not outdated:
        return

    for module, info in outdated.items():
        current = info.get("current", "unknown")
        wanted = info.get("wanted", "unknown")
        latest = info.get("latest", "unknown")

        print(f"Module: {module}")
        print(f"  Current: {current}")
        print(f"  Wanted:  {wanted}")
        print(f"  Latest:  {latest}")

        choice = input(f"Do you want to update '{module}' to version {latest}? [y/N]: ").strip().lower()
        if choice == "y":
            update_module(module)
        else:
            print(f"Skipped updating {module}.\n")


if __name__ == "__main__":
    main()
