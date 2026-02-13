import { Command } from 'commander';

const prog = new Command();
prog
  .name('test')
  .exitOverride()
  .configureOutput({ writeErr: () => {} })
  .action(() => {
    console.log('Action executed!');
  });

prog.parse(process.argv);
