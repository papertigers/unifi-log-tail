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
    try {
        var event = parse(line);
        var query = r.table('events').insert(event);

        pool.run(query, function(err, cursor) {
            /*
             * This is designed to be fire and forget.  If rethink is down or has
             * not started yet we shouldn't crash the program.  Instead we will
             * log the error.  Its up to the user to monitor log files and or
             * provide their own health checking.
            */
            // TODO: wire up bunyan logger
            if (err) console.log(err);
        });
    } catch (err) {
        // Unknown log event, safe to ignore
        // To monitor logs without events:
        // console.log(VError.info(err);
    }
});

tail.on("error", function(error) {
    throw error;
});
