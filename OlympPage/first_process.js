const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const execFile = require("child_process").execFile;

var file_name = path.basename(__dirname + "/genName.txt");
let fileContent = fs.readFileSync(file_name, "utf8");
let rows = fileContent.split("\r\n");
var filename = rows[0] + "_" + rows[1] + "_" + crypto.randomBytes(4).readUInt32LE(0) + ".js";
console.log(filename);

var pyFileName = "python_example.py";
var text = `const exec = require("child_process").exec;\nexec("` + pyFileName + `", (err, stdout, stderr) => {\n  if (err) {\n    console.error(err);\n    return;\n  }\n  console.log(stdout);\n});`
fs.writeFileSync(filename, text);

execFile("node", [filename], (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }

  /*if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }*/

  console.log(`\n${stdout}`);
});