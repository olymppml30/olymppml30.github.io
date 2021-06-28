const { execFile } = require("child_process");

execFile("node", [__dirname + "\\js_example.txt"], (error, stdout, stderr) => {

  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }
  stdout = stdout.slice(0, -1);

  console.log(`${stdout}`);
});