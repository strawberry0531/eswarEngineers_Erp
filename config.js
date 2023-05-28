
// TODO: https://github.com/motdotla/dotenv to hide credentials

const db_config = {
    db: {
        host: "localhost",
        user: "vmanicka",
        password: "12345",
        database: "eswar_engineers"
    }
}

const app_port = {
    port: 3000
}
module.exports = {
    db_config,
    app_port
};