#!/bin/bash
export TRUMBO_API_KEY=trumbo_fd70287e49664e5e9f3f52d33eea1a8c24804371d208472b
export PYTHONIOENCODING=utf-8
export PYTHONPATH=/root
export PATH=/root/harbor-venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

cd /root

echo "=== Verifying setup ==="
docker --version
docker compose version
harbor --version
python3 -c "from trumbo_agent import TrumboCli; print('adapter OK:', TrumboCli.name())"

echo "=== Downloading dataset ==="
harbor download terminal-bench/terminal-bench-2

echo "=== Launching Terminal-Bench ==="
harbor run -d terminal-bench/terminal-bench-2 \
  -a trumbo_agent:TrumboCli \
  -m trumbo:quartz-1.0 \
  -n 4 \
  --agent-kwarg cline-version=3.6.2 \
  --max-retries 3 \
  --timeout-multiplier 2.0 \
  --yes

echo "=== RUN COMPLETE ==="
