const { execSync } = require('child_process');
try {
  const output = execSync('netstat -ano', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const lines = output.split('\n').filter(l => l.includes(':3000') && l.includes('LISTENING'));
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
    }
  }
} catch {}
