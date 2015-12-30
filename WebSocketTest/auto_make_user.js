// ライブラリ読み込み
var pg = require('pg');

// 接続設定 下のような構成で記述する 
// tcp://ユーザー:パスワード@IPアドレス:ポート番号/データベース
var connectionString = "tcp://user1:password@localhost:5432/test";

// pg.connect(接続先, コールバック関数)
pg.connect(connectionString, function(err, client){

    // client.query(SQL, コールバック関数)
    client.query("SELECT id, name FROM test ", function(err, result){

        // errにはerrorが発生した場合の情報が格納される
        // resultに取得したデータが格納される
        // 取得したデータ件数を表示する
        console.log("Result:" + result.rows.length);

        // 取得したデータの詳細を表示する
        for(i=0; i < result.rows.length; i++){
            console.log("id=" + result.rows[i].id +" name=" + result.rows[i].name);
        }
    });
});
