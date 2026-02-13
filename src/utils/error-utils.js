export const normalizeError = (error) => {
  if (!error) {
    return {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred."
    };
  }

  // Firebase error
  if (error.code) {
    return {
      code: error.code,
      message: error.message || "Firebase error occurred."
    };
  }

  // Generic JS error
  if (error instanceof Error) {
    return {
      code: "JS_ERROR",
      message: error.message
    };
  }

  return {
    code: "UNEXPECTED_ERROR",
    message: "Unexpected error occurred."
  };
};
