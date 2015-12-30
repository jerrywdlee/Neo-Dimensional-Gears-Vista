var pg = require('pg'),
	jsSHA = require("jssha"),
	fs = require('fs');
	//init_users=require('./users.json');//该写法会造成内存泄漏

var init_users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));

// 接続設定 下のような構成で記述する 
// tcp://ユーザー:パスワード@IPアドレス:ポート番号/データベース
var connectionString = "postgres://user1:password@localhost:5432/test";
var client = new pg.Client(connectionString);

//console.log(init_users.users[1].name+init_users.users[1].password );
//console.log(init_users.table_name);
//process.exit();//关闭这个进程

// pg.connect(接続先, コールバック関数)
client.connect(function(err){
	if (err) {
		return console.error('could not connect to postgres', err);
	};
	//先删除可能存在的旧table;SQL语句后的分号可要可不要
	client.query("DROP TABLE "+init_users.table_name,function(err, result){
		if (err) {
			return console.error('could not delete', err);
		};
	});

	//postgres没有auto_increment方法,取而代之的是serial型;SHA256是64文字定常的
	client.query("CREATE TABLE "+init_users.table_name+" (id SERIAL PRIMARY KEY, name VARCHAR(20), password CHAR(64) , type VARCHAR(10));",
		function(err, result){
		if (err) {
			return console.error('could not Created', err);
		};
        console.log("Table "+init_users.table_name+" Created");
        createUsers(init_users);//table创建成功后，写入users   
    });
});

setTimeout(function(){
	//启动15s之后自动结束
	console.log('App shutting down');
	client.end();//关闭数据库连接
	process.exit();//关闭这个进程
},1500);

function createUsers (init_users) {
	for (var i in init_users.users) {
		var shaObj = new jsSHA("SHA-256", "TEXT");
		shaObj.update(init_users.users[i].password);
    	var hash = shaObj.getHash("HEX");
    	console.log("Creating "+init_users.users[i].name);
		client.query("INSERT INTO user_info (name,password,type) VALUES ($1,$2,$3);",//注意写法
			[init_users.users[i].name,hash,init_users.users[i].type],function(err, result){
			if (err) {
				return console.error('could not created records', err);
			};
			//console.log("User "+init_users.users[i].name+" Created"); //这边始终都是最后一个
   		});
	};
}