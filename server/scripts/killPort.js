const { execSync } = require('child_process');

function killPort(port) {
    try {
        // For Windows
        execSync(`powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess | Stop-Process -Force"`, { stdio: 'ignore' });
    } catch (error) {
        // Process might not exist, that's fine
    }
}

if (require.main === module) {
    const port = process.argv[2] || 3000;
    killPort(port);
}

module.exports = killPort;
