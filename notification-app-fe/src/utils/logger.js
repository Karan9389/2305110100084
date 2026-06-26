const LogLevel = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

function formatLog(level, action, message, data = null) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [${level}] [${action}]:`;
  
  if (data) {
    console.log(logPrefix, message, data);
  } else {
    console.log(logPrefix, message);
  }
}

export const logger = {
  info: (action, message, data) => formatLog(LogLevel.INFO, action, message, data),
  warn: (action, message, data) => formatLog(LogLevel.WARN, action, message, data),
  error: (action, message, error) => {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    formatLog(LogLevel.ERROR, action, message, errorData);
  }
};

export async function fetchWithLogging(url, options = {}) {
  const startTime = performance.now();
  const method = options.method || 'GET';
  
  logger.info("API_REQUEST", `Initiating ${method} request to ${url}`);

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    if (!response.ok) {
      logger.error("API_FAILURE", `Request failed with status ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        url
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    logger.info("API_SUCCESS", `Request successful in ${duration}ms`, { 
      recordCount: data?.notifications?.length || data?.length || 0 
    });

    return data;
  } catch (error) {
    logger.error("API_EXCEPTION", "Network or parsing error occurred", error);
    throw error; 
  }
}