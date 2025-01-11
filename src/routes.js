const helpCommand = require('./commands/help.js');
const aboutCommand = require('./commands/about.js');
const greetCommand = require('./commands/greet.js');
const tugasCommand = require('./commands/tugas.js')
const defaultCommand = require('./commands/default.js');

const commandRouter = async (message) => {
    const commandRouter = async (message) => {
        const [command, ...args] = message.trim().split(/\s+/);
      
        switch (command.toLowerCase()) {
          case '/help':
            return await helpCommand.execute();
          case '/about':
            return await aboutCommand.execute();
          case '/greet':
            return await greetCommand.execute(args);
          case '/tugas':
            return await tugasCommand.execute(args);
          default:
            return await defaultCommand.execute();
        }
      };
      
      module.exports = { commandRouter };
}