var React = require('react');
var ReactDOM = require('react-dom');
var rsb = require('react-bootstrap');

import {Modal, Button} from 'react-bootstrap'

class Jobs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: '',
      reqId: '',
      reqStatus:'',
      reqInfo: '',
      jobId: '',
      jobData: {},
      showJobId: false,
      showStatus: false
    }

    this.submitJob = this.submitJob.bind(this)
    this.changeUrl = this.changeUrl.bind(this)
    this.changeId = this.changeId.bind(this)
    this.requestJob = this.requestJob.bind(this)
    this.closeJob = this.closeJob.bind(this)
    this.closeStatus = this.closeStatus.bind(this)
  }

  componentDidMount() {
    fetch('/data')
      .then((res) => res.json())
      .then((json)=> {
        this.setState({jobData: json["data"]})
      })
  }

  submitJob(event) {
    event.preventDefault();
    var data = JSON.stringify({url: this.state.url});
    fetch('/jobs', {
      method: 'POST',
      headers: {
        'Accept':'application/json',
        'Content-Type':'application/json'
      },
      body: data
    })
    .then((res) => res.json())
    .then((json) => {
      this.setState({jobId: json["id"].id, jobData:json["data"], showJobId: true})
      })
      .catch(function(err) {
        console.log('ERROR: ', err);
      })
    }

    requestJob(event) {
      event.preventDefault();
      fetch(`/jobs/${this.state.reqId}`)
        .then((res) => res.json())
        .then((json) => {
          var data = JSON.parse(json)
          this.setState({reqStatus:data.status, reqInfo: data.html || 'Still processing...', showStatus: true})
        })
    }

    changeUrl(event) {
      this.setState({url: event.target.value})
    }

    changeId(event) {
      this.setState({reqId: event.target.value})
    }

    closeJob() {
      this.setState({showJobId: false})
    }

    closeStatus() {
      this.setState({showStatus: false})
    }

    render() {
      return (
        <div>
          <div style={{display:"flex",flexDirection:"column"}} className="col-sm-4">
            <div>
              <form className="form-group" onSubmit={this.submitJob}>
                <h2 className="form-signin-heading">Submit Job</h2>
                <h3>Must be an absolute url, eg http:&#47;&#47;example.com&#47;</h3>
                <input value={this.state.url} className="form-control" onChange={this.changeUrl} type="text" required placeholder="http://example.com/"></input>
                <button className="btn btn-default" type="submit">Submit</button>
              </form>
            </div>
            <div>
              <form className="form-group" onSubmit={this.requestJob}>
                <h2>Insert Job ID</h2>
                <input value={this.state.reqId} className="form-control" onChange={this.changeId} type="text" required placeholder="Enter Job ID"></input>
                <button className="btn btn-default" type="submit">Request Job</button>
              </form>
            </div>
          </div>
          <div className="col-sm-8">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Job ID</th>
                </tr>
              </thead>
              <tbody>
              {this.state.jobData ? Object.keys(this.state.jobData).map((jobId) => {
                var data = this.state.jobData
                return <tr><td>{JSON.parse(data[jobId]).url}</td><td>{jobId}</td></tr>
              }) : null}
              </tbody>
            </table>
          </div>

          <Modal show={this.state.showJobId} onHide={this.closeJob}>
            <Modal.Header closeButton>
              <Modal.Title>Job ID: {this.state.jobId}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h4>Use this ID to access status of submitted job</h4>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.closeJob}>Close</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={this.state.showStatus} onHide={this.closeStatus}>
            <Modal.Header closeButton>
              <Modal.Title>Requested Job:{this.state.reqId}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h2>Job Status: {this.state.reqStatus}</h2>
              <p>{this.state.reqInfo}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.closeStatus}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      )
    }
  }

  ReactDOM.render(<Jobs />, document.getElementById('root'))
