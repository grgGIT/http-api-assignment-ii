const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const users = {}; // Using an object to store users by name

const sendResponse = (statusCode, message, response) => {
    let id;
    if (statusCode === 200) {
        id = 'Success';
    } else if (statusCode === 201) {
        id = 'Created';
    } else if (statusCode === 204) {
        id = 'Updated (No Content)';
    } else if (statusCode === 400) {
        id = 'addUserMissingParams';
    } else if (statusCode === 404) {
        id = 'Not Found';
    } else {
        id = 'Internal Error';
    }
    const jsonResponse = { message, id };
    console.log(`JSON Response: ${JSON.stringify(jsonResponse)}`);
    response.writeHead(statusCode, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(jsonResponse));
};

const onRequest = (request, response) => {
    const { url, method } = request;

    // Serve static files
    if (url === '/' || url === '/client.html') {
        const filePath = path.join(__dirname, '../client/client.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Internal Server Error' }));
            } else {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(data);
            }
        });
        return;
    }

    if (url === '/style.css') {
        const filePath = path.join(__dirname, '../client/style.css');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Internal Server Error' }));
            } else {
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(data);
            }
        });
        return;
    }

    // Handle /getUsers
    if (url === '/getUsers') {
        if (method === 'GET') {
            sendResponse(200, users, response);
        } else if (method === 'HEAD') {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
        }
        return;
    }

    // Handle /notReal
    if (url === '/notReal') {
        if (method === 'GET') {
            sendResponse(404, 'Not Found: The requested resource does not exist.', response);
        } else if (method === 'HEAD') {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end();
        }
        return;
    }

    // Handle /addUser
    if (url === '/addUser' && method === 'POST') {
        let body = '';

        request.on('data', chunk => {
            body += chunk.toString(); // Convert Buffer to string
        });

        request.on('end', () => {
            const { name, age } = JSON.parse(body || '{}');

            if (!name || !age) {
                sendResponse(400, response);
            } else if (users[name]) {
                // Update age if the user exists
                users[name].age = age;
                response.writeHead(204); // No content
                response.end();
            } else {
                // Add new user
                users[name] = { name, age };
                sendResponse(201, response);
            }
        });

        return;
    }

    // Handle other URLs with 404
    sendResponse(404, 'Not Found', response);
};

const server = http.createServer(onRequest);

server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});
