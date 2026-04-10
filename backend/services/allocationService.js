const axios = require('axios');

const runPythonAllocation = async (profiles) => {
    try {
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${pythonBackendUrl}/api/allocate`, profiles);
        return response.data;
    } catch (error) {
        console.error('Python API Error:', error.response?.data || error.message);
        throw new Error(`Failed to run allocation algorithm: ${error.response?.data?.detail || error.message}`);
    }
};

module.exports = {
    runPythonAllocation
};
