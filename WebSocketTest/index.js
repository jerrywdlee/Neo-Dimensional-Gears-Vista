var fs = require('fs'), //读取RSA加密证书用的文件读取模块
    rsa_options = {
        key: fs.readFileSync('./openssl_keys/server_key.pem'), //SSL密钥路径 
        cert: fs.readFileSync('./openssl_keys/server_crt.pem') //SSL证书路径
    };

var express = require('express'), //引入express模块
    app = express(),
    //server = require('http').createServer(app);
    server = require('https').createServer(rsa_options, app); //使用https连接
    io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
app.use('/', express.static(__dirname + '/www')); //指定静态HTML文件的位置

//server.listen(80,function (req, res) {
server.listen(443,function (req, res) { //https的默认端口是443
  //console.log('app is running at port 80');
  console.log('app is running at port 443');
});

function getLeg(leg1,leg2){
	return Math.sqrt(leg1*leg1+leg2*leg2);//用勾股计算弦长
}

//socket部分
io.on('connection', function(socket) {
    //接收并处理客户端发送的foo事件
    var ip = socket.handshake.address; //获取客户端IP地址
    console.log('Connected to '+ip);//在控制台显示连接上的客户端ip

    //当传来foo事件的时候，计算并输出
    socket.on('foo', function(data1,data2) {
        //将消息输出到控制台
        console.log('a='+data1);
        console.log('b='+data2);
        var ans=getLeg(data1,data2);
        console.log('c='+ans);
        socket.emit('answer',ans);//向前端发送'answer'事件
    });

    //当传来require_table_name事件时，广播至所有其他客户端
    //io.sockets.emit('foo')则会将自己也包括在广播对象之内
    socket.on('require_table_name',function(){
        socket.broadcast.emit('get_table_name');
    });
    //接收到客户端传来的table名
    socket.on('table_name',function(res){
        //向有效客户端发送收到的东西
        socket.broadcast.emit('table_name_receive',res);
        console.log(res);
    });

    //当请求DB数据时
    socket.on('require_db_data',function(table_name){
        socket.broadcast.emit('get_db_data',table_name);
    });
    //当数据传来时
    socket.on('db_data',function(res){
        //广播数据
        socket.broadcast.emit('db_data_receive',res);
        //console.log(res);
    })

    //显示断线
    socket.on('disconnect',function() {    	
    	console.log('User disconnected')
    })
});

