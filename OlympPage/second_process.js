const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

var execCode = "";

execFile("node", ["first_process.js"], (error, stdout, stderr) => {

  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }

  /*if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }*/

  execCode = `${stdout}`;
  let rows = execCode.split("\n");
  console.log(rows[2]);

  fs.unlink(rows[0], (err) => {
    try {
      if (err) throw err;

      //console.log('Deleted');
    }
    catch (err) {
      console.log(err.message);
    }
  });
});
//var SecondDate = new Date();
//var SecondTime = SecondDate.getMilliseconds();
//var FirstDate = new Date();
//var FirstTime = FirstDate.getMilliseconds();
//if (fileContent === answer) {console.log("Yes")};
//else {console.log("No")};