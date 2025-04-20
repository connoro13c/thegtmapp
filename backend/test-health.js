async function testHealth() {
  try {
    console.log('Testing backend health endpoint...');
    const response = await fetch('http://localhost:3002/health');
    const data = await response.json();
    console.log('Health response:', data);
    return true;
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return false;
  }
}

testHealth().then(result => {
  console.log('Test result:', result ? 'Success' : 'Failed');
});