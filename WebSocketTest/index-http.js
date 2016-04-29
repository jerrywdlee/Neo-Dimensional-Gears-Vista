var fs = require('fs'), //读取RSA加密证书用的文件读取模块
    rsa_options = {
        key: fs.readFileSync('./openssl_keys/server_key.pem'), //SSL密钥路径
        cert: fs.readFileSync('./openssl_keys/server_crt.pem') //SSL证书路径
    },
    init_users = JSON.parse(fs.readFileSync('./users.json', 'utf8')),
    login_table_name = init_users.table_name;//读取初始化json的信息


var jsSHA = require("jssha");//sha加密模块
//var pg = require('pg');//postgres数据库模块
var connectionString = "postgres://user1:password@localhost:5432/test";
/*
var client = new pg.Client(connectionString);//登入数据库
    client.connect(function(err){
        if (err) {
            return console.error('could not connect to postgres', err);
        };
        console.log("connect to db")
    });*/

var express = require('express'), //引入express模块
    app = express(),
    server = require('http').createServer(app);
    //server = require('https').createServer(rsa_options, app); //使用https连接
    io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
app.use('/', express.static(__dirname + '/www')); //指定静态HTML文件的位置

server.listen(80,function (req, res) {
//server.listen(443,function (req, res) { //https的默认端口是443
  console.log('app is running at port 80');
  //console.log('app is running at port 443');
});

var userIdType = {};//新建一个储存id与用户权限的哈希表


//socket部分
io.on('connection', function(socket) {
    //接收并处理客户端发送的foo事件
    //var address = socket.handshake.address.address; //获取客户端IP地址,含有port信息,0.9.x的用法
    //var ip = address.address||socket.handshake.headers['x-forwarded-for'];//利用X-Forwarded-For取得真实ip(不好用)
    //console.log('Connected to '+address);//在控制台显示连接上的客户端ip
    var clientIp = socket.request.connection;//1.0.4的用法
    var ip = clientIp.remoteAddress, port = clientIp.remotePort;//这里的ip是v4和v6的混合,"::ffff:192.168.11.14"
    if (ip.indexOf(":")!=-1) {
        var ip_v4 = ip.split(":")[ip.split(":").length-1]+':'+port;
    }else{
        var ip_v4 = ip+':'+port
    }
    //var ip_v4 = ip.split(":");
    console.log('Connected to '+ip_v4);//在控制台显示连接上的客户端ipv4

    /*var global_ip = "";
    socket.on('global_ip',function(get_global_ip){
        global_ip = get_global_ip;
    });*/

    var id = socket.id;
    //console.log("id = "+socket.id);//显示连上的用户的id

    //连接上的同时新增一个角色
    if(!userIdType[id]){
        userIdType[id]={};
        userIdType[id].local_ip=ip_v4;
        userIdType[id].network_delay="";
        //userIdType[id].global_ip=global_ip;
        /*
        userIdType[id].login_name="";
        userIdType[id].company="";
        userIdType[id].authority="";*/
    }


    /*
    socket.on('log_in',function(userName,hash,ip){
        //服务器端加密用的这个函数只是为了测试
        //var shaObj = new jsSHA("SHA-256", "TEXT");
        //shaObj.update("password");
        //var hash2 = shaObj.getHash("HEX");
        //console.log(userName);
        //看看是不是能以加密方式保存密码
        //console.log("pw1: "+hash);
        //console.log("pw2: "+hash2);
        //console.log(hash===hash2);
        console.log(userName+ ip);
        //记录login的名字和global IP
        userIdType[id].login_name=userName;
        userIdType[id].global_ip=ip;

        //login的逻辑
        var pwInDb = null;
        //$1 这种写法能防止SQL注入
        client.query("SELECT password,type FROM "+login_table_name+" WHERE name = $1",[userName],
        function(err, result){
            if (err) {
                return console.error('No such user', err);
            };
            try{
                pwInDb = result.rows[0].password;//预防会取到多个行的情况
            }catch(e){
                //console.log(e);
                return emitError(socket,"no_user");//socket是里面的东西
            }
            //console.log(pwInDb===hash&&pwInDb!=null);//防止有人用null来绕开结构
            //hash="0||true";//注入无法得逞
            //console.log(pwInDb===hash);
            //console.log(hash);
            if (pwInDb===hash&&pwInDb!=null) {
                //如果不存在该用户，则在哈希表中加入该用户
                if(userIdType[id]){
                    userIdType[id].authority=result.rows[0].type;//存储在postgres当中的权限
                    socket.emit('login_succeed');
                }else{
                    emitError(socket,"unknow");
                }
            }else{
                return emitError(socket,"pw_wrong");
            };
            console.log(userIdType);//最终这里将向一个表单记录login的时间,ip和用户名
        });
    });*/

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
    //同时，在emit之前加上.to(id)则能向特定对象发送信息(两种写法都可以)
    socket.on('require_table_name',function(){
        console.log(id);
        if (userIdType[id].authority==="admin") {
            socket.broadcast.emit('get_table_name',id);//只有admin有权广播请求,把id作为tag一同广播
        }else{
            emitError(socket,"no_permit");//其他用户则报错
        };
    });
    //接收到客户端传来的table名
    socket.on('table_name',function(res,id_tag){
        //向有效客户端发送收到的东西
        //socket.broadcast.emit('table_name_receive',res);
        /*
        for (var id_i in userIdType) {
            if (userIdType[id_i]==="admin") { //只向admin权限的用户广播
                io.sockets.to(id_i).emit('table_name_receive',res);
            };
        };*/
        if (userIdType[id_tag].authority==="admin") {
            io.sockets.to(id_tag).emit('table_name_receive',res);
        };
        console.log(res);
    });

    //当请求DB数据时
    socket.on('require_db_data',function(table_name){
        if (userIdType[id].authority==="admin") {
            socket.broadcast.emit('get_db_data',table_name,id);//只有admin有权广播请求,把id作为tag一同广播
        }else{
            emitError(socket,"no_permit");//其他用户则报错
        };

    });
    //当数据传来时
    socket.on('db_data',function(res,id_tag){
        //广播数据
        //socket.broadcast.emit('db_data_receive',res);
        //console.log(res);
        /*for (var id_i in userIdType) {
            if (userIdType[id_i]==="admin") { //只向admin权限的用户广播
                io.sockets.to(id_i).emit('db_data_receive',res);
            };
        };*/
        if (userIdType[id_tag].authority==="admin") { //只向admin权限的用户广播
            io.sockets.to(id_tag).emit('db_data_receive',res);
        };

    })
    /***** here is for test ultra dimensional ***/
    socket.on('instr_status',function(instr_list) {
        console.log(instr_list)
    })

    //socket.emit('local_admin_page');

    //socket.on('local_admin_page',function(data) {
        //it will return buffer
        //console.log(data.toString());
    //})

    /*****  ****/
    //显示延迟
    /*
    socket.on('ping',function(time_ui){
        var timeServer = Date.now();
        socket.emit('pong',timeServer,time_ui);
    })*/

    //测试网络延迟的函数群
    var startTime= Date.now();//第一次ping
    socket.emit('ping');
    var if_pinged = true;//检查是否完成一个ping-pong循环
    setInterval(function(){
        startTime= Date.now();
        //console.log(startTime);
        socket.emit('ping',startTime);
        if (if_pinged&&userIdType[id]) {
                userIdType[id].network_delay="";
        }
        if_pinged=true;
    },8000);
    socket.on('pong_client',function(data){
        console.log("ponged"+data)
        console.log(Date.now()-data);
        if (if_pinged==true) {
            var endTime = Date.now();
            var latency = endTime-startTime;
            console.log("id:"+id+ " delay:"+latency);
            userIdType[id].network_delay=latency;
            socket.emit('delay',latency);
        };
        if_pinged=false;
    })
    socket.on('push_raw_data',function (data) {
      console.log(data.toString());
    })
    socket.emit('unpushed_num');
    socket.on('sum_unpushed',function (num) {
      console.log('Total '+num+' Records Unpushed');
    })
    socket.emit('force_push',5);
    socket.on('return_force_push',function (data) {
      console.log(JSON.parse(data));
      var num = JSON.parse(data).length
      console.log(num +" Records uploaded");
      socket.emit('unpushed_num');
    })
    socket.emit('reg');
    console.log("reg");
    socket.on('reg_log',function (res) {
      console.log(res)
    })
    /*
    socket.on('test',function() {
        console.log("aaa");
    })*/
    /*
    socket.on('pong',function(startTime) {
        /*
        console.log("ponged");
        var endTime = Date.now();
        var latency = endTime-startTime;
        console.log(id+ " delay:"+latency)
        socket.emit('delay',latency);
        userIdType[id].network_delay=latency;
        console.log(userIdType)
        if_pinged=false;//完成了一个循环
    });*/

    //显示断线
    socket.on('disconnect',function() {
    	console.log('User id='+id+' disconnected');
        if(userIdType[id]){
            delete userIdType[id];//退出时删除该用户
        }
        console.log(userIdType);
    });
    
    //god_hand test
    console.log("god_hand");
    socket.emit('god_hand','SHOW',"SELECT * FROM sqlite_master")
    socket.on('god_hand_return',function (data) {
      console.log("[God Hand]\n"+data+"\n[God Hand End]");
    })
});


function getLeg(leg1,leg2){
    return Math.sqrt(leg1*leg1+leg2*leg2);//用勾股计算弦长
}

function emitError (socket, errorType) {
    // 发送错误码
    socket.emit('error_type',errorType);
}
