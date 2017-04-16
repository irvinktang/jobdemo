var express = require('express')
var bodyParser = require('body-parser')
var fetch = require('node-fetch')
var app = express()
var path = require('path')
var redis = require('redis')
var uuid = require('uuid/v1')

app.use(express.static('build'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))

if(! process.env.REDIS_URL) {
  console.error('Missing environment variable: REDIS_URL');
}

var client = redis.createClient(process.env.REDIS_URL);
client.on('error', function(err){
  console.log("ERROR:", err)
})
client.on('connect', function(reply){
  console.log('connect')
})

app.get('/', function(req,res){
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/jobs', function(req,res){
  var jobId = uuid();
  client.rpush('jobQueue', JSON.stringify({url: req.body.url, id: jobId}), function(err,reply) {
    if(err) throw(err)
    client.hset('jobs', jobId, JSON.stringify({status: 'in progress'}), function(err, reply1) {
      if(err) throw(err)
      res.json({id: jobId})
    })
  })
})

app.get('/jobs/:id',function(req,res){
  client.hget('jobs', req.params.id, function(err,job){
    res.json(job)
  })
})

function processJob(err, job) {
  client.blpop('jobQueue',2, processJob)
  if(err) throw(err)
  if(job) {
    fetch(JSON.parse(job[1]).url)
      .then(res => res.text())
      .then(body => {
        client.hset('jobs',JSON.parse(job[1]).id, JSON.stringify({status: 'completed', html: body}), function(err,status){
          if(err) throw(err)
          console.log('success')
        })
      })
  } else {
    console.log(job)
  }
}

client.blpop('jobQueue',2, processJob)

app.listen(3000, function(){
  console.log('running')
})
