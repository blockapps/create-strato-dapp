export const GET_API_HEALTH = 'GET_API_HEALTH'
export const GET_API_HEALTH_RESPONSE = 'GET_API_HEALTH_RESPONSE'

export const getApiHealth = () => {
  return {
    type: GET_API_HEALTH
  }
}

export const getApiHealthResponse = (response) => {
  return {
    type: GET_API_HEALTH_RESPONSE,
    response
  }
}