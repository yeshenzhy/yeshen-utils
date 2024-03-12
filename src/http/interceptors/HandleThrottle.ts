import { RequestResult } from "../../common";
import { requestTask } from "../RequestTask";

export async function HandleThrottleResponse<T>(
  hash: string,
  action: () => Promise<RequestResult<T>>
) {
  return new Promise<RequestResult<T>>((resolve, reject) => {
    //节流处理
    let task = requestTask.sameTask(hash);
    if (task !== null) {
      // 重复请求
      // 添加回调
      task.relevance.push({ resolve, reject });
      return;
    }
    const request = action()
      .then((data) => {
        //节流成功处理
        let task = requestTask.sameTask(hash);
        if (task !== null) {
          for (let relevance of task.relevance) {
            // 触发成功回调
            relevance.resolve(data);
          }
        }
        resolve(data);
      })
      .catch((err) => {
        let task = requestTask.sameTask(hash);
        if (task === null) {
          return;
        }
        for (let relevance of task.relevance) {
          // 触发失败回调
          relevance.reject(err);
        }
        reject(err);
      })
      .finally(() => {
        requestTask.removeTask(hash);
      });
    requestTask.addTask(hash, request);
  });
}
