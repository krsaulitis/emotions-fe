module.exports = {
  apps : [{
    name   : "emotion-bert",
    script : "node build",
    env_production: {
      NODE_ENV: "production",
      PORT: 3111,
    },
  }]
}
