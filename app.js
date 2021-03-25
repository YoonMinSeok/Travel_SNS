var http = require('http'); // 서버를 만드는 모듈 불러옴
var express = require('express');
var fs = require('fs');

var router = express.Router();

// 보안 상의 이유로 브라우저는 CORS를 제한하고 있음
var cors = require('cors');

// DB 
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig');
const { response } = require('express');
const { Console } = require('console'); 

var app = express();

app.use(cors());

// 자동저장
oracledb.autoCommit = true; // 이게 있어야 회원가입 내용이 db에 저장됨

// app.use('/', express.static(__dirname + "/"));

// 8082서버 연결
app.listen(8082, function(){
    console.log("SEVER RUNNING");
});

// 창닫기, 로그아웃 시 state 상태를 Y => N
app.get('/logout', function(req, res) {
    var data = req.query.data;
    var user_id = data.toString().trim();

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
        
        // SQL QUERY
        let state_update = "UPDATE KTISS_USER SET"
                         + " STATE = 'N'"
                         + " WHERE USER_ID = '" + user_id + "'";

        // DB 조회
        connection.execute(state_update, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            // console.log("종료됨");

             // DB 연결 해제
            dbclose(connection); 
        }) // // DB 조회

    } // function(err,connection) END
    ); // oracledb.getConnection( END
    // DB 연결 해제
    function dbclose(connection) {
        connection.release(function(err) {
            if(err) {
                console.error(err.message);
            }

            console.log("연결 종료");
        }) // connection.release(function(err) { END
    } // dbclose END
}) // app.get('/logout', function(req, res) { END


// 로그인 상태 유지 state 상태를 Y 
app.get('/login_maintain', function(req, res) {
    var data = req.query.data;
    var user_id = data.toString().trim();

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
        
        // SQL QUERY
        let state_update = "UPDATE KTISS_USER SET"
                         + " STATE = 'Y'"
                         + " WHERE USER_ID = '" + user_id + "'";

        // DB 조회
        connection.execute(state_update, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }

             // DB 연결 해제
            dbclose(connection); 
        }) // // DB 조회

    } // function(err,connection) END
    ); // oracledb.getConnection( END
    // DB 연결 해제
    function dbclose(connection) {
        connection.release(function(err) {
            if(err) {
                console.error(err.message);
            }

            console.log("연결상태 유지");
        }) // connection.release(function(err) { END
    } // dbclose END
}) // app.get('/login_maintain', function(req, res) { END

// html에서 로그인 버튼 클릭 시 value 값 받아옴
app.get('/login_value', function(req, res) {
    var login_id;
    var state;

    // 아이디, 비밀번호 정보 저장
    var data = req.query.data;
    
    // 아이디, 비밀번호 구분
    var array = data.split(",");

    // 아이디, 비밀번호 저장 변수(공백제거, 문자열형 변환)
    var v_user_id = array[0].toString().trim();
    var v_user_pwd = array[1].toString().trim();

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
        
        let login_query = "select user_id"
                        + " from KTISS_USER"
                        + " where USER_ID = '" + v_user_id
                        + "' AND USER_PWD = '" + v_user_pwd + "'";
        // DB 조회
        connection.execute(login_query, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
            console.log(err.message);
            return;
            }
            // 입력 받은 id와 pwd 같은 데이터가 없을 때
            if(result.rows[0] == undefined) {
                login_id = [""];
                res.send(login_id);
                dbclose(connection);
            } 
            // 입력 받은 id와 pwd와 같은 데이터가 있을 때
            else if(result.rows[0] != undefined){
                login_id = result.rows[0]
                // 로그인 상태를 알아보기 위한 쿼리
                // SQL QUERY (LOGIN)
                let login_state = "select state"
                                + " from KTISS_USER"
                                + " where USER_ID = '" + v_user_id
                                + "' AND USER_PWD = '" + v_user_pwd + "'";
                // DB 조회
                connection.execute(login_state, [], function(err,result){
                    // 조회 ERROR 처리
                    if(err) {
                    console.log(err.message);
                    return;
                    }
                    state = result.rows[0];
                    
                    // 로그인 상태가 아닐 때 
                    if(state == "N") {
                        // SQL QUERY (LOGIN)
                        let state_update = "UPDATE KTISS_USER"
                                         + " SET STATE = 'Y'"
                                         + " where USER_ID = '" + v_user_id
                                         + "'";
                                         // DB 조회
                        connection.execute(state_update, [], function(err,result){
                            // 조회 ERROR 처리
                            if(err) {
                            console.log(err.message);
                            return;
                            }
                            res.send(login_id);
                            dbclose(connection); 
                        }) // connection.execute END
                    } else if (state =="Y"){
                        res.send(state);
                        dbclose(connection); 
                    }

                }) // connection.execute END
            }

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
}); // app.get('/login_value', function(req, res) { END



// html에서 회원가입-가입 버튼 클릭 시 value 값 받아옴
app.get('/join_btn', function(req, res) {
    
    // 아이디, 비밀번호 정보 저장
    var data = req.query.data;

    // 아이디, 비밀번호, 이름, 주민등록번호, 폰번호 구분
    var array = data.split(",");

    // 주민등록번호 (-제거) 값 저장
    var jumin = array[3].split("-");
    
    // 폰번호 (-제거) 값 저장
    var phone = array[4].split("-");
    
    // 아이디, 비밀번호, 이름, 주민등록번호, 폰번호저장 변수(공백제거, 문자열형 변환)
    var v_user_id = array[0].toString().trim();
    var v_user_pwd = array[1].toString().trim();
    var v_user_name = array[2].toString().trim();
    var v_user_f_jumin = jumin[0].toString().trim();
    var v_user_b_jumin = jumin[1].toString().trim();
    var v_user_phone1 = phone[0].toString().trim();
    var v_user_phone2 = phone[1].toString().trim();
    var v_user_phone3 = phone[2].toString().trim();



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
        
        // SQL QUERY (JOIN)
        let insert_query = "INSERT INTO KTISS_USER"
                        + "(USER_ID, USER_PWD, NAME, JUMIN, PHONE)"
                        + " VALUES('" + v_user_id
                        + "','" + v_user_pwd 
                        + "','" + v_user_name
                        + "','" + v_user_f_jumin
                        + "-" + v_user_b_jumin 
                        + "','" + v_user_phone1
                        + "-" + v_user_phone2
                        + "-" + v_user_phone3 + "')";

        // DB 입력
        connection.execute(insert_query, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                res.send('0');//회원가입실패시
                return;
            }
        
            res.send('1');//회원가입 성공시
            // DB 연결 해제
            dbclose(connection); 

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
}); // app.get('/join_btn', function(req, res) { END

//winmap 마커 찍는곳
app.get('/marker_select', function(req, res) {
    // 아이디, 스토리,먹거리,볼거리
    let search_all;
    var data = req.query.data;

    // 아이디,스토리,먹거리,볼거리
    var array = data.split(",");

    var s_user_id = array[0].toString().trim();//아이디
    var s_story = array[1].toString().trim();//스토리
    var s_eat = array[2].toString().trim();//먹거리
    var s_see = array[3].toString().trim();//볼거리
   
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
        
        
        if(s_story == 0){
            if(s_eat == 1 && s_see  == 1){
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " WHERE USER_ID = '" + s_user_id + "'"
            }else if(s_eat == 1){
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " WHERE USER_ID = '" + s_user_id + "'"
                + " AND CATEGORY = '" + "먹거리" + "'"
                + " ORDER BY 1";
            }else if(s_see == 1){                
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " WHERE USER_ID = '" + s_user_id + "'"
                + " AND CATEGORY = '" + "볼거리" + "'"
                + " ORDER BY 1";
            }
        }else if(s_story == 1) {
            if(s_eat == 1 && s_see  == 1){
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " ORDER BY 1";
            }else if(s_eat == 1){
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " WHERE CATEGORY = '" + "먹거리" + "'"
                + " ORDER BY 1";
            }else if(s_see == 1){
                search_all= "SELECT DISTINCT WIDO,GYEONGDO,CATEGORY"
                + " FROM KTISS_CONTENTS"
                + " WHERE CATEGORY = '" + "볼거리" + "'"
                + " ORDER BY 1";
            }
                
        }
  
        // DB 조회
        connection.execute(search_all, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var contentdata = result.rows;
            
            // // html로 결과값 전달
             res.send(contentdata);

            // DB 연결 해제
            dbclose(connection); 

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
}); // app.get('/select_all', function(req, res) { END

//마커 클릭하면 일어나는것
app.get('/marker_click', function(req, res) {
    // 위경도
    var data = req.query.data;

    // 위경도 자르기
    var array = data.split(",");

    var wdo = array[0].toString().trim();//위도
    var gdo = array[1].toString().trim();//경도

   
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
        
        var search_all= "SELECT USER_ID,PICTURE,TITLE, CONTENT, INS_DAY , NOTICE_KEY, VIEWS"
                  + " FROM KTISS_CONTENTS"
                  + " WHERE WIDO = '" + wdo + "'"
                  + " AND GYEONGDO = '" + gdo + "'"
                  + "ORDER BY VIEWS DESC";
            

        // DB 조회
        connection.execute(search_all, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var notice_data = result.rows;
            
            // // html로 결과값 전달
             res.send(notice_data);

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/marker_click', function(req, res) { END




// // winContent 저장/수정 버튼
app.get('/content_save', function(req, res) {
    
    // 아이디, 비밀번호 정보 저장
    var data = req.query.data;
    console.log(data)
    // 아이디,그림,제목,카테고리,내용,위도,경도,쓴날짜
    var array = data.split(",");

    // 쿼리문 저장
    let query;
    


    // 수정/저장 구분,아이디,글번호,그림,제목,카테고리,내용,위도,경도,쓴날짜
    var c_i_u = array[0].toString().trim();
    var c_user_id = array[1].toString().trim(); 
    var c_notice_key = array[2].toString().trim();
    var c_user_picture = array[3].toString().trim();
    var c_user_title = array[4].toString().trim();
    var c_user_category = array[5].toString().trim();
    var c_user_content = array[6].toString().trim();
    var c_user_wido = array[7].toString().trim();
    var c_user_gyeongdo = array[8].toString().trim();
    // var c_user_id = array[6].toString().trim(); 
    // var c_notice_key = array[7].toString().trim();

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
        
        // SQL QUERY (INSERT OR UPDATE)
        if(c_i_u == 0){
            query = "INSERT INTO KTISS_CONTENTS"
            + "(NOTICE_KEY, USER_ID, PICTURE, TITLE, CATEGORY,CONTENT,WIDO,GYEONGDO,INS_DAY)"
            + " VALUES( contents_seq.nextval" 
            + ",'" + c_user_id
            + "','" + c_user_picture 
            + "','" + c_user_title
            + "','" + c_user_category 
            + "','" + c_user_content
            + "','" + c_user_wido
            + "','" + c_user_gyeongdo
            + "',TO_CHAR(SYSDATE, 'yyyy-MM-dd'))";
        } else if (c_i_u == 1){
            query = "UPDATE KTISS_CONTENTS SET"
            + " PICTURE = '" + c_user_picture 
            + "', TITLE = '" + c_user_title
            + "', CATEGORY= '"  + c_user_category 
            + "', CONTENT= '" + c_user_content
            + "', UPD_DAY= TO_CHAR(SYSDATE, 'yyyy-MM-dd')"
            + " WHERE NOTICE_KEY = '" + c_notice_key + "'"
        } else if (c_i_u == 2){
            query = "INSERT INTO KTISS_CONTENTS"
            + "(NOTICE_KEY, USER_ID, PICTURE, TITLE, CATEGORY,CONTENT,WIDO,GYEONGDO,INS_DAY)"
            + " VALUES( contents_seq.nextval" 
            + ",'" + c_user_id
            + "','" + c_user_picture 
            + "','" + c_user_title
            + "','" + c_user_category 
            + "','" + c_user_content
            + "','" + c_user_wido
            + "','" + c_user_gyeongdo
            + "',TO_CHAR(SYSDATE, 'yyyy-MM-dd'))";
        }
        else {
            query = "INSERT INTO KTISS_CONTENTS"
            + "(NOTICE_KEY, USER_ID, PICTURE, TITLE, CATEGORY,CONTENT,WIDO,GYEONGDO,INS_DAY)"
            + " VALUES( contents_seq.nextval" 
            + ",'" + c_user_id
            + "','" + c_user_picture 
            + "','" + c_user_title
            + "','" + c_user_category 
            + "','" + c_user_content
            + "','" + c_user_wido
            + "','" + c_user_gyeongdo
            + "',TO_CHAR(SYSDATE, 'yyyy-MM-dd'))";
        }


        // DB 입력
        connection.execute(query, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                res.send('0');//INSERT 실패시
                return;
            }
        
            res.send('1');//INSERT 성공시
            // DB 연결 해제
            dbclose(connection); 

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
}); // app.get('/content_save', function(req, res) { END



// 삭제버튼 클릭 시 호출
app.get('/content_delete', function(req, res) {
    // 로그인 아이디
    var data = req.query.data;

    var c_notice_key = data.toString().trim();// notice_key

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
        
        // SQL QUERY (ALL)
        let content_delete = "DELETE FROM KTISS_CONTENTS"
                         + " WHERE NOTICE_KEY = '" 
                         + c_notice_key + "'";

        // DB 조회
        connection.execute(content_delete, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var contentdata = result.rows;

            // // html로 결과값 전달
            res.send('1');//delete 성공시

            // DB 연결 해제
            dbclose(connection); 



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
}); // app.get('/content_delete', function(req, res) { END

// 

// 

// 내가 올린것만 받아옴
app.get('/my_marker_select', function(req, res) {
    // 로그인 아이디
    var data = req.query.data;

    var s_user_id = data.toString().trim();//아이디

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
        
        // SQL QUERY (ALL)
        let my_seach_all = "SELECT *"
                         + " FROM KTISS_CONTENTS"
                         + " WHERE USER_ID = '" 
                         + s_user_id + "'"
                         + " ORDER BY 1";

        // DB 조회
        connection.execute(my_seach_all, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var contentdata = result.rows;

            // // html로 결과값 전달
             res.send(contentdata);

            // DB 연결 해제
            dbclose(connection); 



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
}); // app.get('/my_marker_select', function(req, res) { END


//게시판 선택 이벤트
app.get('/notice_select', function(req, res) {
    // notice_key
    var nk = req.query.data;
    
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
        
        //조회수 쿼리
        let notice_update = "UPDATE KTISS_CONTENTS SET"
                            + " VIEWS = VIEWS + 1"
                            + " WHERE NOTICE_KEY = '" +nk + "'";
        
        // DB 조회수 업데이트
        connection.execute(notice_update, function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            

        }) // DB 조회수 업데이트

        
        // SQL QUERY
        let my_notice = "SELECT *"
                         + " FROM KTISS_CONTENTS"
                         + " WHERE NOTICE_KEY = '" +nk + "'";

        // DB 조회
        connection.execute(my_notice, [], function(err,result){
            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var contentdata = result.rows;
            // // html로 결과값 전달
             res.send(contentdata);

             // DB 연결 해제
            dbclose(connection); 
        }) // // DB 조회

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
}); // app.get('/notice_select', function(req, res) { END


// 컨텐츠에서 마커 클릭하면 일어나는것
app.get('/c_marker_click', function(req, res) {
    // 위경도
    var data = req.query.data;

    // 위경도 자르기
    var array = data.split(",");

    var wdo = array[0].toString().trim();//위도
    var gdo = array[1].toString().trim();//경도
    var user_id = array[2].toString().trim();//아이디

   
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
        
        var search_all= "SELECT USER_ID,PICTURE,TITLE, CONTENT, INS_DAY , NOTICE_KEY, VIEWS"
                  + " FROM KTISS_CONTENTS"
                  + " WHERE WIDO = '" + wdo + "'"
                  + " AND GYEONGDO = '" + gdo + "'"
                  + " AND USER_ID = '" + user_id + "'"
                  + " ORDER BY NOTICE_KEY DESC";
            

        // DB 조회
        connection.execute(search_all, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var notice_data = result.rows;
            
            // // html로 결과값 전달
             res.send(notice_data);

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/c_marker_click', function(req, res) { END

// 채팅리스트 뽑아오기
app.get('/chat_list', function(req, res) {
   
    var loginid = req.query.data;
   
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
        
        var chat_alllist= "SELECT NO,USER2 AS OPPONENT"
                        + " FROM CHAT_DB" 
                        + " WHERE TRIM(USER1) = '" + loginid + "'" 
                        + " UNION ALL"
                        + " SELECT NO,USER1 AS OPPONENT"
                        + " FROM CHAT_DB"
                        + " WHERE TRIM(USER2) = '" + loginid + "'";

        // DB 조회
        connection.execute(chat_alllist, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var chat_data = result.rows;
            
            // html로 결과값 전달
            res.send(chat_data);
             
            //  여기부터

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/chat_list', function(req, res) { END


// 마지막 채팅 뽑아오기
app.get('/last_chat', function(req, res) {
   
    var chat_id = req.query.data;

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
        
        var l_chat_message= "SELECT MESSAGE"
                 +" FROM (SELECT MESSAGE FROM CHAT_MESSAGE_DB WHERE CHAT_ID = '"+ chat_id +"' ORDER BY NO DESC)"
                 +" WHERE ROWNUM= 1";
        

        // DB 조회
        connection.execute(l_chat_message, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var l_message = result.rows;
            
            // // html로 결과값 전달
             res.send(l_message);
             

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/last_chat', function(req, res) { END

// 안읽은 채팅 갯수 뽑아오기
app.get('/no_read_cnt', function(req, res) {
//    기모띠
    var data = req.query.data;
    var arr = data.split(',')
    var chat_id = arr[0];
    var user = arr[1];
    
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
        
        var chat_state = "SELECT COUNT(STATE)"
                +" FROM CHAT_MESSAGE_DB"
                +" WHERE CHAT_ID = '" + chat_id + "'"
                +" AND STATE = 'N'"
                +" AND USERS != '" + user + "' GROUP BY CHAT_ID";        
        
        // DB 조회
        connection.execute(chat_state, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            
            var no_read_message_cnt = result.rows;
            
            // // html로 결과값 전달
             res.send(no_read_message_cnt);
             

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/no_read_cnt', function(req, res) { END

// 방 번호 찾기
app.get('/search_room', function(req, res) {
   
    var data = req.query.data;
    
    var arr = data.split(',');
    var t_user_01 = arr[0];
    var t_user_02 = arr[1];

    
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
        var chat_search_query = "SELECT NO"
                                + " FROM CHAT_DB"
                                + " WHERE (USER1 = '" + t_user_02
                                + "' OR USER2 = '" + t_user_02 + "')" 
                                + " AND (USER1 = '" + t_user_01
                                + "' OR USER2 = '" + t_user_01 + "')";   

        // DB 조회
        connection.execute(chat_search_query, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            // var total =[t_user_01.toString() + ',' + t_user_02.toString() +',' + result.rows[0]];
            var total = result.rows[0];
            total.push(t_user_01)
            total.push(t_user_02)
            
            res.send(total);

            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/search_room', function(req, res) { END

// 채팅방 켰을때 state N=>Y 
app.get('/update_no_read_state', function(req, res) {
   
    var data = req.query.data;
    // console.log(data[0])
    // console.log(data[1])
    // console.log(data[2])

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
        var update_state = "UPDATE CHAT_MESSAGE_DB"
                         + " SET STATE = 'Y'"
                         + " WHERE CHAT_ID ='" + data[0] + "'"
                         + " AND USERS != '" + data[1] + "'";        

        // DB 조회
        connection.execute(update_state, [], function(err,result){

            // 조회 ERROR 처리
            if(err) {
                console.log(err.message);
                return;
            }
            res.send("성공")
            // DB 연결 해제
            dbclose(connection); 

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

}); // app.get('/update_no_read_state', function(req, res) { END




