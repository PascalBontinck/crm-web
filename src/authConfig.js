export const msalConfig = {
  auth: {
    clientId: "afcde9ff-162c-46c1-9731-b23b069cb488",
    authority: "https://login.microsoftonline.com/8b99237a-c75f-46f0-903b-14859147f42d",
    redirectUri: "http://localhost:5173",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const apiRequest = {
  scopes: ["api://e645e3f5-ad36-43e1-87c0-7770f1fa6684/access_as_user"],
};