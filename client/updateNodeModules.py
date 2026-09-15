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
            return None

        if not result.stdout.strip():
            return {}

        data = json.loads(result.stdout)
        return data

    except Exception as e:
        print(f"Error: {e}")
        print(f"stderr: {getattr(e, 'stderr', 'N/A')}")
        return None


def update_module(npmPath, module_name):
    print(f"Updating {module_name} to latest version...")
    try:
        subprocess.run([npmPath, "install", f"{module_name}@latest"], check=True, shell=True)
        print(f"{module_name} updated successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Failed to update {module_name}: {e}\n")


def print_outdated_table(outdated):
    name_width = max([len(m) for m in outdated] + [len("Package")])
    header = f"{'Package':<{name_width}}  {'Current':<12} {'Wanted':<12} {'Latest':<12}"
    print(f"\n{len(outdated)} outdated package(s):\n")
    print(header)
    print("-" * len(header))

    for module, info in outdated.items():
        current = info.get("current", "unknown")
        wanted = info.get("wanted", "unknown")
        latest = info.get("latest", "unknown")
        print(f"{module:<{name_width}}  {current:<12} {wanted:<12} {latest:<12}")
    print()


def main():
    print("Checking npm installation...")
    npmPath = check_npm()
    print(f"Found npm in {npmPath}")

    print("\nGetting outdated modules...")
    outdated = get_outdated_modules(npmPath)

    if outdated is None:
        print("\nCould not determine outdated modules.")
        return

    if not outdated:
        print("\nNothing to update - all packages are up to date.")
        return

    print_outdated_table(outdated)

    choice = input("Update [a]ll, choose [s]ingle packages, or [q]uit? [a/s/Q]: ").strip().lower()

    if choice == "a":
        for module, info in outdated.items():
            update_module(npmPath, module)
    elif choice == "s":
        for module, info in outdated.items():
            latest = info.get("latest", "unknown")
            answer = input(f"Update '{module}' to version {latest}? [y/N]: ").strip().lower()
            if answer == "y":
                update_module(npmPath, module)
            else:
                print(f"Skipped updating {module}.\n")
    else:
        print("Nothing updated.")


if __name__ == "__main__":
    main()
