var socket_io = require('socket.io-client'),//socket.io-client模块(不要浏览器的)
	sqlite3 = require('sqlite3');//数据库模块

var db = new sqlite3.Database('db.sqlite3');//连接数据库

//var socket = socket_io.connect('http://localhost/');
var socket = socket_io.connect('https://localhost/');
//因为服务器端用的是port80(http)或443(https);这个函数似不可带回调

socket.on('error', function(reason) { //抓取错误信息
    console.log(reason);
});

socket.on('connect', function() {
	console.log('Client Connected to Server');
});
//显示断线
socket.on('disconnect',function() {    	
    	console.log('Disconnected from Server')
})

//获得所有既存的table名(sqlite_sequence是一个自动生成的table，不要动他)
socket.on('get_table_name', function(id) {
	db.all("SELECT name FROM sqlite_master WHERE type='table' AND name!='sqlite_sequence' order by name;",
		function(err,res){
		var sendMsg;
		if (!err) {
			sendMsg = res;
		}else{
			sendMsg = err;
		}
		socket.emit('table_name',sendMsg,id);
		console.log(sendMsg[0].name+" has been send");
	});
});

//获取db数据并发送至服务器端
socket.on('get_db_data',function(table_name,id){
	//console.log("get_db_data")
	db.all("SELECT * FROM "+table_name+" ;",function(err,res){ //这边会给一个类似JSON的东西
    	if (!err) {
    		socket.emit('db_data',res,id);
    	}else{console.log(err,id)}
	});    
});


function send (data1,data2) {
	//向服务器端发送数据
	socket.emit('foo', data1, data2);//这个函数似不可以带回调
}

function Receive(){
	//接收服务器端数据
	socket.on('answer', function (ans) {  
	    console.log('I received '+ans);
	    var now = new Date();//取得系统时间
	    //var theTimeNow=now.toLocaleString();//获取例“2015-12-25 17:24:28”,SQlite只认这个
	    //var theTimeNow=now.toUTCString();//Wed, 06 Jan 2016 03:13:04 GMT
	    //var theTimeNow=now;//Wed Jan 06 2016 12:22:04 GMT+0900 (东京标准时间)
	    var timeNowISO = now.toISOString();//2016-01-06T04:38:02.561Z
	    var theTimeNow=timeNowISO.split('T')[0]+" "+timeNowISO.split('T')[1].split('Z')[0];
	    console.log("time: "+theTimeNow);//2016-01-06 04:41:13.636
	    //向db插入数据
	    //db.run("INSERT INTO test_table (data,time) VALUES (?,?)",ans,theTimeNow);

	    //获取db数据的测试
	    //db.get("SELECT datetime('now');",function(err,res){
	    db.all("SELECT * FROM test_table;",function(err,res){ //这边会给一个类似JSON的东西
	    	if (!err) {
	    		for (var i in res) {
	    			console.log(res[i].id+":"+res[i].data+","+res[i].time);
	    		};	
	    	}else{console.log(err)}
	    });    
	});
}

send(9,12);
Receive();
//db.run("INSERT INTO test_table (data) VALUES (?)",answer);

//以下是用来测试延时函数用的

function send_aaa (data) {
	console.log(data);
}

//setTimeout(send_aaa('aaa'),15000);//这个写法会导致无法延时直接执行

/*//这个函数是延时并执行一次
setTimeout(function(){
	//console.log('aaa');
	sendAndReceive(12,16);
	send_aaa('bbb');
},1500);*/

/*//这个函数是延时并循环执行
setInterval(function(){
	//console.log('aaa');
	send_aaa('bbb');
	
},1500);*/
 
