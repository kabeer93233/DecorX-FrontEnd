export const getRole = () => {

  return (

    localStorage.getItem(
      "role"
    ) ||

    sessionStorage.getItem(
      "role"
    )
  );
};

export const getIsVerified = (): boolean => {

  return (
    localStorage.getItem("isEmailVerified") === "true" ||
    sessionStorage.getItem("isEmailVerified") === "true"
  );
};

export const clearAuth = () => {

  localStorage.clear();

  sessionStorage.clear();
};

export const getIsLoggedIn = (): boolean => {
  return localStorage.getItem("isLoggedIn") === "true";
};