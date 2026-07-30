@echo off
set TRUMBO_API_KEY=trumbo_fd70287e49664e5e9f3f52d33eea1a8c24804371d208472b
set PYTHONIOENCODING=utf-8
set PYTHONPATH=D:\Torch\cline-full
set PATH=C:\Users\Admin\AppData\Roaming\Python\Python312\Scripts;%PATH%
cd /d D:\Torch\cline-full
harbor run -d terminal-bench/terminal-bench-2 -a trumbo_agent:TrumboCli -m trumbo:quartz-1.0 -n 1 --agent-kwarg cline-version=3.6.2 --max-retries 3 --timeout-multiplier 2.0 --yes
