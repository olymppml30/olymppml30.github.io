const { exec } = require("child_process");

exec(__dirname + '\\a.bat', (error, stdout, stderr) => {
    exec(__dirname + "\\..\\..\\" + 'myExecutable2', (error, stdout, stderr) => {
        console.log(`${stdout}==myExecutable2.exe==myFile2.obj`);

        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    });
});