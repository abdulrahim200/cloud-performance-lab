const {parentPort} = require("worker_threads");

parentPort.on("message",(iterations)=>{
    let result = 0;

    for (let i = 0; i < iterations; i++){
        result += Math.sqrt(i);
    }
    parentPort.postMessage(result);
});
