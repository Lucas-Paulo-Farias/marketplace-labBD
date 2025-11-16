const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL);

client.on('connect', () => {
  console.log('Conectado ao Redis!');
});

client.on('error', (err) => {
  console.error('Erro na conexão com o Redis:', err);
});

module.exports = client;