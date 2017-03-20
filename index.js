var fs = require('fs');
var rdbpool = require('rethinkdb-pool');
var r = require('rethinkdb');
var Tail = require('tail').Tail;
var parse = require('unifi-video-log-parser');

var caCert = fs.readFileSync(__dirname + '/cacert');

var database_config = {
    host: 'rethinkdb',
    user: 'admin',
    password: '',
    db: 'unifi',
    max: 5,
    ssl: {
        rejectUnauthorized: false,
        ca: caCert
    }
};

var pool = new rdbpool(database_config);

tail = new Tail('/var/log/unifi-video/recording.log');

tail.on("line", function lineEvent(line) {
    var event = parse(line);
    var query = r.table('events').insert(event);

    pool.run(query, function(err, cursor) {
        if (err) throw err;
    });
});

tail.on("error", function(error) {
    throw error;
});
