import { put, call, fork } from "redux-saga/effects";
import { message } from "antd";
import { browserHistory } from "react-router-dom";
import { setCookie, /*getCookie,*/ delCookie } from "../../util/tool";
import { fetchTopic } from "./topicSaga";
import { validateToken, getUser, sendMsg, sendReply, sendUp, queryMsg, sendTopic } from "../../services/user";

export function* getUserMsg(action) {
  try {
    const response = yield call(validateToken, { accesstoken: sessionStorage.AccessToken });
    if (response.data && response.data.success) {
      const { data } = yield call(getUser, response.data.loginname);
      yield put({ type: "USER_SGIN_IN", User: data.data });
      sessionStorage.setItem("USER_ON", JSON.stringify(data.data));
      message.info("登录成功");
    } else {
      message.error("啊哦！登录失败");
    }
  } catch (error) {
    message.error("啊哦！网络出问题了");
  }
}

export function* login({ payload }) {
  const { access_token, path, history } = payload;
  try {
    const res = yield call(validateToken, { accesstoken: access_token });
    if (res.data && res.data.success) {
      const { data } = yield call(getUser, res.data.loginname);
      yield put({ type: "USER_SGIN_IN", user: data.data });
      yield put({ type: "ACCESS_TOKEN", access_token: access_token });
      sessionStorage.setItem("USER_ON", JSON.stringify(data.data));
      sessionStorage.setItem("AccessToken", access_token);
      setCookie("access_token", access_token);
      setTimeout(() => {
        if (/detail/.test(path)) {
          browserHistory.go(-1);
        } else {
          browserHistory.go(-2);
        }
        message.info("登陆成功，正在跳转");
      }, 300);
    }
  } catch (error) {
    message.error("登陆失败");
  }
}

export function* logout(action) {
  try {
    yield put({ type: "USER_SGIN_OUT" });
    yield put({ type: "ACCESS_TOKEN", access_token: "" });
    sessionStorage.removeItem("User");
    sessionStorage.removeItem("AccessToken");
    delCookie("access_token");
  } catch (err) {
    message.error("退出失败");
  }
}

export function* handleReply({ payload }) {
  try {
    const { data } = yield call(sendReply, payload);
    if (data.success) {
      yield fork(fetchTopic, { payload: { id: payload.id } });
      message.success("评论成功");
    }
    yield put({ type: "HANDLE_REPLY_SUCCESSED" });
  } catch (error) {
    message.error("回复失败，请稍后试试");
  }
}

export function* handleMsg({ payload }) {
  try {
    const { data } = yield call(sendMsg, payload);
    if (data.success) {
      yield fork(fetchTopic, { payload: { id: payload.id } });
      message.success("回复成功");
    }
  } catch (error) {
    message.error("回复失败，请稍后试试");
  }
}

export function* handleUp({ payload }) {
  try {
    const { data } = yield call(sendUp, payload);
    if (!data.success) {
      message.success("点赞失败了");
    }
  } catch (error) {
    message.error("点赞失败了");
  }
}

export function* getMsg({ payload }) {
  try {
    const { data } = yield call(queryMsg, payload.access_token);
    if (data.success) {
      yield put({
        type: "MSG_FETCH_SUCCESSED",
        has_read_messages: data.data.has_read_messages,
        hasnot_read_messages: data.data.hasnot_read_messages
      });
    } else {
      message.error("获取消息失败");
    }
  } catch (error) {
    message.error("网络好像有问题哦");
  }
}

export function* handleTopic({ payload }) {
  try {
    const { data } = yield call(sendTopic, payload);
    if (data && data.success) {
      message.info("发表成功");
    } else {
      message.warn("标题字数太多或太少");
    }
  } catch (error) {
    console.log(error);
    message.error("网络好像有问题哦");
  }
}
