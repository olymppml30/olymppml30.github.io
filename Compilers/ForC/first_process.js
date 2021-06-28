const { exec } = require("child_process");
var spawn = require("child_process").spawn;

exec(__dirname + '\\a.bat', (error, stdout, stderr) => {
    var child = spawn("myExecutable");
    child.stdin.write('223452354'); //my command takes a markdown string...

    child.stdout.on('data', function (data) {
        console.log(data + "==myExecutable.exe==myFile.obj");
    });

    child.stdin.end();
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
});