
[![build status](https://code.siemens.com/vladimirs.semikins.ext/TableViewer/badges/master/build.svg)](https://code.siemens.com/vladimirs.semikins.ext/TableViewer/commits/master)
# 1. Siemens Table Viewer

This repository contains Siemens HANA Factory developed application Table Viewer
More details about Table Viewer can be found on [wiki.siemens.com](https://wiki.siemens.com/display/BIFactory/Common+Object+-+Table+Viewer+Application)

# 2. Workstation Preparation 
In order to contribute please follow steps below.

## 2.1 Git Installation & Configuration
Download and Install Git [https://git-scm.com](https://git-scm.com/)

### 2.1.1 First-Time Git Setup After installing Git 
Open Git Bash and setup your username and email as shown below.
```javascript
$ git config --global user.name "John Doe"
$ git config --global user.email johndoe@siemens.com
```
Enable your code.siemens.com account, open [https://code.siemens.com/profile/keys](https://code.siemens.com/profile/keys) and follow instruction from here [https://code.siemens.com/help/ssh/README](https://code.siemens.com/help/ssh/README)

### 2.1.1 First-Time NodeJS Setup
Download and Install [https://nodejs.org/](https://nodejs.org/)
After installing NodeJS open terminal and install grunt
```javascript
npm install -g grunt-cli
```

## 3. Installing the application
```javascript
git clone git@code.siemens.com:vladimirs.semikins.ext/TableViewer.git
npm install
```

## 4 Run the app
```javascript
grunt serve
```
this will setup a server which hosts the app, open up your browser and point it to

[http://localhost:8082/index.html](http://localhost:8082/index.html)