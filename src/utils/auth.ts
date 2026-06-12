export const getAccessToken = () => {

  return (

    localStorage.getItem(
      "access_token"
    ) ||

    sessionStorage.getItem(
      "access_token"
    )
  );
};

export const getRefreshToken = () => {

  return (

    localStorage.getItem(
      "refresh_token"
    ) ||

    sessionStorage.getItem(
      "refresh_token"
    )
  );
};

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


export const getStorage = () => {

  return localStorage.getItem(
    "access_token"
  )

    ? localStorage

    : sessionStorage;
};

export const clearAuth = () => {

  localStorage.clear();

  sessionStorage.clear();
};