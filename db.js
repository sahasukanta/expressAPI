const Pool = require('pg').Pool;
const pool = new Pool({
    connectionString: 'postgresql://my_lego:lego_password@localhost/lego401',
    ssl: false
    // user: "postgres",
    // password: "00000",
    // database: "lego401",
    // host: "localhost",
    // port: 5432
})

module.exports = pool;
