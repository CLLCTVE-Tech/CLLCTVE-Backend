# cllctve-alpha
Web Functionality for CLLCTVE alpha
Currently, only backend features are supported

## Getting Started

To start, clone the repository in order to get a working version on your local machien for testing and development. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

The following software requirements are needed. Please download before installing npm packages 


* [Node.js 8+](https://nodejs.org/en/) - The Web Framework Used
* [MongoDB 3.6+](https://www.mongodb.com/download-center/community) 
* [VSCode](https://code.visualstudio.com/) - The code editor used


### Installing

Node.js as well as VSCode will need to be installed in order to get a working version of the software on your local machine. There are also a number of packages that will be used to run this application on Node.js. Follow these steps to get everything set up. 

Download all the packages used in the program. Make sure the package.json file from the repo is present on your local machine.

```
npm init -y #to init nodejs app without wizard
npm install #crawl through all the required packages mentioned in package.json and download it to node_modules folder
```

### Configuring the Application

A sample config file will be present as well in cllctve-alpha/config/default-sample.json. Rename this json folder to default.json and enter the appropriate API Keys. Pass in information for:

* Twilio Account SSID and Authentication Token.
* MailChimp API key, instance and list ID's for brands and creatives.
* Mongo Connection String.
* Email address and password to enable features that send emails.
* GCP Project ID.
* GCP Analyitcs view ID.
* jwt Private key for authentication purposes.

Make sure a keyfile.json file has also been downloaded for Storage and Analytics in order to access GCP features. These files will be called storageKeys.json and analyticsKeys.json. They can be downloaded for each user on GCP. Simply maneuver to the resource and generate and download a credentials file.

A sample getstream.js file has been provided as well. Rename to getsream.js and populate script with api keys and so on.

## Running the tests

In order to run tests, you will need to start the server and have postman set up.

### Start the server

In order To run the server, simply use the following commands:

```
cd cllctve-alpha
nodemon index.js
```

A postman package with routes and parameters will be provided. Please contact authors/contriubtors for this package. While the server is running, you can test various endpoints on your local machine.

You can download postman here- [Postman](https://www.getpostman.com/downloads/)


## Deployment

Can be deployed via App Engine or Cloud Run on GCP- More details to come soon

* [App Engine](https://cloud.google.com/appengine/)
* [Cloud Run](https://cloud.google.com/run/)


## Built With

* [GetStream](https://getstream.io/) - The feed API used
* [Google Cloud](https://cloud.google.com/) - Used for storgae, deployment purposes and various other features
* [Twilio](https://www.twilio.com/) - Used to for various communication purposes across the platform
* [MailChimp](https://mailchimp.com/)- Used to generate and maintain mailing lists


## Authors

* **Daniel Fatade** 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## Acknowledgments

Code was used and refactored from some of the following Developers:

* [Mihai Neacsu](https://github.com/mihaineacsu)
* [Mario Delgado](https://github.com/peachepe)
* [Olamilekan Odukoya](https://medium.com/@olamilekan001)
* [Matt Goldspink](https://www.codementor.io/@mattgoldspink)
* [Jon Corbin](https://blog.logrocket.com/author/joncorbin/)
