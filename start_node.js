// Script to confirm Node.js is running
console.log('Starting the Node.js application...');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Node.js version: ${process.version}`);

// Load the actual application
try {
  require('./app.js');
} catch (error) {
  console.error('Error starting the application:');
  console.error(error);
}