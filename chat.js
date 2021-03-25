var express = require('express');

// 설치한 socket.io 모듈 불러오기
var socket = require('socket.io');

// 서버를 만드는 모듈 불러옴
var http = require('http'); 

// Node.js 기본 내장 모듈 불러오기
var fs = require('fs')

// express 객체 생성
var app = express();

// express http 객체 생성
var server = http.createServer(app); // app 말고 8082써주면 오류 발생 

// 생성된 서버를 socket.io에 바인딩
var io = socket(server);

app.use('/css', express.static('./css'))
app.use('/js', express.static('./js'))

// 보안 상의 이유로 브라우저는 CORS를 제한하고 있음
// port 80, 8082 사용
// 80 -> 8082, 8082 -> 80 데이터 전달 가능하게 하기 위함
var cors = require('cors');
const { RSA_NO_PADDING } = require('constants');
const { response } = require('express');
app.use(cors());

// Get 방식으로 / 경로에 접속하면 실행 됨
app.get('/',function(req, res) {
    // console.log('유저가 / 으로 접속하였습니다')
    // res.send('hello')
    fs.readFile('./index.html', function(err, data) {
        if(err) {
            res.send('에러')
        } else {
            res.writeHead(200, {'Content-Type' : 'text/html'})
            res.write(data)
            res.end()
        }
    })
})


io.sockets.on('connection', function(socket) {
    console.log('유저 접속 됨')

    // 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌
    socket.on('newUser', function(name) {
        console.log(name + '님이 접속하였습니다.')

        // 소켓에 이름 저장해두기
        socket.name = name

        // 모든 소켓에게 전송
        io.sockets.emit('update', {type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.'})
    })

    // 전송한 메시지 받기
    socket.on('message', function(data){
        // 받은 데이터에 누가 보냈는지 이름을 추가
        data.name = socket.name
        
        console.log(data)

        // 보낸 사람을 제외한 나머지 유저에게 메세지 전송
        socket.broadcast.emit('update', data)
    })

    socket.on('disconnect', function(){
        console.log(socket.name + '님이 나가셨습니다.')

        // 나가는 사람을 제외한 나머지 유저에게 메세지 전송
        socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'})
    })

})

// 8082서버 연결
server.listen(8083, function(){
    console.log("SEVER RUNNING");
});