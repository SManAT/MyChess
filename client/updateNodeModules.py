import subprocess
import json
import shutil
import sys


def check_npm():
    # shutil.which resolves npm.cmd on Windows via PATHEXT
    npm = shutil.which("npm")
    if npm is None:
        sys.exit("npm not found on PATH.")

    try:
        subprocess.run([npm, "--version"], capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError) as e:
        sys.exit(f"Error running npm: {e}")
    return npm


def get_outdated_modules(npmPath):
    try:
        # Run 'npm outdated' and get JSON output
        result = subprocess.run([npmPath, "outdated", "--json"], capture_output=True, text=True)

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


def update_modules(npmPath, module_names):
    # Install all packages in one call so npm resolves interdependent
    # peer dependencies (e.g. @babel/core + @babel/preset-env) together.
    print(f"Updating to latest version: {', '.join(module_names)}")
    try:
        subprocess.run([npmPath, "install"] + [f"{m}@latest" for m in module_names], check=True)
        print("Update successful.\n")
    except subprocess.CalledProcessError as e:
        print(f"Update failed: {e}\n")


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

    selected = []
    if choice == "a":
        selected = list(outdated)
    elif choice == "s":
        for module, info in outdated.items():
            latest = info.get("latest", "unknown")
            answer = input(f"Update '{module}' to version {latest}? [y/N]: ").strip().lower()
            if answer == "y":
                selected.append(module)
            else:
                print(f"Skipped updating {module}.\n")

    if selected:
        update_modules(npmPath, selected)
    else:
        print("Nothing updated.")


if __name__ == "__main__":
    main()
