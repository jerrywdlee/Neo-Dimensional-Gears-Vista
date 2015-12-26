var express = require('express'), //引入express模块
    app = express(),
    server = require('http').createServer(app);
    io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
app.use('/', express.static(__dirname + '/www')); //指定静态HTML文件的位置

server.listen(80,function (req, res) {
  console.log('app is running at port 80');
});

function getLeg(leg1,leg2){
	return Math.sqrt(leg1*leg1+leg2*leg2);//用勾股计算弦长
}

//socket部分
io.on('connection', function(socket) {
    //接收并处理客户端发送的foo事件
    console.log('Socket.io listen at port 80')
    socket.on('foo', function(data1,data2) {
        //将消息输出到控制台
        console.log('a='+data1);
        console.log('b='+data2);
        var ans=getLeg(data1,data2);
        console.log('c='+ans);
        socket.emit('answer',ans);//向前端发送'answer'事件
    });
    socket.on('disconnect',function() {
    	//显示断线
    	console.log('User disconnected')
    })
});

