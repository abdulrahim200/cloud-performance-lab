const {Worker} = require("worker_threads");
const path = require("path");
const { worker } = require("cluster");


class WorkerPool {
    constructor(workerFile, poolSize) {
        this.workerFile = path.resolve(workerFile)
        this.poolSize = poolSize;
        this.workers = [];
        this.queue = [];
    }
    initialize() {
        for (let i = 0; i < this.poolSize; i++){
            const worker = new Worker(this.workerFile);

            const workerinfo = {
                worker,
                busy: false
            };

            this.workers.push(workerinfo)
        }
    }
    execute(data) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                data,
                resolve,
                reject
            });
            this.dispatch();
        })
    }
    dispatch() {
        for (const workerinfo of this.workers) {
            if (workerinfo.busy) {
                continue;   
            }
            const task = this.queue.shift();
            if (!task) {
                return;
            }
            workerinfo.busy = true;
            workerinfo.worker.postMessage(task.data);
            workerinfo.worker.once("message", (result) => {
                task.resolve(result);
                workerinfo.busy = false;
                this.dispatch();
            });

            workerinfo.worker.once("error", (error) => {
                task.reject(error);
                workerinfo.busy = false;
                this.dispatch();
            });
        }
    }

}

module.exports = WorkerPool

