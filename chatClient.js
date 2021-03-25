window.onload = function(){ 
    //클라이언트 소켓 생성
    var socket = io.connect('http://192.168.0.51:5000/');
    //DOM 참조
    var div = document.getElementById('message');
    var txt = document.getElementById('txtChat');
    //텍스트 박스에 포커스 주기 
    txt.focus();
    
    //텍스트 박스에 이벤트 바인딩
    txt.onkeydown = sendMessage.bind(this); 
    function sendMessage(event){     
     if(event.keyCode == 13){
      //메세지 입력 여부 체크   
      var message = event.target.value;
      if(message){
        //소켓서버 함수 호출  
        socket.emit('serverReceiver', message);
        //텍스트박스 초기화
        txt.value = '';
      }
     }
    };
    
    //클라이언트 receive 이벤트 함수(서버에서 호출할 이벤트)
    socket.on('clientReceiver', function(data){  
      //console.log('서버에서 전송:', data);   
      //채팅창에 메세지 출력하기
      var message = '['+ data.clientID + '님의 말' + '] ' + data.message;
      div.innerText += message + '\r\n';
      //채팅창 스크롤바 내리기  
      div.scrollTop = div.scrollHeight;   
    });
   };