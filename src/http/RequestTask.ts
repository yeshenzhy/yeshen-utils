interface TaskItem {
    hash: string,// hash
    // options: any,// 参数
    task,// 请求task
    isAbort: boolean,// 是否取消
    relevance: any[]// 重复请求
}
class RequestTask {

    REQUEST_TASK: TaskItem[] = [];
    /**
     * 添加task
     * @param {Object} hash
     * @param {Object} options
     * @param {Object} task
     */
    addTask(hash, task) {
        this.REQUEST_TASK.push({
            hash,// hash
            // options,// 参数
            task,// 请求task
            isAbort: false,// 是否取消
            relevance: []// 重复请求
        })
    }
    /**
     * 查找相同task
     * @param {Object} hash
     * @return {Object} 查找的相同task
     */
    sameTask(hash) {
        for (var i = 0; i < this.REQUEST_TASK.length; i++) {
            let task = this.REQUEST_TASK[i]
            // 只查询未取消的
            if (!task.isAbort && task.hash === hash) {
                return task
            }
        }
        return null
    }
    /**
     * 移除task
     * @param {Object} hash
     */
    removeTask(hash) {
        for (var i = 0; i < this.REQUEST_TASK.length; i++) {
            let task = this.REQUEST_TASK[i]
            if (task.hash === hash) {
                this.REQUEST_TASK.splice(i, 1)
                return
            }
        }
    }

    /**
     * 查找处理task
     * @param {Object} cb
     */
    dealWithTask(cb) {
        if (this.REQUEST_TASK.length <= 0) {
            return
        }
        // let count = 0
        for (let i = 0; i < this.REQUEST_TASK.length; i++) {
            let task = this.REQUEST_TASK[i]
            cb(task)
        }
    }
    /**
     * 移除请求
     * @param {Object} judgeBack
     * @param {Object} cb
     */
    removeRequestTask(judgeBack, cb) {
        let indexArray: number[] = []
        if (this.REQUEST_TASK.length <= 0) {
            return
        }
        for (let i = 0; i < this.REQUEST_TASK.length; i++) {
            let task = this.REQUEST_TASK[i]
            if (judgeBack(task)) {
                indexArray.push(i)
            }
        }
        for (let i = indexArray.length - 1; i >= 0; i--) {
            let task = this.REQUEST_TASK[i]
            cb(task)
            this.REQUEST_TASK.splice(i, 1)
        }
    }
    /**
     * 取消全部请求
     */
    abortAll = () => {
        this.dealWithTask((task) => {
            task.task.abort()// 取消请求
            task.isAbort = true
        })
    }
}
export const requestTask = new RequestTask();