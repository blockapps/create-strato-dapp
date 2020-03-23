import { rest, oauthUtil } from "blockapps-rest";
import jwtDecode from "jwt-decode";
import config from "../load.config";

const oauth = oauthUtil.init(config.nodes[0].oauth)

const CACHED_DATA = {
  serviceToken: null,
  serviceTokenExpiresAt: null,
  intServerToken: null,
  intServerTokenExpiresAt: null,
}

const SERVICE_TOKEN_LIFETIME_RESERVE_SECONDS = 5

const options = { config };

const getEmailIdFromToken = function (accessToken) {
  return jwtDecode(accessToken)["email"];
};

async function createStratoUser(accessToken) {
  try {
    let user = await rest.createUser(accessToken, options);
    return { status: 200, message: "success", user };
  } catch (e) {
    console.log(e);
    return {
      status: r.response ? e.response.status : "Unknown",
      message: `error while creating user`
    };
  }
}

const getUsernameFromDecodedToken = (decodedToken) => {
  const { tokenUsernameProperty, tokenUsernamePropertyServiceFlow } = config.nodes[0].oauth
  let username
  if (decodedToken[tokenUsernameProperty]) {
    username = decodedToken[tokenUsernameProperty]
  } else if (decodedToken[tokenUsernamePropertyServiceFlow]) {
    username = decodedToken[tokenUsernamePropertyServiceFlow]
  } else {
    username = decodedToken.email
  }
  return username
}

const getCredentialsFromToken = (token) => {
  const username = getUsernameFromDecodedToken(jwtDecode(token))
  return { username, token }
}

const getCredentialsFromTokenEnv = (envVariable) => {
  const token = process.env[envVariable]
  if (!token) throw new Error(`Env variable ${envVariable} is not set`)
  return getCredentialsFromToken(token)
}

const getServiceToken = async () => {
  let token = CACHED_DATA.serviceToken
  const expiresAt = CACHED_DATA.serviceTokenExpiresAt
  if (!token || !expiresAt || expiresAt <= (Math.floor(Date.now() / 1000) + SERVICE_TOKEN_LIFETIME_RESERVE_SECONDS)) {
    const tokenObj = await oauth.getAccessTokenByClientSecret()
    token = tokenObj.token[config.nodes[0].oauth.tokenField ? config.nodes[0].oauth.tokenField : 'access_token']
    CACHED_DATA.serviceToken = token
    CACHED_DATA.serviceTokenExpiresAt = Math.floor(tokenObj.token.expires_at / 1000)
  }
  return token
}

export default {
  getEmailIdFromToken,
  createStratoUser,
  getCredentialsFromToken,
  getUsernameFromDecodedToken,
  getCredentialsFromTokenEnv,
  getServiceToken,
};
