const { exec } = require("child_process");

exec(__dirname + '\\a.bat', (error, stdout, stderr) => {
    exec(__dirname + "\\..\\..\\" + 'myExecutable', (error, stdout, stderr) => {
        console.log(`${stdout}==myExecutable.exe==myFile.obj`);

        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    });
});