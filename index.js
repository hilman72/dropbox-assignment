const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const fs = require("fs");
const path = require("path");

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(fileUpload());

const uploadDirectory = __dirname + path.sep + "uploaded";

app.use(express.static("/uploaded"));
app.use(express.static("/pages"));

let caches = {};

function writeFile(name, body) {
  return new Promise((resolve, reject) => {
    fs.writeFile(uploadDirectory + path.sep + name, body, (err) => {
      if (err) {
        return reject(err);
      } else {
        resolve(name);
      }
    });
  }).then(readFile);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(uploadDirectory + path.sep + file, (err, body) => {
      if (err) {
        return reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});

console.log(caches);

app.post("/files", (req, res) => {
  console.log(req.files);

  let file = req.files.upload.name;
  let data = req.files.upload.data;

  caches[file] = writeFile(file, data);
  let nameArr = fs.readFileSync("upload.json", { encoding: "utf-8" });

  let fileJsonData = JSON.parse(nameArr);
  console.log("before", fileJsonData);

  fileJsonData.push({ name: file });
  console.log("after", fileJsonData);

  fs.writeFile("upload.json", JSON.stringify(fileJsonData), "utf-8", function (
    err
  ) {
    if (err) throw err;
  });

  res.redirect("back");
});

app.get("/uploaded/:name", (req, res) => {
  if (caches[req.params.name] == null) {
    console.log("reading from folder");
    caches[req.params.name] = readFile(req.params.name);
  }
  console.log(caches);
  console.log(caches[req.params.name]);

  caches[req.params.name]
    .then((body) => {
      console.log(body);
      res.send(body);
    })
    .catch((e) => res.status(500).send(e.message));
});

app.get("/uploaded", (req, res) => {
  var fileName;

  fs.readFile("upload.json", "utf8", function (err, data) {
    if (err) {
      console.log("error");
    } else {
      fileName = JSON.parse(data);
      res.send(fileName);
    }
  });
});

app.listen(8080, () => {
  console.log("fixing you 8080");
});
