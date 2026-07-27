# Scholar's Tavern
Scholar's Tavern is a web-based platform where students can look for groups of
fellow scholars that they can study with. It is inspired by the medieval
concept of a tavern which serves as a gathering place where individuals
exchange stories, ideas and experiences. The platform aims to create an
environment where students can comformtably find study partners, organize study
sessions, and help each other study.

The deployed version of the system is available here:
https://scholarstavern-ya5z.onrender.com

The deployed version however is using the free tier of render, which is very
slow. HTTP requests can take forever and the call system might not work
properly.

## Requirements
Make sure to have the following installed:
- npm

## Setup
Clone the project:
```bash
git clone https://github.com/RedFlameKen/ScholarsTavern
cd ScholarsTavern
```

Next, make sure you have the dependencies installed in the project by running
the following command:
```bash
npm install
```
This will install all of the dependencies listed in the `package.json` file.

The system makes use of a Django backend server for handling logic and the
database. The Django backend server is available in this repository:
https://github.com/RedFlameKen/ScholarsTavernServer

If deploying the system yourself, make sure that the backend server is running.
In anycase, you should change the default URL and protocol of the backend
server defined in `src/request/requester.jsx`.

```jsx
/*  The default Websocket protocol
 *  If running this client and the server locally in the same machine, the
 *  following might need to be changed to "ws://"
 */
export const WEBSOCKET_PROTOCOL = "wss://"

/*  The default HTTP protocol
 *  If running this client and the server locally in the same machine, the
 *  following might need to be changed to "http://"
 */
export const HTTP_PROTOCOL = "https://"

/*  The default domain of the server
 *  If running this client and the server locally in the same machine, the
 *  following might need to be changed to "localhost:8000"
 */
export const DEFAULT_SERVER_DOMAIN = "scholarstavernserver-zap2.onrender.com"
```


## Running
To start the react development server for live preview, run the following
command:
```bash
npm start
```

This runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will be reloaded any time you make changes.


## Building
To create an optimized deployable version of the project, run the following

```bash
npm run build
```


This project makes use of `react-router-dom` for endpoint-based navigation.
Because of this, it is recommended to use the following command to run the
build:
```bash
npm install -g serve
serve -s build
```

in the case that warnings cause the halt of the build, run the following before
building again:
```bash
export CI=false
```
