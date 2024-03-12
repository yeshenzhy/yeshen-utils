import { RequestError } from "../common";

/** 错误消息栈，防止同一错误同时出现 */
const errorMsgStack = new Map<string | number, string>([]);

function addErrorMsg(error: RequestError) {
  errorMsgStack.set(error.code, error.message);
}
function removeErrorMsg(error: RequestError) {
  errorMsgStack.delete(error.code);
}
function hasErrorMsg(error: RequestError) {
  return errorMsgStack.has(error.code);
}

/**
 * 显示错误信息
 * @param error
 */
export function showErrorMsg(error: RequestError) {
  if (!error.message || hasErrorMsg(error)) return;

  addErrorMsg(error);
  // window.console.warn(error.code, error.message);
}
