import subprocess
import sys
from datetime import datetime

def run_command(command, description):
    print(f"\n==== {description} ====")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            text=True, 
            capture_output=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing {command}:")
        print(e.stderr)
        return False

def sync():
    # Check status
    print("Checking Git status...")
    status = subprocess.run(
        "git status --porcelain", 
        shell=True, 
        capture_output=True, 
        text=True
    ).stdout.strip()

    if not status:
        print("No changes to sync. Checking for updates from remote...")
    else:
        if not run_command("git add .", "Adding Changes"):
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not run_command(f'git commit -m "Auto-sync: {timestamp}"', "Committing Changes"):
            return

    if not run_command("git pull --rebase origin main", "Pulling Latest Changes (Rebase)"):
        print("\nSync failed. You might need to resolve conflicts manually.")
        return

    if not run_command("git push origin main", "Pushing to GitHub"):
        return

    print("\nSuccess! Your workspace is in sync with GitHub.")

if __name__ == "__main__":
    try:
        sync()
    except KeyboardInterrupt:
        print("\nSync cancelled by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
    
    input("\nPress Enter to exit...")
