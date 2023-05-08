const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'Chat Bot'


io.on('connection', socket => {

	socket.on('joinRoom', ({username, room}) => {

		const user = userJoin(socket.id, username, room)

		socket.join(user.room)
		
		// run when client connects: to one
	socket.emit('message', formatMessage(botName, 'welcome to chatCord'))

	// broadcast when a user connects: to all except one who connects
	socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`) );


	// send users and room info
	io.to(user.room).emit('roomUsers', {
		room: user.room,
		users: getRoomUsers(user.room)
	})
})
	
// listen fot chatMessage
	socket.on('chatMessage', (msg) => {
		const user = getCurrentUser(socket.id)

		io.to(user.room).emit('message', formatMessage(user.username, msg))
})

	// when disconnects
	socket.on('disconnect', () => {
		const user = userLeave(socket.id)
		
		if(user) {
			
			// to everyone
			io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))

				// send users and room info
	io.to(user.room).emit('roomUsers', {
		room: user.room,
		users: getRoomUsers(user.room)
	})
		}

	})
 
})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server on port ${PORT}`))