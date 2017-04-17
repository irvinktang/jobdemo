var express = require("express");
var bodyParser = require("body-parser");
var fetch = require("node-fetch");
var app = express();
var path = require("path");
var redis = require("redis");
var uuid = require("uuid/v1");

app.use(express.static("build"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (!process.env.REDIS_URL) {
  console.error("Missing environment variable: REDIS_URL");
}

var client = redis.createClient(process.env.REDIS_URL);
client.on("error", function(err) {
  console.log("ERROR:", err);
});
client.on("connect", function(reply) {
  console.log("connect");
});

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/data", function(req, res) {
  client.hgetall("jobs", function(err, jobs) {
    res.json({ data: jobs });
  });
});

app.get("/jobs/:id", function(req, res) {
  client.hget("jobs", req.params.id, function(err, job) {
    res.json(job);
  });
});

app.post("/jobs", function(req, res) {
  var jobId = uuid();
  client.rpush(
    "jobQueue",
    JSON.stringify({ url: req.body.url, id: jobId }),
    function(err, reply) {
      if (err) throw err;
      client.hset(
        "jobs",
        jobId,
        JSON.stringify({ url: req.body.url, status: "In Progress" }),
        function(err, reply1) {
          if (err) throw err;
          client.hgetall("jobs", function(err, jobs) {
            res.json({ id: { id: jobId }, data: jobs });
          });
        }
      );
    }
  );
});

function processJob(err, job) {
  client.blpop("jobQueue", 1, processJob);
  if (err) throw err;
  if (job) {
    var url = JSON.parse(job[1]).url;
    fetch(url).then(res => res.text()).then(body => {
      client.hset(
        "jobs",
        JSON.parse(job[1]).id,
        JSON.stringify({ url: url, status: "Completed", html: body }),
        function(err, status) {
          if (err) throw err;
          console.log("success");
        }
      );
    });
  } else {
    console.log(job);
  }
}

client.blpop("jobQueue", 1, processJob);

app.listen(process.env.PORT || 3000, function() {
  console.log("running");
});
