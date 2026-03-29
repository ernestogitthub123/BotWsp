console.log('Iniciando 🚀🚀🚀') 
import cfonts from 'cfonts';
import chalk from 'chalk';

import express from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (_req, res) => {
  res.send('Bot Online');
});

app.listen(port, () => {
  console.log(`Health check activo en el puerto ${port}`);
});

cfonts.say('JoaBot-MD', {
  font: 'chrome',
  align: 'center',
  gradient: ['red', 'magenta'],
  transition: false
});

cfonts.say('by: Joako_Freire', {
  font: 'console',
  align: 'center',
  gradient: ['red', 'magenta'],
  transition: false
});

//console.clear();

import('./main.js');
