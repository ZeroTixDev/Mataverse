const WebSocket = require('ws');
const express = require('express');
const path = require('path');

module.exports = function setupServer() {
    const wss = new WebSocket.Server({
        noServer: true,
    });
    const app = express();
    const PORT = process.env.PORT || 6969;
    const server = app.listen(PORT, () =>
        console.log(`Server started on Port ${PORT}`)
    );
    // fetch('./physics.js').then((e) => {
    //     console.log(e);
    // });
    app.use(express.static('src/client'));
    app.get('/', (request, result) => {
		// result.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        result.sendFile(path.join(__dirname, '../client/index.html'));
    });
    app.get('/shared/:fileName', (request, result) => {
        result.sendFile(
            path.join(__dirname, String('../shared/' + request.params.fileName))
        );
    });
	server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (socket) => {
            wss.emit('connection', socket, request);
        });
    });
	
    return wss;
};
