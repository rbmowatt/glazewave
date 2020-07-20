// inspired by https://leanpub.com/redux-book
import { useHistory } from "react-router-dom";
import axios from "axios";
import { API } from "./../actions/types";
import { accessDenied, apiError, apiStart, apiEnd, api401 } from "./../actions/api";
import apiConfig from "./../config/api";
import { refresh } from './../lib/utils/cognito';
import TokenStorage from './../lib/utils/token_storage';

const apiMiddleware = ({ dispatch }) => (next) => (action) => {
  next(action);

  if (action.type !== API) return;
  const {
    url,
    method,
    data,
    accessToken,
    onSuccess,
    onFailure,
    label,
    headers,
  } = action.payload;
  const dataOrParams = ["GET", "DELETE"].includes(method) ? "params" : "data";

  // axios default configs
  axios.defaults.baseURL = apiConfig.host + apiConfig.port || "";
  axios.defaults.headers.common["Content-Type"] = "application/json";
  axios.defaults.headers.common["Authorization"] = `Bearer ${TokenStorage.getAccessToken()}`;
  axios.interceptors.response.use(
    response => {
      return response;
    },
    error => {
      const originalRequest = error.config;
      if(error.response.status === 401  ){
      if (!originalRequest._retry) {
        console.log('trying agaibn', originalRequest)
        originalRequest._retry = true;
        return refresh()
          .then((res) => {
              TokenStorage.setToken(res.jwt);
              axios.defaults.headers.common["Authorization"] = `Bearer ${res.jwt}`;
              return axios(originalRequest);
          });
      }else {
        dispatch(api401('unauthorized'));
      }
    }
      return Promise.reject(error);
    }
  );

  if (label) {
    dispatch(apiStart(label));
  }

  axios
    .request({
      url,
      method,
      headers,
      [dataOrParams]: data,
    })
    .then(({ data }) => {
      dispatch(onSuccess(data));
    })
    .catch((error) => {
      console.log("error", error);
      dispatch(apiError(error));
      dispatch(onFailure(error));
      if (error.response && error.response.status === 403) {
        dispatch(accessDenied(window.location.pathname));
      }
    })
    .finally(() => {
      if (label) {
        dispatch(apiEnd(label));
      }
    });
};

export default apiMiddleware;
