var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var socket = require('socket.io');
var io = socket(server);
var id = socket.id;
var port = 5000;
var socketList = [];
var clients = [];
var t_user_01, t_user_02;
var room;
var loginresult;
var chat_select_result;
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig');
const { response } = require('express');
const { Console } = require('console');
const { Socket } = require('net');
const { callbackify } = require('util');
const { stat } = require('fs');

// 자동저장
oracledb.autoCommit = true;

// DB 연결
oracledb.getConnection({
    user            : dbConfig.user,
    password        : dbConfig.password,
    connectString   : dbConfig.connectString
},
function(err,connection) {
    // DB CONNECT ERROR 
    if (err){
        console.error(err.message);
        return;
    }
    // SQL QUERY (LOGIN)
    let login_query = "select user_id"
                    + " from KTISS_USER";
    // DB 조회
    connection.execute(login_query, [], function(err,result){
        // 조회 ERROR 처리
        if(err) {
            console.log(err.message);
            return;
        }
        // 로그인 결과 값 저장
        loginresult = result.rows;
        // DB 연결 해제
        // dbclose(connection); 
    }) // connection.execute END
} // function(err,connection) END
); // oracledb.getConnection( END
// DB 연결 해제
function dbclose(connection) {
    connection.release(function(err) {
        if(err) {
            console.error(err.message);
        }
        console.log("db 연결 종료");
    }) // connection.release(function(err) { END
} // dbclose END


app.use('/', function(req, resp) {
    resp.sendFile(__dirname + '/chat.html');
});
app.use('/chat', function(req, resp) {
    resp.sendFile(__dirname + '/chat.html');
});
io.on('connection', function(socket) {
    socketList.push(socket);
    console.log('User Join');

    // 로딩하자 말자 룸 번호 조회하고 조인
    socket.on('JOIN', function(data){
        t_user_01 = data.s_user;
        t_user_02 = data.g_user;

        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let chat_search_query = "SELECT NO"
                                + " FROM CHAT_DB"
                                + " WHERE (USER1 = '" + t_user_02
                                + "' OR USER2 = '" + t_user_02 + "')" 
                                + " AND (USER1 = '" + t_user_01
                                + "' OR USER2 = '" + t_user_01 + "')";
            connection.execute(chat_search_query, [], function(err,result){
                // 조회 ERROR 처리
                if(err) {
                    console.log(err.message);
                    return;
                }
                // 룸 결과값
                chat_select_result = result.rows[0];
                // DB 연결 해제
                connection.release(function(err) {
                    if(err) {
                        console.error(err.message);
                    }
                    console.log("db 연결 종료");
                    room = chat_select_result;
                    
                    socket.join(room);
                    
                    socket.emit("JOIN", room)
                }) // connection.release(function(err) { END 
            }) // connection.execute END
        
        });//roomnmfunction문
    });

    // 룸에 있는 채팅 기록 조회
    socket.on('CHAT_LOG', function(data){
        var room_number = data;
        
                oracledb.getConnection({
                    user            : dbConfig.user,
                    password        : dbConfig.password,
                    connectString   : dbConfig.connectString
                },
                function(err,connection) {
                    // DB CONNECT ERROR 
                    if (err){
                        console.error(err.message);
                        return;
                    }
                    let chat_log_search_query = "SELECT NO, CHAT_ID, USERS, MESSAGE,START_DATE"
                                              + " FROM CHAT_MESSAGE_DB"
                                              + " WHERE CHAT_ID = '" + room + "'" 
                                              + " ORDER BY NO ASC";
                    connection.execute(chat_log_search_query, [], function(err,result){
                        // 조회 ERROR 처리
                        if(err) {
                            console.log(err.message);
                            return;
                        }
                        // 룸 결과값
                        chat_log_search_result = result.rows;
                        // DB 연결 해제
                        connection.release(function(err) {
                            if(err) {
                                console.error(err.message);
                            }
                            console.log("db 연결 종료");
                            log = chat_log_search_result;
                            socket.emit("CHAT_LOG2", log)
                            // socket.emit("INIT_UPDATE", log)
                        }) // connection.release(function(err) { END 
                    }) // connection.execute END
                });//roomnmfunction문
    });
    // 메세지 전송이 눌려 졌을 때
    socket.on('SEND', function(data){
        t_user_01 = data.s_user;
        t_user_02 = data.g_user;
        
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let chat_search_query = "SELECT NO"
                                + " FROM CHAT_DB"
                                + " WHERE (USER1 = '" + t_user_02
                                + "' OR USER2 = '" + t_user_02 + "')" 
                                + " AND (USER1 = '" + t_user_01
                                + "' OR USER2 = '" + t_user_01 + "')";
            connection.execute(chat_search_query, [], function(err,result){
                // 조회 ERROR 처리
                if(err) {
                    console.log(err.message);
                    return;
                }
                
                // 룸 결과값
                chat_select_result = result.rows[0];
                // DB 연결 해제
                connection.release(function(err) {
                    if(err) {
                        console.error(err.message);
                    }
                    console.log("db 연결 종료");
                    room = chat_select_result;
                    msg = data.msg;
                    
                    // socket.emit('ROOM_NM', {room, msg});
                    socket.join(room);
                    socket.to(room).emit('SEND', {room,msg});
                }) // connection.release(function(err) { END 
            }) // connection.execute END
        });//roomnmfunction문
    });

    // 메세지 저장
    socket.on('SEND_INS', function(data){
        
        t_user_01 = data.s_user;
        t_user_02 = data.g_user;
        t_msg = data.msg;
        
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let ins_msg = "INSERT INTO CHAT_MESSAGE_DB (NO, CHAT_ID, USERS, MESSAGE, START_DATE)"
                        + " VALUES (CHAT_MESSAGE_DB_NO.NEXTVAL, "
                        + " (SELECT NO"
                        + " FROM CHAT_DB"
                        + " WHERE (USER1 = '" + t_user_02
                        + "' OR USER2 = '" + t_user_02 + "')" 
                        + " AND (USER1 = '" + t_user_01
                        + "' OR USER2 = '" + t_user_01 + "')), '"
                        + t_user_01 + "', '"
                        + t_msg + "', "
                        + " TO_CHAR(SYSDATE, 'YY/MM/DD HH24:MI'))";
                            

            
                connection.execute(ins_msg, [], function(err,result){
                    // 조회 ERROR 처리
                    if(err) {
                        console.log(err.message);
                        return;
                    }
                    // DB 연결 해제
                    connection.release(function(err) {
                        if(err) {
                            console.error(err.message);
                        }
                        console.log("메세지 저장 완료");
                    }) // connection.release(function(err) { END 
                }) // connection.execute END
            
            
        });//roomnmfunction문
    })
    // STATE UPDATE INIT 키자 말자
    socket.on('SEND_UPDATE_INIT', function(data){         
        room = data.room;
                
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let state_update = "UPDATE CHAT_MESSAGE_DB"
                        + " SET STATE = 'Y'"
                        + " WHERE CHAT_ID = '" + room + "'"
                        + " AND USERS = '" + data.g_user + "'";
            
                connection.execute(state_update, [], function(err,result){
                    // 조회 ERROR 처리
                    if(err) {
                        console.log(err.message);
                        return;
                    }
                    // DB 연결 해제
                    connection.release(function(err) {
                        if(err) {
                            console.error(err.message);
                        }
                        console.log("메세지 저장 완료");
                    }) // connection.release(function(err) { END 
                }) // connection.execute END
            
            
        });//roomnmfunction문
    })
    
    // STATE UPDATE
    socket.on('SEND_UPDATE', function(data){
        console.log(data)
        room = data.room;
        console.log(room);
        
        
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let state_update = "UPDATE CHAT_MESSAGE_DB"
                        + " SET STATE = 'Y'"
                        + " WHERE CHAT_ID = '" + room + "'"
                        + " AND USERS = '" + data.g_user + "'";
                        
                connection.execute(state_update, [], function(err,result){
                    // 조회 ERROR 처리
                    if(err) {
                        console.log(err.message);
                        return;
                    }
                    // DB 연결 해제
                    connection.release(function(err) {
                        if(err) {
                            console.error(err.message);
                        }
                        console.log("메세지 상태 업데이트 완료");
                    }) // connection.release(function(err) { END 
                }) // connection.execute END
            
            
        });//roomnmfunction문
    })

    // 룸이 없을 경우 생성하는 부분
    socket.on('ROOM_CREATE', function(data){
        
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let create_room = "INSERT INTO CHAT_DB (NO, USER1, USER2, START_DATE)"
                            + " VALUES (CHAT_ROOM_NM.NEXTVAL,'"
                            + t_user_01 + "' , '"
                            + t_user_02 + "', TO_CHAR(SYSDATE, 'YY/MM/DD HH24:MI'))";
            connection.execute(create_room, [], function(err,result){
                // 조회 ERROR 처리
                if(err) {
                    console.log(err.message);
                    return;
                }
                // DB 연결 해제
                connection.release(function(err) {
                    if(err) {
                        console.error(err.message);
                    }
                    socket.emit('CREATE_JOIN_MIDDLE', {t_user_01, t_user_02});
                    
                }) // connection.release(function(err) { END 
            }) // connection.execute END
        });//roomnmfunction문
    });

    // 방만들고 바로 룸에 들어가게끔
    socket.on('CREATE_JOIN', function(data){
        t_user_01 = data.s_user;
        t_user_02 = data.g_user;
        
        oracledb.getConnection({
            user            : dbConfig.user,
            password        : dbConfig.password,
            connectString   : dbConfig.connectString
        },
        function(err,connection) {
            // DB CONNECT ERROR 
            if (err){
                console.error(err.message);
                return;
            }
            let chat_search_query = "SELECT NO"
                                + " FROM CHAT_DB"
                                + " WHERE (USER1 = '" + t_user_02
                                + "' OR USER2 = '" + t_user_02 + "')" 
                                + " AND (USER1 = '" + t_user_01
                                + "' OR USER2 = '" + t_user_01 + "')";
            connection.execute(chat_search_query, [], function(err,result){
                // 조회 ERROR 처리
                if(err) {
                    console.log(err.message);
                    return;
                }
                // 룸 결과값
                chat_select_result = result.rows[0];
                // DB 연결 해제
                connection.release(function(err) {
                    if(err) {
                        console.error(err.message);
                    }
                    console.log("db 연결 종료");
                    room = chat_select_result;
                    
                    socket.join(room);
                    
                    socket.emit("FINISH_CREAT_JOIN", room)
                }) // connection.release(function(err) { END 
            }) // connection.execute END
        
        });//roomnmfunction문
    });
    socket.on('disconnect', function() {
        socketList.splice(socketList.indexOf(socket), 1);
    });
});
server.listen(port, function() {
    console.log('Server On !');
});